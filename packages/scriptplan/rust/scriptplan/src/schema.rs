use std::process::{Command as ProcessCommand, Stdio};

#[derive(Debug)]
pub struct EnvVar {
  key: String,
  value: String, // TODO: Support expressions
}

#[derive(Debug)]
pub struct Command {
  pub program: String, // TODO: Support expressions
  pub args: Vec<String>, // TODO: Support expressions
}

impl Command {
  pub fn run(&self) {
    ProcessCommand::new(&self.program)
      .args(&self.args)
      .stdin(Stdio::null())
      .stdout(Stdio::inherit())
      .output()
      .unwrap();
  }
}

#[derive(Debug)]
pub struct ScriptGroup {
  // Enforces that there's always at least 1 script
  pub first: Script,
  pub rest: Vec<Script>,
}

/**
 * TODO: Choose a better name
 */
#[derive(Debug)]
pub enum CommandGroup {
  Parallel(ScriptGroup),
  Series(ScriptGroup),
}

impl CommandGroup {
  pub fn run(&self) {
    match self {
      Self::Parallel(group) => {
        todo!();
      }
      Self::Series(group) => {
        group.first.run();
      }
    }
  }
}

/**
 * TODO: Choose a better name
 */
#[derive(Debug)]
pub enum Script {
  Command(Box<Command>),
  Alias(String),
  Group(Box<CommandGroup>)
}

impl Script {
  pub fn run(&self) {
    match self {
      Self::Alias(alias) => {
        todo!();
      }
      Self::Command(command) => {
        command.as_ref().run();
      }
      Self::Group(group) => {
        todo!();
      }
    }
  }
}
