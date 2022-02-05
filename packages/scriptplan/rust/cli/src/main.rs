use clap::{App};

use std::collections::VecDeque;

use std::fs;

use std::path::Path;

use std::sync::Arc;

use std::process::{exit, ExitStatus};

use scriptplan_bash::scriptplan_core::ScriptParser;
use scriptplan_bash::yaml_rust::YamlLoader;
use scriptplan_bash::YamlScriptParser;
use std::convert::TryFrom;

#[tokio::main]
async fn main() {
    let scriptplan_app = App::new("Scriptplan CLI")
    .setting(clap::AppSettings::TrailingVarArg)
    .arg(
        clap::Arg::new("script-file")
            .short('s')
            .long("script-file")
            .takes_value(true)
            .default_value("./scripts.yaml"),
    )
    .arg(
      clap::Arg::new("other")
        .multiple_values(true)
        .hide(true)
    );

    let initial_matches = scriptplan_app.get_matches();

    let script_file = initial_matches.value_of("script-file").unwrap();

    let other_args = initial_matches.values_of_os("other").unwrap();

    let path = Path::new(script_file);
    let s = fs::read_to_string(path).unwrap();

    let mut docs = YamlLoader::load_from_str(&s).unwrap();
    let doc = docs.remove(0);

    let map = doc.into_hash().unwrap();

    let scriptplan = YamlScriptParser::try_from(&map).unwrap();

    let app = scriptplan
        .tasks
        .keys()
        .fold(App::new("Scriptplan Tasks")
        .setting(clap::AppSettings::NoBinaryName), |temp_app, task| {
            temp_app.subcommand(
                App::new(task.to_string())
                    .setting(clap::AppSettings::TrailingVarArg)
                    .arg(clap::Arg::new("other").multiple_values(true).hide(true)),
            )
        });

    let app_matches = app.get_matches_from(other_args);

    if let Some(name) = app_matches.subcommand_name() {
        let root_task = app_matches.subcommand_matches(name).unwrap();
        let user_vars_iter: VecDeque<_> = (|| {
            if let Some(values) = root_task.values_of("other") {
                return values
                    .map(|x| Arc::new(x.to_string()))
                    .collect();
            } else {
                return VecDeque::new().into_iter().collect();
            }
        })();

        let status = scriptplan
            .parse(name)
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
