use crate::core::*;

struct ElementDomBlueprint {

}

impl Blueprint<&str, Vec<ElementFieldEnum>, ElementDomUpdater, ElementDomMounter> for ElementDomBlueprint {
  fn create(&mut self, html: &str) -> ElementDomMounter {
    let document = web_sys::window().unwrap().document().unwrap();
    let template = document.create_element("template").unwrap();
    template.set_inner_html(html);

    ElementDomMounter {
      template
    }
  }
}

struct ElementDomMounter {
  template: web_sys::Element,
}

enum ElementFieldEnum {

}

impl<'a> Mounter<Vec<ElementFieldEnum>, ElementDomUpdater> for ElementDomMounter {
  fn mount(self, container: &mut web_sys::Node, before: &web_sys::Node) -> ElementDomUpdater {
    let document = web_sys::window().unwrap().document().unwrap();
    let cloned = document.import_node_with_deep(&self.template, true).unwrap();
    // const fields = fieldFactory(cloned);
    // initialDomFieldSetter(fields, fieldValues);
    container.insert_before(&cloned, Some(before)).unwrap();
    //return renderData(cloned, fields);
    todo!();
  }
}

struct ElementDomUpdater {

}

impl Updater<Vec<ElementFieldEnum>> for ElementDomUpdater {
  fn update(&mut self, fields: Vec<ElementFieldEnum>) {
    todo!();
  }

  fn unmount(self) {
    todo!();
  }
}
/*
const template = document.createElement('template');
template.innerHTML = html;
const rootElement = template.content.firstChild as Element;
return createBlueprint(
  (fieldValues: readonly any[], container, before) => {
    const cloned = document.importNode(rootElement, true);
    const fields = fieldFactory(cloned);
    initialDomFieldSetter(fields, fieldValues);
    container.insertBefore(cloned, before);
    return renderData(cloned, fields);
  },
  domFieldSetter,
  domFieldUnmount,
);
*/
