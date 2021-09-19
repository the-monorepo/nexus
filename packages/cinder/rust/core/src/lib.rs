use wasm_bindgen::prelude::*;

trait Component<I, O> {
  fn mount(&self) -> O;
  fn update(&self, input: I);
  fn unmount(&self);
}

trait Blueprint<I, O> {
  fn create(&self) -> dyn Component<I, O>;
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
  return DomRenderer { container };
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
}
