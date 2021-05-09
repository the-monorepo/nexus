use std::fs;
use std::path::Path;
use clap::{App, SubCommand};

use shellwords::split;

use yaml_rust::{YamlLoader,Yaml};

use std::process::{Command, Stdio};

fn main() {
  let path = Path::new("./.scripts.yaml");
  let s = fs::read_to_string(path).unwrap();

  let docs = YamlLoader::load_from_str(&s).unwrap();
  let doc = &docs[0];

  let mut app = App::new("Rawr");

  let map = doc.as_hash().unwrap();

  for key in map.keys() {
    app = app.subcommand(SubCommand::with_name(key.as_str().unwrap()));
  }

  let matches = app.get_matches();

  if let Some(ref subcommand) = matches.subcommand {
    let yaml_key = Yaml::from_str(&subcommand.name);

    let command_str = map.get(&yaml_key).unwrap().as_str().unwrap();

    let splitted = split(command_str).unwrap();

    Command::new(&splitted[0])
      .stdin(Stdio::null())
      .stdout(Stdio::inherit())
      .args(&splitted[1..])
      .output()
      .unwrap();
  }
}
