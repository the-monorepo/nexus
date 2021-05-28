
mod expand;
mod schema;
use std::collections::HashMap;
use std::ffi::OsString;
use std::fs;
use std::path::Path;
use clap::{App, SubCommand};

use yaml_rust::{YamlLoader,Yaml};

use conch_parser::lexer::Lexer;
use conch_parser::parse::{Parser};
use conch_parser::ast::builder::ArcBuilder;

use conch_runtime::env::{DefaultEnvArc, DefaultEnvConfigArc};
use conch_runtime::spawn::sequence;
use conch_runtime::ExitStatus;

use std::fmt::format;

use std::process::exit;

#[tokio::main]
async fn main() {
  let path = Path::new("./.scripts.yaml");
  let s = fs::read_to_string(path).unwrap();

  let docs = YamlLoader::load_from_str(&s).unwrap();
  let doc = &docs[0];

  let mut app = App::new("Scriptplan");

  let map = doc.as_hash().unwrap();

  for key in map.keys() {
    app = app.subcommand(SubCommand::with_name(key.as_str().unwrap()).setting(clap::AppSettings::TrailingVarArg).setting(clap::AppSettings::TrailingValues).arg(clap::Arg::with_name("other").multiple(true).hidden(true)));
  }

  let matches = app.get_matches();

  if let Some(ref root_task) = matches.subcommand {
    let vars = (|| {
      if let Some(ref values) = root_task.matches.args.get("other") {
        return values.vals.iter().cloned().map(|x| x.to_str().unwrap().to_string()).collect::<Vec<_>>().join::<&str>(" ");
      } else {
        return "".to_string();
      }
    })();

    let yaml_key = Yaml::from_str(&root_task.name);

    let command_str = map.get(&yaml_key).unwrap().as_str().unwrap();

    let mut full_command_str = command_str.to_string();
    full_command_str.push_str(" ");
    full_command_str.push_str(&vars);

    let lex = Lexer::new(full_command_str.chars());

    let parser = Parser::with_builder(lex, ArcBuilder::new());

    let mut env = DefaultEnvArc::with_config(DefaultEnvConfigArc {
      interactive: true,
      ..DefaultEnvConfigArc::new().unwrap()
    });
    let cmds = parser.into_iter().map(|x| {
      x.unwrap()
    });

    let env_future_result = sequence(cmds, &mut env).await;

    let status = env_future_result.unwrap().await;

    drop(env);

    exit_with_status(status);
  }
}

fn exit_with_status(status: ExitStatus) -> ! {
  let status = match status {
      ExitStatus::Code(n) => n,
      ExitStatus::Signal(n) => n + 128,
  };

  // Have our shell exit with the result of the last command
  exit(status);
}
