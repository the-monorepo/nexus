use clap::Command;

use std::collections::VecDeque;

use std::fs;

use std::path::Path;

use std::sync::Arc;

use std::process::{exit, ExitStatus};

use scriptplan_bash::scriptplan_core::ScriptParser;
use scriptplan_bash::yaml_rust::YamlLoader;
use scriptplan_bash::YamlScriptParser;
use std::convert::TryFrom;

use ansi_term::{
    Colour::{Cyan, Purple},
    Style,
};

fn new_cli_app<'a>(name: &'a str) -> Command<'a> {
    Command::new(name).arg(
        clap::Arg::new("script-file")
            .short('s')
            .long("script-file")
            .takes_value(true)
            .default_value("./scripts.yaml"),
    )
}

#[tokio::main]
async fn main() {
    let file_style = Style::new().fg(Purple);
    let task_style = Style::new().fg(Cyan);

    let initial_matches = new_cli_app("Scriptplan CLI")
        .trailing_var_arg(true)
        .disable_help_subcommand(true)
        .disable_help_flag(true)
        .disable_version_flag(true)
        .allow_external_subcommands(true)
        .arg(
            clap::Arg::new("help")
                .short('h')
                .long("help")
                .takes_value(false),
        )
        .get_matches();

    let script_file = initial_matches.value_of("script-file").unwrap();

    let path = Path::new(script_file);

    let script_file_result = fs::read_to_string(path);

    if let Ok(s) = script_file_result {
        let docs_result = YamlLoader::load_from_str(&s);

        if let Ok(mut docs) = docs_result {
            let doc = docs.remove(0);

            let map = doc.into_hash().unwrap();

            let scriptplan = YamlScriptParser::try_from(&map).unwrap();

            let new_app_name = format!("Scriptplan CLI (using \"{}\")", script_file);

            let app = scriptplan.tasks.keys().fold(
                new_cli_app(new_app_name.as_str())
                    .subcommand_required(true)
                    .arg_required_else_help(true)
                    .disable_version_flag(true)
                    .disable_help_subcommand(true)
,
                |temp_app, task| {
                    temp_app.subcommand(
                        Command::new(task.to_string())
                        .trailing_var_arg(true)
                        .disable_help_flag(true)
                        .disable_help_subcommand(true)
                        .disable_version_flag(true)
                            .arg(clap::Arg::new("EXTRA_ARGUMENTS").multiple_values(true)),
                    )
                },
            );

            let app_matches = app.get_matches();

            let task_subcommand = app_matches.subcommand();

            if let Some((name, root_task)) = task_subcommand {
                let user_vars_iter: VecDeque<_> = (|| {
                    if let Some(values) = root_task.values_of("EXTRA_ARGUMENTS") {
                        return values.map(|x| Arc::new(x.to_string())).collect();
                    } else {
                        return VecDeque::new().into_iter().collect();
                    }
                })();

                let status = scriptplan
                .parse(name)
                .expect(format!("\"{}\" was a valid YAML file but Script plan still wasn't able to parse the \"{}\" task. Possible a bug.", file_style.paint(script_file), task_style.paint(name)).as_str())
                .run(&scriptplan, user_vars_iter)
                .await
                .expect(format!("Tried to execute the task \"{}\" but it unexpectedly failed", task_style.paint(name)).as_str());

                exit_with_status(status);
            }
        } else {
            println!(
                "Unable to parse the script file \"{}\". Make sure the file contains valid YAML.",
                file_style.paint(script_file)
            );
        }
    } else {
        println!("Could not find script file \"{}\". Make sure the file exists and this program has permission to read it.", file_style.paint(script_file));
    }
}

fn exit_with_status(status: ExitStatus) -> ! {
    // Have our shell exit with the result of the last command
    exit(
        status.code().expect(
            "Was unable to extract a status code out from program. Possible scriptplan bug.",
        ),
    );
}
