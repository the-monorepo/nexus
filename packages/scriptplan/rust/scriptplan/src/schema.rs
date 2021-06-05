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

use std::collections::HashMap;

#[async_trait]
pub trait Runnable {
    async fn run(&mut self, args: &VarArgs) -> Result<ExitStatus, ()>;
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

pub type VarArgs = VecDeque<Arc<String>>;

#[async_trait]
impl Runnable for Command {
    async fn run(&mut self, vars: &VarArgs) -> Result<ExitStatus, ()> {
        let command_str = self.command_str.to_string() + " \"$@\"";

        let lex = Lexer::new(command_str.chars());

        let parser = Parser::with_builder(lex, ArcBuilder::new());

        let mut args = ArgsEnv::new();
        args.set_args(Arc::new(*vars));

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

#[async_trait]
impl Runnable for CommandGroup {
    async fn run(&mut self, args: &VarArgs) -> Result<ExitStatus, ()> {
        match self {
            Self::Parallel(_group) => {
                todo!();
            }
            Self::Series(group) => {
                let mut status = group.first.run(args).await.unwrap();

                for script in &mut group.rest {
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
pub enum Script {
    Command(Command),
    Alias(String),
    Group(Box<CommandGroup>),
}

#[async_trait]
impl Runnable for Script {
    async fn run(&mut self, args: &VarArgs) -> Result<ExitStatus, ()> {
        match self {
            Self::Alias(_alias) => {
                todo!();
            }
            Self::Command(command) => {
                return command.run(args).await;
            }
            Self::Group(_group) => {
                todo!();
            }
        }
    }
}

pub struct ScriptRoot<'a, A : Runnable> {
  tasks: HashMap<&'a str, A>,
}

#[async_trait(?Send)]
impl<A : Runnable> TaskRunner for ScriptRoot<'_, A> {
   async fn run_task(&mut self, task: &str, args: &VarArgs) -> Result<ExitStatus, ()> {
     self.tasks.get_mut(task).unwrap().run(args).await
  }
}
