use conch_parser::ast::builder::ArcBuilder;
use conch_parser::lexer::Lexer;
use conch_parser::parse::Parser;

use conch_runtime::env::{ArgsEnv, DefaultEnvArc, DefaultEnvConfigArc, SetArgumentsEnvironment};
use conch_runtime::spawn::{sequence, sequence_exact, sequence_slice, subshell};
use conch_runtime::ExitStatus;

use std::collections::VecDeque;

use std::future::Future;
use std::rc::Rc;
use std::sync::Arc;

use futures::future::join_all;

use async_recursion::async_recursion;
use async_trait::async_trait;

#[async_trait]
pub trait Runnable {
    async fn run(
        &mut self,
        runner: &mut impl ScriptParser,
        args: &VarArgs,
    ) -> Result<ExitStatus, ()>;
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
        Command { command_str }
    }
}

pub type VarArgs = VecDeque<Arc<String>>;

impl Command {
    pub async fn run(&self, vars: VarArgs) -> Result<ExitStatus, ()> {
        let command_str = self.command_str.trim_end().to_string() + " \"$@\"";

        let lex = Lexer::new(command_str.chars());

        let parser = Parser::with_builder(lex, ArcBuilder::new());

        let mut args = ArgsEnv::new();
        args.set_args(Arc::new(vars));

        let mut env = DefaultEnvArc::with_config(DefaultEnvConfigArc {
            interactive: true,
            args_env: args,
            ..DefaultEnvConfigArc::new().unwrap()
        });

        let cmds = parser.into_iter().map(|x| x.unwrap()).collect::<Vec<_>>();

        let env_future_result = subshell(sequence_slice(&cmds), &mut env).await;

        let status = env_future_result;

        drop(env);

        return Ok(status);
    }
}

#[derive(Debug)]
pub struct ScriptGroup {
    pub bail: bool,
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

fn merge_status(status1: ExitStatus, status2: ExitStatus) -> ExitStatus {
    if !status1.success() {
        return status2;
    }
    return status1;
}

impl CommandGroup {
    async fn run(&self, parser: &impl ScriptParser, args: VarArgs) -> Result<ExitStatus, ()> {
        // TODO: Figure out what to do with args
        match self {
            Self::Parallel(group) => {
                let mut promises = Vec::<_>::new();
                promises.push(group.first.run(parser, args.clone()));
                for script in &group.rest {
                    promises.push(script.run(parser, args.clone()));
                }

                if group.bail {
                  println!("Warning: Bail in parallel groups are currently not supported");
                }

                let results = join_all(promises).await;

                let mut status = ExitStatus::Code(0);
                for exit_status in results {
                    status = merge_status(status, exit_status.unwrap());
                }

                return Ok(status);
            }
            Self::Series(group) => {
                let mut final_status = group.first.run(parser, args.clone()).await.unwrap();
                for script in &group.rest {
                    if !final_status.success() && group.bail {
                        return Ok(final_status);
                    }
                    let status = script.run(parser, args.clone()).await.unwrap();
                    final_status = merge_status(status, final_status);
                }

                return Ok(final_status);
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

                parser
                    .parse(alias.task.as_str())
                    .unwrap()
                    .run(parser, joined_args)
                    .await
            }
        }
    }
}

pub trait ScriptParser {
    fn parse(&self, task: &str) -> Result<Rc<Script>, ()>;
}
