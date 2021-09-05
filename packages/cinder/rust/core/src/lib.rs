use wasm_bindgen::prelude::*;

/*type Unmount<I> = Fn(I);

type Update<I> = Fn(I) -> (Update<I>, Unmount<I>);

type Mount<I, O> = Fn(I, O) -> (Update<O>, Unmount<O>);

type Blueprint<M: Mount<_, _>> {
  clone() -> Mount;
}

type Remove = Fn(Node);
trait Client {
  fn push(node: Node) -> Remove;
}*/

#[wasm_bindgen]
pub fn render() {
    // Use `web_sys`'s global `window` function to get a handle on the global
    // window object.
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");
    let body = document.body().expect("document should have a body");

    // Manufacture the element we're gonna append
    let val = document.create_element("p").unwrap();
    val.set_text_content(Some("Hello from Rust!"));

    body.append_child(&val).unwrap();
}
