mod core;
mod element;
mod text;

pub struct DomRenderer {
    container: web_sys::Node,
}

impl core::Renderer for DomRenderer {
    fn render_string(&mut self, _value: &str) {
        todo!();
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
