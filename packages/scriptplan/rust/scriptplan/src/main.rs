
mod expand;
mod schema;
use std::fs;
use std::path::Path;
use clap::{App, SubCommand};

use yaml_rust::{YamlLoader,Yaml};

use conch_parser::lexer::Lexer;
use conch_parser::parse::DefaultParser;
use expand::expand;

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

    let lex = Lexer::new(command_str.chars());

    let parser = DefaultParser::new(lex);
    for t in parser {
      // println!("{:?}\n", t);
      let ast = expand(t.unwrap());
      // println!("{:?}", ast);
      ast.run();
    }
    /*
    Command::new(&splitted[0])
      .stdin(Stdio::null())
      .stdout(Stdio::inherit())
      .args(&splitted[1..])
      .output()
      .unwrap();*/
  }
}
