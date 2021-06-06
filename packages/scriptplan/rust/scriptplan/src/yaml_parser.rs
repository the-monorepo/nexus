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

use crate::schema::ScriptGroup;
use crate::schema::ScriptParser;
use crate::schema::VarArgs;
use crate::schema::{Command, Script, Alias, CommandGroup};

use async_trait::async_trait;

impl Script {
  fn parse_command(command_str: &str) -> Script {
    Script::Command(command_str.into())
  }

  fn parse_alias(alias_str: &str) -> Script {
    let mut words: Vec<_> = split(alias_str).unwrap();
    Script::Alias(Alias {
      task: words.remove(0),
      args: words.into_iter().map(|string| Arc::new(string)).collect(),
    })
  }
}


fn parse_task(yaml: &Yaml) -> Result<Script, ()> {
    if let Some(command_str) = yaml.as_str() {
        return Ok(Script::parse_command(command_str));
    } else if let Some(hash) = yaml.as_hash() {
        if let Some(task) = hash.get(&Yaml::from_str("task")) {
            // TODO: Need a splitn
            return Ok(Script::parse_alias(task.as_str().unwrap()));
        } else if let Some(command_str) = hash.get(&Yaml::from_str("script")) {
            return Ok(Script::parse_command(command_str.as_str().unwrap()));
        } else if let Some(serial_yaml) = hash.get(&Yaml::from_str("series")) {
          let mut obj = Vec::new();
          let yaml_list = serial_yaml.as_vec().unwrap();
          for sub_yaml in yaml_list {
            let task = parse_task(sub_yaml)?;
            obj.push(task);
          }
          Ok(Script::Group(Box::new(CommandGroup::Series(ScriptGroup {
            first: obj.remove(0),
            rest: obj,
          }))))
        } else {
          panic!("should never happen");
        }
    } else {
        panic!("should never happen");
    }
}

enum YamlOrTask<'a> {
    NotLoaded(&'a Yaml),
    Loaded(Rc<Script>),
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
    fn parse(&self) -> Result<Rc<Script>, ()> {
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

pub struct YamlScriptParser<'a> {
    pub tasks: HashMap<&'a str, LazyTask<'a>>,
}

pub fn create_scriptplan(yaml_object: &Hash) -> YamlScriptParser {
  YamlScriptParser {
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

impl ScriptParser for YamlScriptParser<'_> {
    fn parse(&self, task_name: &str) -> Result<Rc<Script>, ()> {
        self.tasks.get(task_name).expect(format!("The task {} does not exist", task_name).as_str()).parse()
    }
}

pub struct CompiledScript {
  args: VarArgs,
  script: Rc<Script>,
}
