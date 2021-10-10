mod schema;
mod yaml_parser;

use clap::{App, SubCommand};

use schema::ScriptParser;

use std::collections::VecDeque;

use std::convert::TryFrom;
use std::fs;

use std::path::Path;

use yaml_rust::YamlLoader;

use conch_runtime::ExitStatus;

use std::sync::Arc;

use std::process::exit;

use yaml_parser::YamlScriptParser;

#[tokio::main]
async fn main() {
    let path = Path::new("./.scripts.yaml");
    let s = fs::read_to_string(path).unwrap();

    let mut docs = YamlLoader::load_from_str(&s).unwrap();
    let doc = docs.remove(0);


    let map = doc.into_hash().unwrap();

    let scriptplan = YamlScriptParser::try_from(&map).unwrap();

    let app = scriptplan.tasks.keys().fold(App::new("Scriptplan"), |temp_app, task| {
      temp_app.subcommand(
      SubCommand::with_name(task)
        .setting(clap::AppSettings::TrailingVarArg)
        .setting(clap::AppSettings::TrailingValues)
        .arg(clap::Arg::with_name("other").multiple(true).hidden(true)))
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
    let status = match status {
        ExitStatus::Code(n) => n,
        ExitStatus::Signal(n) => n + 128,
    };

    // Have our shell exit with the result of the last command
    exit(status);
}
