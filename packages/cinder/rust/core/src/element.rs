use crate::core::*;

struct ElementDomMounter {

}

enum ElementFieldEnum {

}

impl ElementDomMounter for Mounter<[ElementFieldEnum], ElementDomUpdater> {
  fn mount(self, container: &mut web_sys::Node, before: &web_sys::Node) -> ElementDomUpdater {
    todo!();
  }
}

struct ElementDomUpdater {

}

impl ElementDomUpdater for Updater<&'a str> {
  fn update(self, fields: [ElementFieldEnum]) {
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
