use conch_runtime::ExitStatus;
use yaml_rust::yaml::Hash;
use yaml_rust::Yaml;

use std::borrow::Borrow;
use std::borrow::BorrowMut;
use std::cell::RefCell;
use std::collections::hash_map::Keys;
use std::collections::HashMap;
use std::ops::Deref;
use std::option::Option;
use std::rc::Rc;
use std::sync::Arc;
use std::sync::Mutex;
use std::thread::current;

use crate::schema::{Command, Runnable, Script, VarArgs};

use async_trait::async_trait;

pub enum AliasOrScript<'a> {
    Alias(String),
    Script(Rc<Script<'a>>),
}
pub fn parse_task(yaml: &Yaml) -> Result<AliasOrScript, ()> {
    if let Some(command_str) = yaml.as_str() {
        return Ok(AliasOrScript::Script(Rc::new(Script::Command(Command {
            command_str: command_str.to_string(),
        }))));
    } else if let Some(hash) = yaml.as_hash() {
        if let Some(task) = hash.get(&Yaml::from_str("task")) {
            // TODO: Don't do ./$0
            return Ok(AliasOrScript::Alias(task.as_str().unwrap().to_string()));
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

pub fn parse_to_script<'a>(parser: &'a ScriptParser, task_name: &'a str) -> Result<Rc<Script<'a>>, ()> {
  let mut current = parser.parse(task_name).unwrap();

  while let AliasOrScript::Alias(alias) = current.deref() {
    current = parser.parse(alias).unwrap();
  }

  if let AliasOrScript::Script(script) = current.deref() {
    return Ok(script.clone());
  } else {
    panic!();
  }
}
