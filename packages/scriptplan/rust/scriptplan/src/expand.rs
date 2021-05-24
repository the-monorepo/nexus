/**
 * Note: Very much a MPV and a WIP
 */

use crate::schema;
use conch_parser::ast::*;
use std::env;

pub fn expand(command: TopLevelCommand<String>) -> schema::CommandGroup {
  let EMPTY_WORD: TopLevelWord<String> = TopLevelWord(ComplexWord::Single(Word::Simple(
    SimpleWord::Literal("".to_string()),
  )));

  if let TopLevelCommand(conch_parser::ast::Command::List(AndOrList { first, rest })) = command {
    match first {
      ListableCommand::Single(single_command) => match single_command {
        PipeableCommand::Simple(simple) => {
          let SimpleCommand {
            redirects_or_env_vars,
            redirects_or_cmd_words,
          } = *simple;

          /*let env_vars: Vec<_> = redirects_or_env_vars.into_iter().map(|v| match v {
            RedirectOrEnvVar::EnvVar(key, expression) => {
              let TopLevelWord(value) = expression.unwrap_or(EMPTY_WORD);
              match value {
                ComplexWord::Single(complex_word) => match complex_word {
                  Word::Simple(simple) => match simple {
                    SimpleWord::Literal(value) => {
                      return schema::EnvVar { key, value };
                    }
                  },
                },
              }
            }
            RedirectOrEnvVar::Redirect(redirect) => {
              todo!();
            }
          }).collect();*/

          let mut cmd_words: Vec<_> = redirects_or_cmd_words.into_iter().map(|v| match v {
            RedirectOrCmdWord::CmdWord(cmd_word) => {
              let TopLevelWord(top_level_word) = cmd_word;
              match top_level_word {
                ComplexWord::Single(complex) => {
                  match complex {
                    Word::Simple(simple) => {
                      match simple {
                        SimpleWord::Literal(value) => {
                          return value;
                        }
                        SimpleWord::Param(Parameter::Positional(position)) => {
                          let mut a: Vec<_> = env::args().collect();
                          return a.remove(0);
                        }
                        _ => todo!()
                      }
                    }
                    _ => todo!()
                  }
                }
                _ => todo!()
              }
            }
            _ => todo!()
          }).collect();

          let program = cmd_words.remove(0);
          let args = cmd_words[..].to_vec();

          return schema::CommandGroup::Series(
            schema::ScriptGroup {
              first: schema::Script::Command(
                std::boxed::Box::new(
                  schema::Command {
                    program,
                    args,
                  }
                )
              ),
              rest: vec![],
            }
          );
        }
        PipeableCommand::Compound(_) => {
          todo!();
        }
        PipeableCommand::FunctionDef(_, _) => {
          todo!();
        }
      },
      ListableCommand::Pipe(todo_1, todo_2) => {
        todo!();
      }
    }
  }
  todo!();
}
