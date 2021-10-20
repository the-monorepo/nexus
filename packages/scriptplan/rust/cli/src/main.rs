use clap::{App, SubCommand};

use std::collections::VecDeque;

use std::fs;

use std::path::Path;


use std::sync::Arc;

use std::process::{exit, ExitStatus};

use std::convert::TryFrom;
use scriptplan_bash::YamlScriptParser;
use scriptplan_bash::yaml_rust::YamlLoader;
use scriptplan_bash::scriptplan_core::ScriptParser;

#[tokio::main]
async fn main() {
    let path = Path::new("./scripts.yaml");
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
    // Have our shell exit with the result of the last command
    exit(status.code().unwrap());
}
