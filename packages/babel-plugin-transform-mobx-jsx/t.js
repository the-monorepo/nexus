"use strict";

const _template = mbx.elementBlueprint("<div></div>", _rootNode => {
  const _div$ = _rootNode;
  return [mbx.children(_div$, null)];
});

mbx.componentResult(_template, [TableHeader({})]);
