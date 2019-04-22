const mbx = require('mobx-dom');
const _component$2 = mbx.elementComponent("<div></div>");

const _component$ = mbx.elementComponent("<div>Rawr! <!----></div>");

const Test = ({
  awesome,
  children
}) => function () {
  const _root$ = _component$.create();

  const _div$ = _root$.children[0];
  const _marker$ = _div$.children[1];
  return mbx.node(mbx.fields(_div$, mbx.attribute(_div$, "class", () => awesome)), mbx.children(_marker$, () => children.map(test => function () {
    const _root$2 = _component$2.create();

    const _div$2 = _root$2.children[0];
    return mbx.node(mbx.fields(_div$2, mbx.attribute(_div$2, "rawr", () => test)));
  }())));
}();