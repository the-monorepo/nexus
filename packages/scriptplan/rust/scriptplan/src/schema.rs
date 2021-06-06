use conch_parser::ast::builder::ArcBuilder;
use conch_parser::lexer::Lexer;
use conch_parser::parse::Parser;

use conch_runtime::env::{ArgsEnv, DefaultEnvArc, DefaultEnvConfigArc, SetArgumentsEnvironment};
use conch_runtime::spawn::sequence;
use conch_runtime::ExitStatus;

use std::collections::VecDeque;

use std::ops::Deref;
use std::rc::Rc;
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

impl From<&str> for Command {
    fn from(command_str: &str) -> Self {
        Command::from(command_str.to_string())
    }
}

impl From<String> for Command {
  fn from(command_str: String) -> Self {
    Command {
      command_str,
    }
  }
}

pub type VarArgs = VecDeque<Arc<String>>;

impl Command {
    pub async fn run(&self, vars: VarArgs) -> Result<ExitStatus, ()> {
        let command_str = self.command_str.to_string() + " \"$@\"";

        let lex = Lexer::new(command_str.chars());

        let parser = Parser::with_builder(lex, ArcBuilder::new());

        let mut args = ArgsEnv::new();
        args.set_args(Arc::new(vars));

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
    async fn run(&self, parser: &impl ScriptParser, args: VarArgs) -> Result<ExitStatus, ()> {
      // TODO: Figure out what to do with args
        match self {
            Self::Parallel(_group) => {
                todo!();
            }
            Self::Series(group) => {
                let mut status = group.first.run(parser, args.clone()).await.unwrap();

                for script in &group.rest {
                    status = script.run(parser, args.clone()).await.unwrap();
                }

                return Ok(status);
            }
        }
    }
}

#[derive(Debug)]
pub struct Alias {
  pub task: String,
  pub args: VarArgs,
}

/**
 * TODO: Choose a better name
 */
#[derive(Debug)]
pub enum Script {
    Command(Command),
    Group(Box<CommandGroup>),
    Alias(Alias),
}

impl Script {
  #[async_recursion(?Send)]
  pub async fn run(&self, parser: &impl ScriptParser, args: VarArgs) -> Result<ExitStatus, ()> {
    match self {
      Script::Command(cmd) => cmd.run(args).await,
      Script::Group(group) => group.run(parser, args).await,
      Script::Alias(alias) => {
        let mut joined_args: VecDeque<Arc<String>> = args.into_iter().collect();

        for arg in alias.args.iter().rev() {
          joined_args.push_front(arg.clone())
        }

        parser.parse(alias.task.as_str()).unwrap().run(parser, joined_args).await
      },
    }
  }
}

pub trait ScriptParser {
  fn parse(&self, task: &str) -> Result<Rc<Script>, ()>;
}
