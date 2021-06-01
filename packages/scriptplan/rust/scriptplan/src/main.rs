mod schema;

use clap::{App, SubCommand};

use std::collections::VecDeque;

use std::fs;
use std::path::Path;

use schema::Command;
use yaml_rust::{Yaml, YamlLoader};

use conch_runtime::ExitStatus;

use schema::Runnable;

use std::collections::HashSet;

use std::sync::Arc;

use shellwords::split;

use std::process::exit;

#[tokio::main]
async fn main() {
    let path = Path::new("./.scripts.yaml");
    let s = fs::read_to_string(path).unwrap();

    let docs = YamlLoader::load_from_str(&s).unwrap();
    let doc = &docs[0];

    let mut app = App::new("Scriptplan");

    let map = doc.as_hash().unwrap();

    let mut tasks = HashSet::<&str>::new();

    for key in map.keys() {
        let value = map.get(key).unwrap();
        let subcommand = SubCommand::with_name(key.as_str().unwrap())
            .setting(clap::AppSettings::TrailingVarArg)
            .setting(clap::AppSettings::TrailingValues)
            .arg(clap::Arg::with_name("other").multiple(true).hidden(true));
        if let Some(_) = value.as_str() {
            tasks.insert(key.as_str().unwrap());
        } else if let Some(yaml_object) = value.as_hash() {
            if let Some(_) = yaml_object.get(&Yaml::from_str("task")) {
                tasks.insert(key.as_str().unwrap());
            }
        }
        app = app.subcommand(subcommand);
    }

    let matches = app.get_matches();

    if let Some(ref root_task) = matches.subcommand {
        let user_vars_iter: Vec<_> = (|| {
            if let Some(ref values) = root_task.matches.args.get("other") {
                return values
                    .vals
                    .iter()
                    .cloned()
                    .map(|x| Arc::new(x.to_str().unwrap().to_string()))
                    .collect();
            } else {
                return Vec::new().into_iter().collect();
            }
        })();

        let (task_name, task_vars) = (|| {
            if tasks.contains(root_task.name.as_str()) {
                let task_str = (|| {
                    let yaml_key = &Yaml::from_str(root_task.name.as_str());

                    let yaml_value = map.get(yaml_key).unwrap();
                    if let Some(str) = yaml_value.as_str() {
                        return str;
                    } else if let Some(hash) = yaml_value.as_hash() {
                        return hash.get(&Yaml::from_str("task")).unwrap().as_str().unwrap();
                    } else {
                        panic!("should never happen");
                    }
                })();

                // TODO: Consider supportin quotations?
                let mut split_vec = split(task_str).unwrap();
                let t = split_vec.remove(0);

                let v = split_vec.into_iter().map(|x| Arc::new(x)).collect();

                return (t, v);
            } else {
                // TODO: No clone
                return (root_task.name.clone(), Vec::new());
            }
        })();

        let vars: VecDeque<_> = task_vars.into_iter().chain(user_vars_iter).collect();

        let yaml_key = Yaml::from_str(&task_name);

        let task_yaml = map.get(&yaml_key).unwrap();

        if let Some(hash) = task_yaml.as_hash() {
            if let Some(script) = hash.get(&Yaml::from_str("script")) {
                let command_str = script.as_str().unwrap().to_string();
                let command = Command { command_str };

                let status = command.run(Arc::new(vars)).await.unwrap();
                exit_with_status(status);
            }
        }
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
