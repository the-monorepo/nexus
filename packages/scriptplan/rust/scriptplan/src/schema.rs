use conch_parser::ast::builder::ArcBuilder;
use conch_parser::lexer::Lexer;
use conch_parser::parse::Parser;

use conch_runtime::env::{ArgsEnv, DefaultEnvArc, DefaultEnvConfigArc, SetArgumentsEnvironment};
use conch_runtime::spawn::sequence;
use conch_runtime::ExitStatus;

use std::collections::VecDeque;

use std::ops::Deref;
use std::sync::Arc;

use async_trait::async_trait;
use async_recursion::async_recursion;

use std::collections::HashMap;

#[async_trait]
pub trait Runnable {
    async fn run(&mut self, runner: &mut impl ScriptParser, args: &VarArgs) -> Result<ExitStatus, ()>;
}

#[async_trait(?Send)]
pub trait TaskRunner {
    async fn run_task(&mut self, task: &str, args: &VarArgs) -> Result<ExitStatus, ()>;
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

impl Command {
    pub async fn run(&self, vars: &VarArgs) -> Result<ExitStatus, ()> {
        let command_str = self.command_str.to_string() + " \"$@\"";

        let lex = Lexer::new(command_str.chars());

        let parser = Parser::with_builder(lex, ArcBuilder::new());

        let mut args = ArgsEnv::new();
        args.set_args(vars.clone());

        let mut env = DefaultEnvArc::with_config(DefaultEnvConfigArc {
            interactive: true,
            args_env: args,
            ..DefaultEnvConfigArc::new().unwrap()
        });

        let cmds = parser.into_iter().map(|x| x.unwrap());

        let env_future_result = sequence(cmds, &mut env).await;

        let status = env_future_result.unwrap().await;

        drop(env);

        return Ok(status);
    }
}

#[derive(Debug)]
pub struct ScriptGroup<'a> {
    // Enforces that there's always at least 1 script
    pub first: &'a Script<'a>,
    pub rest: Vec<&'a Script<'a>>,
}

/**
 * TODO: Choose a better name
 */
#[derive(Debug)]
pub enum CommandGroup<'a> {
    Parallel(ScriptGroup<'a>),
    Series(ScriptGroup<'a>),
}

impl CommandGroup<'_> {
    async fn run(&self, args: &VarArgs) -> Result<ExitStatus, ()> {
        match self {
            Self::Parallel(_group) => {
                todo!();
            }
            Self::Series(group) => {
                let mut status = group.first.run(args).await.unwrap();

                for script in &group.rest {
                    status = script.run(args).await.unwrap();
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
pub enum Script<'a> {
    Command(Command),
    Group(Box<CommandGroup<'a>>),
}

impl Script<'_> {
  #[async_recursion]
  pub async fn run(&self, args: &VarArgs) -> Result<ExitStatus, ()> {
    match self {
      Script::Command(cmd) => cmd.run(args).await,
      Script::Group(group) => group.run(args).await,
    }
  }
}

pub trait ScriptParser {
  fn parse(&mut self, task: &String) -> Result<Script, ()>;
}
