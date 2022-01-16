use clap::{App, SubCommand, Parser};

use std::collections::VecDeque;

use std::fs;

use std::path::Path;

use std::sync::Arc;

use std::process::{exit, ExitStatus};

use scriptplan_bash::scriptplan_core::ScriptParser;
use scriptplan_bash::yaml_rust::YamlLoader;
use scriptplan_bash::YamlScriptParser;
use std::convert::TryFrom;

#[derive(Parser, Debug)]
struct Cli {
  #[clap()]
  script_file: &str
}

#[tokio::main]
async fn main() {
    let scriptplan_app = App::new("Scriptplan CLI").arg(
        clap::Arg::with_name("script-file")
            .short("s")
            .long("script-file")
            .takes_value(true)
            .default_value("./scripts.yaml"),
    );

    let initial_matches = scriptplan_app.get_matches();

    let script_file = initial_matches.value_of("script-file").unwrap();

    let path = Path::new(script_file);
    let s = fs::read_to_string(path).unwrap();

    let mut docs = YamlLoader::load_from_str(&s).unwrap();
    let doc = docs.remove(0);

    let map = doc.into_hash().unwrap();

    let scriptplan = YamlScriptParser::try_from(&map).unwrap();

    let app = scriptplan
        .tasks
        .keys()
        .fold(App::new("Scriptplan Tasks"), |temp_app, task| {
            temp_app.subcommand(
                SubCommand::with_name(task)
                    .setting(clap::AppSettings::TrailingVarArg)
                    .setting(clap::AppSettings::TrailingValues)
                    .arg(clap::Arg::with_name("other").multiple(true).hidden(true)),
            )
        });

    if let Some(ref root_task) = app.get_matches().subcommand {
        let user_vars_iter: VecDeque<_> = (|| {
            if let Some(ref values) = root_task.matches.args.get("other") {
                return values
                    .vals
                    .iter()
                    .map(|x| Arc::new(x.to_str().unwrap().to_string()))
                    .collect();
            } else {
                return VecDeque::new().into_iter().collect();
            }
        })();

        let status = scriptplan
            .parse(root_task.name.as_str())
            .unwrap()
            .run(&scriptplan, user_vars_iter)
            .await
            .unwrap();

        exit_with_status(status);
    }
}

fn exit_with_status(status: ExitStatus) -> ! {
    // Have our shell exit with the result of the last command
    exit(status.code().unwrap());
}
