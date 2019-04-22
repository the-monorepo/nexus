const Something = ({
  children
}) => function () {
  const _template$ = mbx.elementTemplate("<div class=\"yay\">html() {\n    return HTMLDynamicChildrenMarker;\n  }</div>");

  const _template$ = _root$.create();

  const _div$ = _root$.children[0];
  const _marker$ = _div$.children[0];
  return mbx.dynamicNode(_root$, mbx.children(_marker$, () => children));
}();
