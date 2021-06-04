mod schema;
mod yaml_parser;

use clap::{App, SubCommand};

use std::collections::VecDeque;

use std::fs;
use std::ops::Deref;
use std::ops::DerefMut;
use std::path::Path;


use yaml_rust::{Yaml, YamlLoader};

use conch_runtime::ExitStatus;

use schema::Runnable;

use std::collections::HashSet;

use std::sync::Arc;

use shellwords::split;

use std::process::exit;

use yaml_parser::{create_scriptplan};

#[tokio::main]
async fn main() {
    let path = Path::new("./.scripts.yaml");
    let s = fs::read_to_string(path).unwrap();

    let docs = YamlLoader::load_from_str(&s).unwrap();
    let doc = &docs[0];

    let mut app = App::new("Scriptplan");

    let map = doc.as_hash().unwrap();

    let mut scriptplan = create_scriptplan(map);

    for task in scriptplan.tasks.keys() {
      let subcommand = SubCommand::with_name(task)
        .setting(clap::AppSettings::TrailingVarArg)
        .setting(clap::AppSettings::TrailingValues)
        .arg(clap::Arg::with_name("other").multiple(true).hidden(true));
      app = app.subcommand(subcommand);
    }

    let matches = app.get_matches();

    if let Some(ref root_task) = matches.subcommand {
        let user_vars_iter: VecDeque<_> = (|| {
            if let Some(ref values) = root_task.matches.args.get("other") {
                return values
                    .vals
                    .iter()
                    .cloned()
                    .map(|x| Arc::new(x.to_str().unwrap().to_string()))
                    .collect();
            } else {
                return VecDeque::new().into_iter().collect();
            }
        })();
        let status = scriptplan.run_task(root_task.name.as_str(), Arc::new(user_vars_iter)).await.unwrap();

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
