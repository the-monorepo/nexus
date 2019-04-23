const _subTemplate$ = mbx.elementTemplate("This is a test <!---->");

const _template$ = mbx.elementTemplate("<div class=\"test\"><!----></div>");

const Rawr = ({
  children
}) => function () {
  const _root$ = _template$.create();

  const _div$ = _root$.children[0];
  const _placeholder$ = _div$.children[0];

  const _subRoot$ = _subTemplate$.create();

  const _marker$ = _div$.children[1];
  return mbx.dynamicNode(
    _root$,
    mbx.subComponent(
      Something,
      _placeholder$,
      _subRoot$
    ), 
    mbx.children(_marker$, () => children)
  );
}();