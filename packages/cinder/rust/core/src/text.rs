use crate::text::*;

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
