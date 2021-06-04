use conch_runtime::ExitStatus;
use yaml_rust::yaml::Hash;
use yaml_rust::Yaml;

use std::collections::HashMap;
use std::option::Option;

use crate::schema::{Command, TaskRunner, Runnable, Script, VarArgs};

use async_trait::async_trait;

pub struct Task<'a> {
    yaml: &'a Yaml,
    script: Option<Script>,
}

impl Task<'_> {
  fn new(yaml: &Yaml) -> Task {
      Task { yaml, script: None }
  }

  pub fn parse(&mut self) -> Result<&mut Script, ()> {
      if self.script.is_none() {
          if let Some(command_str) = self.yaml.as_str() {
            self.script.replace(Script::Command(Box::new(Command {
                command_str: command_str.to_string(),
            })));
          } else if let Some(hash) = self.yaml.as_hash() {
              if let Some(task) = hash.get(&Yaml::from_str("task")) {
                // TODO: Don't do ./$0
                self.script.replace(
                  Script::Command(Box::new(Command {
                    command_str: ("./$0 ".to_string() + task.as_str().unwrap()).to_string(),
                  }))
                );
              } else if let Some(command_str) = hash.get(&Yaml::from_str("script")) {
                self.script.replace(
                  Script::Command(Box::new(Command {
                    command_str: command_str.as_str().unwrap().to_string(),
                  }))
                );
              } else {
                  panic!("should never happen");
              }
          } else {
              panic!("should never happen");
          }
      }

      Ok(self.script.as_mut().unwrap())
  }
}

#[async_trait]
impl Runnable for Task<'_> {
  async fn run(&mut self, args: VarArgs) -> Result<ExitStatus, ()> {
    self.parse().unwrap().run(args).await
  }
}

pub struct ScriptPlan<'a> {
  pub tasks: HashMap<&'a str, Task<'a>>,
}

pub fn create_scriptplan(yaml_object: &Hash) -> ScriptPlan {
  ScriptPlan {
      tasks:
        yaml_object
          .iter()
          .map(|(yaml_name, yaml_value)| {
              return (yaml_name.as_str().unwrap(), Task::new(yaml_value));
          })
          .collect(),
  }
}

#[async_trait(?Send)]
impl TaskRunner for ScriptPlan<'_> {
  async fn run_task(&mut self, task: &str, args: VarArgs) -> Result<ExitStatus, ()> {
    self.tasks.get_mut(task).unwrap().run(args).await
  }
}
