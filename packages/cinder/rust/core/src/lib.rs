use wasm_bindgen::prelude::*;
use web_sys::Text;

trait Updater<I> {
  fn update(&mut self, input: I);
  fn unmount(&mut self);
}

trait Mounter<UO, U : Updater<UO>> {
  fn mount(self, container: &mut web_sys::Node, before: &web_sys::Node) -> U;
}


trait Blueprint<I, UO, U : Updater<UO>, M : Mounter<UO, U>> {
  fn create(&mut self, input: I) -> M;
}

struct TextBlueprint {

}

impl<'a> Blueprint<&'a str, &'a str, TextUpdater<'a>, TextMounter<'a>> for TextBlueprint {
    fn create(&mut self, input: &'a str) -> TextMounter<'a> {
        TextMounter {
          initial_text: input,
        }
    }
}

struct TextUpdater<'a> {
  text_node: web_sys::Text,
  text: Box<&'a str>,
}

impl<'a> Updater<&'a str> for TextUpdater<'a> {
  fn update(&mut self, input: &'a str) {
    if *self.text == input {
      return;
    }

    *self.text = input;
  }

  fn unmount(&mut self) {
    todo!()
  }
}

struct TextMounter<'a> {
  initial_text: &'a str,
}


impl<'a> Mounter<&'a str, TextUpdater<'a>> for TextMounter<'a> {
  fn mount(self, container: &mut web_sys::Node, before: &web_sys::Node) -> TextUpdater<'a> {
    let document = web_sys::window().unwrap().document().unwrap();
    let text_node = document.create_text_node(self.initial_text);
    container.insert_before(&text_node, Some(before)).unwrap();

    TextUpdater {
      text_node,
      text: Box::new(self.initial_text),
    }
  }
}

trait Renderer {
  fn render_string(&mut self, value: &str);
}

pub struct DomRenderer {
  container: web_sys::Node,
}

impl Renderer for DomRenderer {
  fn render_string(&mut self, value: &str) {

  }
}

pub fn create_dom_renderer(container: web_sys::Node) -> DomRenderer {
  /*
    // Use `web_sys`'s global `window` function to get a handle on the global
    // window object.
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");

    // Manufacture the element we're gonna append
    let val = document.create_element("p").unwrap();
    val.set_text_content(Some("Hello from Rust!"));

    body.append_child(&val).unwrap();
  */
  return DomRenderer { container };
}
