use conch_runtime::ExitStatus;
use yaml_rust::yaml::Hash;
use yaml_rust::Yaml;

use std::cell::RefCell;
use std::collections::HashMap;

use std::convert::TryFrom;
use std::convert::TryInto;
use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;

use shellwords::split;

use conch_parser::ast::builder::ArcBuilder;
use conch_parser::lexer::Lexer;
use conch_parser::parse::Parser;

use conch_runtime::env::{ArgsEnv, DefaultEnvArc, DefaultEnvConfigArc, SetArgumentsEnvironment};
use conch_runtime::spawn::{sequence_slice, subshell};

use async_trait::async_trait;

use crate::schema::Command;
use crate::schema::ScriptGroup;
use crate::schema::ScriptParser;
use crate::schema::VarArgs;
use crate::schema::{Alias, CommandGroup, Script};

#[derive(Debug)]
pub struct BashCommand {
    pub command_str: String,
}

impl From<&str> for BashCommand {
  fn from(command_str: &str) -> Self {
      BashCommand::from(command_str.to_string())
  }
}

impl From<String> for BashCommand {
  fn from(command_str: String) -> Self {
      BashCommand { command_str }
  }
}

#[async_trait]
impl Command for BashCommand {
    async fn run(&self, vars: VarArgs) -> Result<ExitStatus, ()> {
        let command_str = self.command_str.trim_end().to_string() + " \"$@\"";

        let lex = Lexer::new(command_str.chars());

        let parser = Parser::with_builder(lex, ArcBuilder::new());

        let mut args = ArgsEnv::new();
        args.set_args(Arc::new(vars));

        let mut env = DefaultEnvArc::with_config(DefaultEnvConfigArc {
            interactive: true,
            args_env: args,
            ..DefaultEnvConfigArc::new().unwrap()
        });

        let cmds = parser.into_iter().map(|x| x.unwrap()).collect::<Vec<_>>();

        let env_future_result = subshell(sequence_slice(&cmds), &mut env).await;

        let status = env_future_result;

        drop(env);

        return Ok(status);
    }
}

impl Script<BashCommand> {
    fn parse_command(command_str: &str) -> Script<BashCommand> {
        Script::Command(command_str.into())
    }

    fn parse_alias(alias_str: &str) -> Script<BashCommand> {
        let mut words: Vec<_> = split(alias_str).unwrap();
        Script::Alias(Alias {
            task: words.remove(0),
            args: words.into_iter().map(|string| Arc::new(string)).collect(),
        })
    }
}

impl TryFrom<&Yaml> for ScriptGroup<BashCommand> {
  type Error = ();
  fn try_from(yaml: &Yaml) -> Result<ScriptGroup<BashCommand>, Self::Error> {
    let mut obj = Vec::new();
    let yaml_list = yaml.as_vec().ok_or(())?;
    for sub_yaml in yaml_list {
        let task = sub_yaml.try_into()?;
        obj.push(task);
    }
    Ok(ScriptGroup {
        bail: false,
        first: obj.remove(0),
        rest: obj,
    })
  }
}

impl TryFrom<&Yaml> for Script<BashCommand> {
    type Error = ();

    fn try_from(yaml: &Yaml) -> Result<Self, Self::Error> {
      if let Some(command_str) = yaml.as_str() {
        return Ok(Script::parse_command(command_str));
      } else if let Some(hash) = yaml.as_hash() {
          if let Some(task) = hash.get(&Yaml::from_str("task")) {
              // TODO: Need a splitn
              return Ok(Script::parse_alias(task.as_str().unwrap()));
          } else if let Some(command_str) = hash.get(&Yaml::from_str("script")) {
              return Ok(Script::parse_command(command_str.as_str().unwrap()));
          } else if let Some(serial_yaml) = hash.get(&Yaml::from_str("series")) {
              Ok(Script::Group(Box::new(CommandGroup::Series(serial_yaml.try_into()?))))
          } else if let Some(parallel_yaml) = hash.get(&Yaml::from_str("parallel")) {
              Ok(Script::Group(Box::new(CommandGroup::Parallel(parallel_yaml.try_into()?))))
          } else {
              panic!("should never happen");
          }
      } else {
          panic!("should never happen");
      }
    }
}

enum YamlOrTask<'a> {
    NotLoaded(&'a Yaml),
    Loaded(Rc<Script<BashCommand>>),
}

pub struct LazyTask<'a> {
    yaml_or_task: RefCell<YamlOrTask<'a>>,
}

impl<'a> From<&'a Yaml> for LazyTask<'a> {
    fn from(yaml: &'a Yaml) -> Self {
      LazyTask {
        yaml_or_task: RefCell::new(YamlOrTask::NotLoaded(yaml)),
      }
    }
}

impl LazyTask<'_> {
    fn parse(&self) -> Result<Rc<Script<BashCommand>>, ()> {
        let mut yaml_or_task = self.yaml_or_task.borrow_mut();
        if let YamlOrTask::NotLoaded(ref yaml) = yaml_or_task.deref() {
            *yaml_or_task = YamlOrTask::Loaded(Rc::new((*yaml).try_into()?));
        }
        if let YamlOrTask::Loaded(ref script) = yaml_or_task.deref() {
            return Ok(script.clone());
        } else {
            panic!("Shouldn't happen");
        }
    }
}

pub struct YamlScriptParser<'a> {
    pub tasks: HashMap<&'a str, LazyTask<'a>>,
}

impl<'a> TryFrom<&'a Hash> for YamlScriptParser<'a> {
    type Error = ();

    fn try_from(yaml_object: &'a Hash) -> Result<Self, Self::Error> {
      let tasks_result: Result<HashMap<&'a str, LazyTask<'a>, _>, _> = yaml_object
        .iter()
        .map(|(yaml_name, yaml_value)| -> Result<_, Self::Error> {
          return Ok((yaml_name.as_str().ok_or(())?, yaml_value.into()));
        })
        .collect();
      Ok(YamlScriptParser {
        tasks: tasks_result?,
      })
    }
}

impl ScriptParser<BashCommand> for YamlScriptParser<'_> {
    fn parse(&self, task_name: &str) -> Result<Rc<Script<BashCommand>>, ()> {
        self.tasks
            .get(task_name)
            .expect(format!("The task {} does not exist", task_name).as_str())
            .parse()
    }
}
