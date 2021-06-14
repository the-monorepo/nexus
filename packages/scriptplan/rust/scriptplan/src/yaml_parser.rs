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

use crate::schema::ScriptGroup;
use crate::schema::ScriptParser;
use crate::schema::VarArgs;
use crate::schema::{Alias, CommandGroup, Script};

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

impl TryFrom<&Yaml> for ScriptGroup {
  type Error = ();
  fn try_from(yaml: &Yaml) -> Result<ScriptGroup, Self::Error> {
    let mut obj = Vec::new();
    let yaml_list = yaml.as_vec().ok_or(())?;
    for sub_yaml in yaml_list {
        let task = parse_task(sub_yaml)?;
        obj.push(task);
    }
    Ok(ScriptGroup {
        bail: false,
        first: obj.remove(0),
        rest: obj,
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

enum YamlOrTask<'a> {
    NotLoaded(&'a Yaml),
    Loaded(Rc<Script>),
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

impl<'a> From<&'a Hash> for YamlScriptParser<'a> {
    fn from(yaml_object: &'a Hash) -> Self {
      YamlScriptParser {
        tasks: yaml_object
            .iter()
            .map(|(yaml_name, yaml_value)| {
                return (yaml_name.as_str().unwrap(), yaml_value.into());
            })
            .collect(),
      }
    }
}

impl ScriptParser for YamlScriptParser<'_> {
    fn parse(&self, task_name: &str) -> Result<Rc<Script>, ()> {
        self.tasks
            .get(task_name)
            .expect(format!("The task {} does not exist", task_name).as_str())
            .parse()
    }
}

pub struct CompiledScript {
    args: VarArgs,
    script: Rc<Script>,
}
