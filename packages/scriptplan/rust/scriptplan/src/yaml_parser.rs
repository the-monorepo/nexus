use conch_runtime::ExitStatus;
use yaml_rust::yaml::Hash;
use yaml_rust::Yaml;

use std::collections::HashMap;
use std::collections::hash_map::Keys;
use std::option::Option;

use crate::schema::{Command, Runnable, Script, ScriptRunner, VarArgs};

use async_trait::async_trait;

pub struct Task<'a> {
    yaml: &'a Yaml,
    script: Option<Script>,
}

pub fn parse_task(yaml: &Yaml) -> Result<Script, ()> {
  if let Some(command_str) = yaml.as_str() {
      return Ok(Script::Command(Command {
          command_str: command_str.to_string(),
      }));
  } else if let Some(hash) = yaml.as_hash() {
      if let Some(task) = hash.get(&Yaml::from_str("task")) {
          // TODO: Don't do ./$0
          return Ok(Script::Command(Command {
              command_str: ("./$0 ".to_string() + task.as_str().unwrap()).to_string(),
          }));
      } else if let Some(command_str) = hash.get(&Yaml::from_str("script")) {
          return Ok(Script::Command(Command {
              command_str: command_str.as_str().unwrap().to_string(),
          }));
      } else {
          panic!("should never happen");
      }
  } else {
      panic!("should never happen");
  }
}

pub enum LazyTask<'a> {
  NotLoaded(&'a Yaml),
  Loaded(Script)
}

pub fn create_scriptplan(yaml_object: &Hash) -> ScriptPlan {
    ScriptPlan {
        tasks: yaml_object
          .iter()
          .map(|(yaml_name, yaml_value)| {
              return (yaml_name.as_str().unwrap().to_string(), LazyTask::NotLoaded(yaml_value));
          })
          .collect(),
    }
}

pub struct ScriptPlan<'b> {
    tasks: HashMap<String, LazyTask<'b>>,
}

impl ScriptPlan<'_> {
  pub fn task_names(&mut self) -> Keys<String, LazyTask> {
    self.tasks.keys()
  }
}
#[async_trait(?Send)]
impl ScriptRunner for ScriptPlan<'_> {
    async fn run(&mut self, script: &Script, args: &VarArgs) -> Result<ExitStatus, ()> {
        match script {
            Script::Alias(task_name_str) => {
              let task = self.tasks.remove(task_name_str).unwrap();
              match task {
                LazyTask::Loaded(real_script) => return self.run(&real_script, args).await,
                LazyTask::NotLoaded(yaml) => {
                  let loaded_script = parse_task(yaml).unwrap();
                  self.tasks.insert(task_name_str.clone(), LazyTask::Loaded(loaded_script));
                  return self.run(script, args).await;
                }
              }
            }
            Script::Command(command) => Ok(command.run(args).await.unwrap()),
            Script::Group(var) => todo!(),
        }
    }
}
