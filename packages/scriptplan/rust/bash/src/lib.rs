use yaml_rust::yaml::Hash;
use yaml_rust::Yaml;

use std::cell::RefCell;
use std::collections::HashMap;

use std::convert::TryFrom;
use std::ops::Deref;
use std::process::Stdio;
use std::rc::Rc;
use std::sync::Arc;

use shellwords::split;

use async_trait::async_trait;

use std::process::{ExitStatus};

use scriptplan_core::Command;
use scriptplan_core::ScriptGroup;
use scriptplan_core::ScriptParser;
use scriptplan_core::VarArgs;
use scriptplan_core::{Alias, CommandGroup, Script};

use tokio;
use tokio::io::AsyncWriteExt;

pub extern crate scriptplan_core;
pub extern crate yaml_rust;

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
      let mut arg = String::from("");
      for i in vars {
        arg += " ";
        arg += (*i).as_str();
      }

      let mut process = tokio::process::Command::new("bash")
        .stdin(Stdio::piped())
        .stdout(Stdio::inherit())
        .spawn()
        .unwrap();

      process.stdin.take().unwrap().write_all((self.command_str.to_string() + arg.as_str()).as_bytes()).await.unwrap();

      let output = process.wait_with_output().await.unwrap();

      let status = output.status;

      return Ok(status);
    }
}

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

fn yaml_to_group(yaml: &Yaml) -> Result<ScriptGroup<BashCommand>, ()> {
  let yaml_list = yaml.as_vec().ok_or(())?;

  let mut scripts_iter = yaml_list.iter().map(yaml_to_script);

  let first = (scripts_iter.next().unwrap())?;

  let scripts_result: Result<Vec<_>, _> = scripts_iter.collect();
  let scripts = scripts_result?;

  Ok(ScriptGroup {
      bail: false,
      first,
      rest: scripts,
  })
}


fn yaml_to_script(yaml: &Yaml) -> Result<Script<BashCommand>, ()> {
  if let Some(command_str) = yaml.as_str() {
    return Ok(parse_command(command_str));
  } else if let Some(hash) = yaml.as_hash() {
      if let Some(task) = hash.get(&Yaml::from_str("task")) {
          // TODO: Need a splitn
          return Ok(parse_alias(task.as_str().unwrap()));
      } else if let Some(command_str) = hash.get(&Yaml::from_str("script")) {
          return Ok(parse_command(command_str.as_str().unwrap()));
      } else if let Some(serial_yaml) = hash.get(&Yaml::from_str("series")) {
          Ok(Script::Group(Box::new(CommandGroup::Series(yaml_to_group(serial_yaml)?))))
      } else if let Some(parallel_yaml) = hash.get(&Yaml::from_str("parallel")) {
          Ok(Script::Group(Box::new(CommandGroup::Parallel(yaml_to_group(parallel_yaml)?))))
      } else {
          panic!("should never happen");
      }
  } else {
      panic!("should never happen");
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
        match yaml_or_task.deref() {
          &YamlOrTask::Loaded(ref script) => {
            return Ok(script.clone());
          },
          &YamlOrTask::NotLoaded(ref yaml) => {
            let script: Rc<Script<BashCommand>> = Rc::new(yaml_to_script(*yaml)?);
            let script_cell = script.clone();

            *yaml_or_task = YamlOrTask::Loaded(script);

            return Ok(script_cell);
          }
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
