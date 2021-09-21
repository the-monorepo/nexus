use crate::text::*;

struct TextDomBlueprint {

}

impl<'a> Blueprint<&'a str, &'a str, TextDomUpdater<'a>, TextDomMounter<'a>> for TextDomBlueprint {
    fn create(&mut self, input: &'a str) -> TextDomMounter<'a> {
      TextDomMounter {
          initial_text: input,
        }
    }
}

struct TextDomUpdater<'a> {
  text_node: web_sys::Text,
  text: Box<&'a str>,
}

impl<'a> Updater<&'a str> for TextDomUpdater<'a> {
  fn update(&mut self, input: &'a str) {
    if *self.text == input {
      return;
    }

    *self.text = input;
    self.text_node.set_text_content(input);
  }

  fn unmount(&mut self) {
    todo!()
  }
}

struct TextDomMounter<'a> {
  initial_text: &'a str,
}


impl<'a> Mounter<&'a str, TextDomUpdater<'a>> for TextDomMounter<'a> {
  fn mount(self, container: &mut web_sys::Node, before: &web_sys::Node) -> TextDomUpdater<'a> {
    let document = web_sys::window().unwrap().document().unwrap();
    let text_node = document.create_text_node(self.initial_text);
    container.insert_before(&text_node, Some(before)).unwrap();

    TextDomUpdater {
      text_node,
      text: Box::new(self.initial_text),
    }
  }
}
