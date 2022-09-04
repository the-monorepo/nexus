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

use scriptplan_lang_utils::{apply_args, has_parameters};

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
        async fn run_script<'a, CommandGeneric: Command>(
            script: &'a Script<CommandGeneric>,
            args: &VarArgs,
            parser: &impl ScriptParser<CommandGeneric>,
        ) -> Result<ExitStatus, ()> {
            match script {
                Script::Alias(alias) => {
                    alias
                        .run(
                            parser,
                            if has_parameters(&alias.args) {
                                clone_args(&args)
                            } else {
                                VecDeque::new()
                            },
                        )
                        .await
                }
                default => default.run(parser, clone_args(&args)).await,
            }
        }
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
                    promises.push(run_script(command, &args, parser));

                    command = next_command;
                }

                let last_result = run_script(command, &args, parser);
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
                    let mut exit_status = run_script(&group.first, &args, parser).await.unwrap();

                    for command in rest_iter {
                        exit_status = merge_status(
                            exit_status,
                            run_script(&command, &args, parser).await.unwrap(),
                        );
                    }

                    exit_status = merge_status(
                        exit_status,
                        run_script(last_command, &args, parser).await.unwrap(),
                    );

                    Ok(exit_status)
                } else {
                    Ok(run_script(&group.first, &args, parser).await.unwrap())
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

impl Alias {
    #[async_recursion(?Send)]
    pub async fn run<CommandGeneric: Command>(
        &self,
        parser: &impl ScriptParser<CommandGeneric>,
        args: VarArgs,
    ) -> Result<ExitStatus, ()> {
        let final_args = (|| {
            let has_params = has_parameters(&self.args);

            if has_params {
                apply_args(&self.args, &args)
            } else {
                let joined_args: VecDeque<Arc<String>> = self
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
            .parse(self.task.as_str())
            .unwrap()
            .run(parser, final_args)
            .await
    }
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
            Script::Alias(alias) => alias.run(parser, args).await,
        }
    }
}

pub trait ScriptParser<CommandGeneric: Command> {
    fn parse(&self, task: &str) -> Result<Rc<Script<CommandGeneric>>, ()>;
}
