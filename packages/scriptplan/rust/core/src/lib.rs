use std::collections::VecDeque;
use std::rc::Rc;
use std::sync::Arc;
use std::process::ExitStatus;

use futures::future::join_all;

use async_recursion::async_recursion;
use async_trait::async_trait;

#[async_trait]
pub trait Command {
    async fn run(&self, args: VarArgs) -> Result<ExitStatus, ()>;
}

pub type VarArgs = VecDeque<Arc<String>>;
#[derive(Debug)]
pub struct ScriptGroup<CommandGeneric : Command> {
    pub bail: bool,
    // Enforces that there's always at least 1 script
    pub first: Script<CommandGeneric>,
    pub rest: Vec<Script<CommandGeneric>>,
}

/**
 * TODO: Choose a better name
 */
#[derive(Debug)]
pub enum CommandGroup<CommandGeneric : Command> {
    Parallel(ScriptGroup<CommandGeneric>),
    Series(ScriptGroup<CommandGeneric>),
}

fn merge_status(status1: ExitStatus, status2: ExitStatus) -> ExitStatus {
    if !status1.success() {
        return status2;
    }
    return status1;
}

impl<CommandGeneric: Command> CommandGroup<CommandGeneric> {
    async fn run(&self, parser: &impl ScriptParser<CommandGeneric>, args: VarArgs) -> Result<ExitStatus, ()> {
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

                let mut status = Option::None;
                for exit_status_result in results {
                  let exit_status = exit_status_result.unwrap();
                  if let Some(current_status) = status {
                    status = Some(merge_status(current_status, exit_status));
                  } else {
                    status = Some(exit_status);
                  }
                }

                return Ok(status.unwrap());
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
pub enum Script<CommandGeneric : Command> {
    Command(CommandGeneric),
    Group(Box<CommandGroup<CommandGeneric>>),
    Alias(Alias),
}

impl<CommandGeneric : Command> Script<CommandGeneric> {
    #[async_recursion(?Send)]
    pub async fn run(&self, parser: &impl ScriptParser<CommandGeneric>, args: VarArgs) -> Result<ExitStatus, ()> {
        match self {
            Script::Command(cmd) => cmd.run(args).await,
            Script::Group(group) => group.run(parser, args).await,
            Script::Alias(alias) => {
              let joined_args: VecDeque<Arc<String>> = alias.args.iter().into_iter().map(|arg| arg.clone()).chain(args.into_iter()).collect();

                parser
                    .parse(alias.task.as_str())
                    .unwrap()
                    .run(parser, joined_args)
                    .await
            }
        }
    }
}

pub trait ScriptParser<CommandGeneric : Command> {
    fn parse(&self, task: &str) -> Result<Rc<Script<CommandGeneric>>, ()>;
}
