use conch_parser::lexer::Lexer;
use conch_parser::parse::{Parser};
use conch_parser::ast::builder::ArcBuilder;

use conch_runtime::env::{DefaultEnvArc, DefaultEnvConfigArc, ArgsEnv, SetArgumentsEnvironment};
use conch_runtime::spawn::{sequence, sequence_exact};
use conch_runtime::ExitStatus;

use std::collections::VecDeque;
use std::future::Future;
use std::sync::Arc;

use std::process::exit;

use async_trait::async_trait;

#[async_trait]
pub trait Runnable {
  async fn run(&self, args: VarArgs) -> Result<ExitStatus, ()>;
}

#[derive(Debug)]
pub struct EnvVar {
  key: String,
  value: String, // TODO: Support expressions
}

#[derive(Debug)]
pub struct Command {
  pub command_str: String,
}

pub type VarArgs = Arc<VecDeque<Arc<String>>>;

#[async_trait]
impl Runnable for Command {
  async fn run(&self, vars: VarArgs) -> Result<ExitStatus, ()> {
    let command_str = self.command_str.to_string() + " \"$@\"";

    let lex = Lexer::new(command_str.chars());

    let parser = Parser::with_builder(lex, ArcBuilder::new());

    let mut args = ArgsEnv::new();
    args.set_args(vars);

    let mut env = DefaultEnvArc::with_config(DefaultEnvConfigArc {
      interactive: true,
      args_env: args,
      ..DefaultEnvConfigArc::new().unwrap()
    });

    let cmds = parser.into_iter().map(|x| {
      x.unwrap()
    });

    let env_future_result = sequence(cmds, &mut env).await;

    let status = env_future_result.unwrap().await;

    drop(env);

    return Ok(status);
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

#[async_trait]
impl Runnable for CommandGroup {
  async fn run(&self, args: VarArgs) -> Result<ExitStatus, ()> {
    match self {
      Self::Parallel(group) => {
        todo!();
      }
      Self::Series(group) => {
        let mut status = group.first.run(args.clone()).await.unwrap();

        for script in &group.rest {
          status = script.run(args.clone()).await.unwrap();
        }

        return Ok(status);
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

#[async_trait]
impl Runnable for Script {
  async fn run(&self, args: VarArgs) -> Result<ExitStatus, ()> {
    match self {
      Self::Alias(alias) => {
        todo!();
      }
      Self::Command(command) => {
        return command.as_ref().run(args).await;
      }
      Self::Group(group) => {
        todo!();
      }
    }
  }
}
