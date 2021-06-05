use conch_runtime::ExitStatus;
use yaml_rust::yaml::Hash;
use yaml_rust::Yaml;

use std::cell::RefCell;
use std::collections::HashMap;
use std::collections::VecDeque;
use std::ops::Deref;
use std::rc::Rc;
use std::sync::Arc;

use shellwords::split;

use crate::schema::VarArgs;
use crate::schema::{Command, Script};

use async_trait::async_trait;

#[derive(Debug)]
struct Alias {
  task: String,
  args: VarArgs,
}

#[derive(Debug)]
enum AliasOrScript<'a> {
    Alias(Alias),
    Script(Rc<Script<'a>>),
}
fn parse_task(yaml: &Yaml) -> Result<AliasOrScript, ()> {
    if let Some(command_str) = yaml.as_str() {
        return Ok(AliasOrScript::Script(Rc::new(Script::Command(Command {
            command_str: command_str.to_string(),
        }))));
    } else if let Some(hash) = yaml.as_hash() {
        if let Some(task) = hash.get(&Yaml::from_str("task")) {
            // TODO: Need a splitn
            let mut words: Vec<_> = split(task.as_str().unwrap()).unwrap();
            return Ok(AliasOrScript::Alias(Alias {
              task: words.remove(0),
              args: Arc::new(words.into_iter().map(|string| Arc::new(string)).collect()),
            }));
        } else if let Some(command_str) = hash.get(&Yaml::from_str("script")) {
            return Ok(AliasOrScript::Script(Rc::new(Script::Command(Command {
                command_str: command_str.as_str().unwrap().to_string(),
            }))));
        } else {
            panic!("should never happen");
        }
    } else {
        panic!("should never happen");
    }
}

pub enum YamlOrTask<'a> {
    NotLoaded(&'a Yaml),
    Loaded(Rc<AliasOrScript<'a>>),
}

pub struct LazyTask<'a> {
    yaml_or_task: RefCell<YamlOrTask<'a>>,
}

fn create_lazy_task(yaml: &Yaml) -> LazyTask {
    LazyTask {
        yaml_or_task: RefCell::new(YamlOrTask::NotLoaded(yaml)),
    }
}
impl LazyTask<'_> {
    fn parse(&self) -> Result<Rc<AliasOrScript>, ()> {
      let mut yaml_or_task = self.yaml_or_task.borrow_mut();
        if let YamlOrTask::NotLoaded(ref yaml) = yaml_or_task.deref() {
          *yaml_or_task = YamlOrTask::Loaded(Rc::new(parse_task(yaml).unwrap()));
        }
        if let YamlOrTask::Loaded(ref script) = yaml_or_task.deref() {
            return Ok(script.clone());
        } else {
            panic!("Shouldn't happen");
        }
    }
}

pub struct ScriptParser<'a> {
    pub tasks: HashMap<&'a str, LazyTask<'a>>,
}

pub fn create_scriptplan(yaml_object: &Hash) -> ScriptParser {
    ScriptParser {
        tasks: yaml_object
            .iter()
            .map(|(yaml_name, yaml_value)| {
                return (
                    yaml_name.as_str().unwrap(),
                    create_lazy_task(yaml_value),
                );
            })
            .collect(),
    }
}

impl ScriptParser<'_> {
    pub fn parse(&self, task_name: &str) -> Result<Rc<AliasOrScript>, ()> {
        self.tasks.get(task_name).expect(format!("The task {} does not exist", task_name).as_str()).parse()
    }
}

pub struct CompiledScript<'a> {
  args: VarArgs,
  script: Rc<Script<'a>>,
}

fn concat_var_args(args1: &VarArgs, args2: &VarArgs) -> VarArgs {
  return Arc::new(args1.iter().chain(args2.iter()).map(|x| x.clone()).collect());
}

impl CompiledScript<'_> {
  pub async fn run(&mut self, args: &VarArgs) -> Result<ExitStatus, ()> {
    self.script.run(&concat_var_args(&self.args, args)).await
  }
}

pub fn parse_to_script<'a>(parser: &'a ScriptParser, task_name: &'a str) -> Result<CompiledScript<'a>, ()> {
  let mut current = parser.parse(task_name).unwrap();
  let mut args: VecDeque<Arc<String>> = VecDeque::new();

  while let AliasOrScript::Alias(alias) = current.deref() {
    for arg in alias.args.iter().rev() {
      args.push_front(arg.clone())
    }
    current = parser.parse(&alias.task).unwrap();
  }

  if let AliasOrScript::Script(script) = current.deref() {
    return Ok(CompiledScript {
      args: Arc::new(args),
      script: script.clone(),
    });
  } else {
    panic!();
  }
}
