use std::collections::vec_deque::Iter;
use std::collections::VecDeque;
use std::iter::{Chain, Iterator, Once};
use std::process::ExitStatus;
use std::rc::Rc;
use std::sync::Arc;

use futures::future::join_all;
use futures::join;

use async_recursion::async_recursion;
use async_trait::async_trait;

#[async_trait]
pub trait Command {
    async fn run(&self, args: VarArgs) -> Result<ExitStatus, ()>;
}

pub type VarArgs = VecDeque<Arc<String>>;
#[derive(Debug)]
pub struct ScriptGroup<CommandGeneric: Command> {
    pub bail: bool,
    // Enforces that there's always at least 1 script
    pub first: Script<CommandGeneric>,
    pub rest: VecDeque<Script<CommandGeneric>>,
}

impl<CommandGeneric: Command> ScriptGroup<CommandGeneric> {
    fn iter(&self) -> Chain<Once<&'_ Script<CommandGeneric>>, Iter<'_, Script<CommandGeneric>>> {
        std::iter::once(&self.first).chain(self.rest.iter())
    }
}

// TODO: Don't do this lol :3
fn clone_args(args: &VarArgs) -> VarArgs {
    return args.iter().map(|x| x.clone()).collect();
}

/**
 * TODO: Choose a better name
 */
#[derive(Debug)]
pub enum CommandGroup<CommandGeneric: Command> {
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
    async fn run(
        &self,
        parser: &impl ScriptParser<CommandGeneric>,
        args: VarArgs,
    ) -> Result<ExitStatus, ()> {
        // TODO: Figure out what to do with args
        match self {
            Self::Parallel(group) => {
                if group.bail {
                    println!("Warning: Bail in parallel groups are currently not supported");
                }

                let mut promises = Vec::<_>::new();

                let mut group_iter = group.iter();
                let mut command = group_iter.next().unwrap();

                while let Some(next_command) = group_iter.next() {
                    promises.push(command.run(parser, clone_args(&args)));

                    command = next_command;
                }

                let last_result = command.run(parser, clone_args(&args));
                let (results, last) = join!(join_all(promises), last_result);

                let final_status =
                    results
                        .into_iter()
                        .fold(last.unwrap(), |prev_exit_status, this_result| {
                            if let Ok(current_status) = this_result {
                                return merge_status(prev_exit_status, current_status);
                            } else {
                                // TODO: Do something with the error
                                return prev_exit_status;
                            }
                        });

                return Ok(final_status);
            }
            Self::Series(group) => {
                let mut rest_iter = group.rest.iter();
                if let Some(last_command) = rest_iter.next_back() {
                    let mut exit_status = group.first.run(parser, clone_args(&args)).await.unwrap();

                    for command in rest_iter {
                        exit_status = merge_status(
                            exit_status,
                            command.run(parser, clone_args(&args)).await.unwrap(),
                        );
                    }

                    exit_status = merge_status(
                        exit_status,
                        last_command.run(parser, clone_args(&args)).await.unwrap(),
                    );

                    Ok(exit_status)
                } else {
                    Ok(group.first.run(parser, args).await.unwrap())
                }
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
pub enum Script<CommandGeneric: Command> {
    Command(CommandGeneric),
    Group(Box<CommandGroup<CommandGeneric>>),
    Alias(Alias),
}

impl<CommandGeneric: Command> Script<CommandGeneric> {
    #[async_recursion(?Send)]
    pub async fn run(
        &self,
        parser: &impl ScriptParser<CommandGeneric>,
        args: VarArgs,
    ) -> Result<ExitStatus, ()> {
        match self {
            Script::Command(cmd) => cmd.run(args).await,
            Script::Group(group) => group.run(parser, args).await,
            Script::Alias(alias) => {
                let final_args = (|| {
                    let has_parameters = alias.args.iter().any(|arg| (*arg).contains("$"));

                    if has_parameters {
                        let mapped_args_joined_args: VecDeque<Arc<String>> = alias
                            .args
                            .iter()
                            .map(|arg| {
                                let arc = arg.clone();
                                let char_result = arc.chars().nth(0);
                                if char_result.map_or_else(|| false, |c| c == '$') && arc.len() >= 2
                                {
                                    let index_string_slice = &arc[1..arc.len()];
                                    if index_string_slice.chars().all(char::is_numeric) {
                                        let index = index_string_slice.parse().unwrap();
                                        if index < args.len() {
                                            return args[index].clone();
                                        } else {
                                            panic!("{} was not provided", index);
                                        }
                                    } else {
                                        return arc;
                                    }
                                } else {
                                    return arc;
                                }
                            })
                            .collect();

                        return mapped_args_joined_args;
                    } else {
                        let joined_args: VecDeque<Arc<String>> = alias
                            .args
                            .iter()
                            .into_iter()
                            .map(|arg| arg.clone())
                            .chain(args.into_iter())
                            .collect();

                        return joined_args;
                    }
                })();

                parser
                    .parse(alias.task.as_str())
                    .unwrap()
                    .run(parser, final_args)
                    .await
            }
        }
    }
}

pub trait ScriptParser<CommandGeneric: Command> {
    fn parse(&self, task: &str) -> Result<Rc<Script<CommandGeneric>>, ()>;
}
