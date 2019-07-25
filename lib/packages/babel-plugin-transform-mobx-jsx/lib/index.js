'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _helperPluginUtils = require('@babel/helper-plugin-utils');

var _pluginSyntaxJsx = _interopRequireDefault(require('@babel/plugin-syntax-jsx'));

var _helperBuilderReactJsx = _interopRequireDefault(
  require('@babel/helper-builder-react-jsx'),
);

var _core = require('@babel/core');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const mbxMemberExpression = field => {
  return _core.types.memberExpression(
    _core.types.identifier('mbx'),
    _core.types.identifier(field),
  );
};

const mbxCallExpression = (functionName, args) => {
  return _core.types.callExpression(mbxMemberExpression(functionName), args);
};

const attributeLiteralToHTMLAttributeString = (name, literal) => {
  if (literal === false) {
    /*
      To represent a false value, the attribute has to be omitted altogether.
      @see https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
    */
    return '';
  }

  if (literal === null) {
    // This is like <element attrName/>
    return `${name}`;
  }

  switch (literal.type) {
    case 'StringLiteral':
      return `${name}="${literal.value.replace(/"/g, '\\"')}"`;

    case 'BooleanLiteral':
      return literal.value ? name : '';

    case 'NumericLiteral':
      return `${name}="${literal.value}"`;

    default:
      return `${name}="${literal.value.toString()}"`;
  }
};

const TEXT_TYPE = 'text';
const DYNAMIC_TYPE = 'dynamic';
const ELEMENT_TYPE = 'element';
const SUBCOMPONENT_TYPE = 'subcomponent';
const PROPERTY_TYPE = 'property';
const SPREAD_TYPE = 'spread';
const EVENT_TYPE = 'event';
const ATTRIBUTE_TYPE = 'attribute';
const SUBCOMPONENT_PROPERTY_TYPE = 'subcomponent_property';

function domNodeFromJSXText(jsxText, previousIsDynamic, scope) {
  return domNodeFromString(jsxText.value, previousIsDynamic, scope);
}

const isElementTag = tag => {
  return tag[0].toLowerCase() === tag[0];
};

const isLiteral = value => value && value.type.match(/Literal$/);

const isStatic = value => {
  return (
    value &&
    (isLiteral(value) ||
      _core.types.isArrowFunctionExpression(value) ||
      _core.types.isFunctionExpression(value))
  );
};

const fieldType = name => {
  return name.match(/^\$\$/)
    ? EVENT_TYPE
    : name.match(/^\$/)
    ? PROPERTY_TYPE
    : ATTRIBUTE_TYPE;
};

const findProgramAndOuterPath = path => {
  const parent = path.parentPath;

  if (!parent) {
    return {
      program: path,
    };
  } else {
    const result = findProgramAndOuterPath(parent);

    if (result.path) {
      return result;
    } else {
      return {
        program: result.program,
        path: path,
      };
    }
  }
};

const isRootJSXNode = path => {
  const parent = path.parent;

  if (_core.types.isJSXFragment(parent) || _core.types.isJSXElement(parent)) {
    return false;
  } else if (_core.types.isJSXExpressionContainer(parent)) {
    // TODO: Very confusing condition
    return isRootJSXNode(path.parentPath);
  } else {
    return true;
  }
};

const cleanFieldName = name => name.replace(/^\$?\$?/, '');

const valueExpressionFromJsxAttributeValue = jsxValue =>
  _core.types.isJSXExpressionContainer(jsxValue) ? jsxValue.expression : jsxValue;

const domNodesFromJSXChildren = (jsxChildren, scope, outerPath) => {
  const children = [];
  let previousChildIsDynamic = false;

  for (const child of jsxChildren) {
    for (const node of yieldDomNodeFromNodeSimplified(
      child,
      previousChildIsDynamic,
      scope,
      outerPath,
    )) {
      previousChildIsDynamic = isDynamicDomlessNode(node);
      children.push(node);
    }
  }

  return children;
};

const hasDynamicNodes = children => {
  return children.some(
    childNode =>
      childNode.type === DYNAMIC_TYPE ||
      (childNode.type === ELEMENT_TYPE && childNode.id),
  );
};

const domNodeFromJSXElement = (jsxElement, previousIsDynamic, scope, outerPath) => {
  const jsxOpeningElement = jsxElement.openingElement;
  const jsxAttributes = jsxElement.openingElement.attributes;

  if (
    _core.types.isJSXIdentifier(jsxOpeningElement.name) &&
    isElementTag(jsxOpeningElement.name.name)
  ) {
    const tag = jsxOpeningElement.name.name;
    const potentialId = scope.generateUidIdentifier(`${tag}$`);
    const fields = jsxAttributes.map(jsxAttribute => {
      const type = fieldType(jsxAttribute.name.name);

      switch (type) {
        case PROPERTY_TYPE:
          const key = cleanFieldName(jsxAttribute.name.name);

          const setterId = (() => {
            if (setterMap.has(key)) {
              return setterMap.get(key);
            } else {
              const id = outerPath.scope.generateUidIdentifier(`${key}$setter`);
              const elementId = outerPath.scope.generateUidIdentifier('element');
              const valueId = outerPath.scope.generateUidIdentifier('value');
              outerPath.insertBefore(
                constDeclaration(
                  id,
                  _core.types.arrowFunctionExpression(
                    [elementId, valueId],
                    _core.types.assignmentExpression(
                      '=',
                      _core.types.memberExpression(
                        elementId,
                        _core.types.identifier(key),
                      ),
                      valueId,
                    ),
                  ),
                ),
              );
              setterMap.set(key, id);
              return id;
            }
          })();

          return {
            type,
            setterId,
            expression: valueExpressionFromJsxAttributeValue(jsxAttribute.value),
            key,
          };

        default:
          return {
            type,
            key: cleanFieldName(jsxAttribute.name.name),
            expression: valueExpressionFromJsxAttributeValue(jsxAttribute.value),
          };
      }
    });
    const children = domNodesFromJSXChildren(jsxElement.children, scope, outerPath);
    const childrenAreDynamic = hasDynamicNodes(children);
    const nonStaticAttributeFields = fields.filter(
      field => !(field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)),
    );
    const resultNode = {
      type: ELEMENT_TYPE,
      tag,
      children,
      fields,
      id:
        previousIsDynamic || childrenAreDynamic || nonStaticAttributeFields.length > 0
          ? potentialId
          : null,
    };
    return resultNode;
  } else {
    const fields = jsxAttributes.map(jsxAttribute => {
      if (_core.types.isJSXSpreadAttribute(jsxAttribute)) {
        const result = {
          type: SPREAD_TYPE,
          expression: jsxAttribute.argument, // TODO: Check this is right
        };
        return result;
      } else {
        const result = {
          type: SUBCOMPONENT_PROPERTY_TYPE,
          key: jsxAttribute.name.name,
          expression: valueExpressionFromJsxAttributeValue(jsxAttribute.value),
        };
        return result;
      }
    });
    const children = domNodesFromJSXChildren(jsxElement.children, scope, outerPath);
    const resultNode = {
      type: SUBCOMPONENT_TYPE,
      nameExpression: jsxOpeningElement.name,
      children,
      childrenTemplateId:
        children.length > 0 ? scope.generateUidIdentifier('subTemplate') : null,
      fields,
    };
    return resultNode;
  }
};

const domNodeFromString = (aString, previousIsDynamic, scope) => {
  const html = aString.replace(/^\s*\n\s*|\s*\n\s*$/g, '');

  if (html === '') {
    return null;
  }

  return {
    type: TEXT_TYPE,
    text: html,
    id: previousIsDynamic ? scope.generateUidIdentifier('text') : null,
  };
};

const isDynamicDomlessNode = node => {
  return node.type === DYNAMIC_TYPE || node.type === SUBCOMPONENT_TYPE;
};

function* yieldDomNodeFromJSXFragment(jsxFragment, previousIsDynamic, scope, outerPath) {
  for (const child of jsxFragment.children) {
    for (const node of yieldDomNodeFromNodeSimplified(
      child,
      previousIsDynamic,
      scope,
      outerPath,
    )) {
      previousIsDynamic = isDynamicDomlessNode(node);
      yield node;
    }
  }
}

function* yieldDomNodeFromJSXExpressionContainerNode(
  node,
  previousIsDynamic,
  scope,
  outerPath,
) {
  const expression = node.expression; // TODO: Function and array literals

  if (_core.types.isJSXElement(expression) || _core.types.isJSXFragment(expression)) {
    yield* yieldDomNodeFromNodeSimplified(
      expression,
      previousIsDynamic,
      scope,
      outerPath,
    );
  } else if (_core.types.isStringLiteral(expression)) {
    // TODO: Two contained literals next to each other would lead to incorrect state length
    const textNode = domNodeFromString(expression.value, previousIsDynamic, scope);

    if (textNode) {
      yield textNode;
    }
  } else if (
    _core.types.isNumericLiteral(expression) ||
    _core.types.isBooleanLiteral(expression)
  ) {
    const textNode = domNodeFromString(
      expression.value.toString(),
      previousIsDynamic,
      scope,
    );

    if (textNode) {
      yield textNode;
    }
  } else {
    yield {
      type: DYNAMIC_TYPE,
      expression,
    };
  }
}

function* yieldDomNodeFromNodeNonSimplified(node, previousIsDynamic, scope, outerPath) {
  if (_core.types.isJSXElement(node)) {
    yield domNodeFromJSXElement(node, previousIsDynamic, scope, outerPath);
  } else if (_core.types.isJSXExpressionContainer(node)) {
    yield* yieldDomNodeFromJSXExpressionContainerNode(
      node,
      previousIsDynamic,
      scope,
      outerPath,
    );
  } else if (_core.types.isJSXFragment(node)) {
    yield* yieldDomNodeFromJSXFragment(node, previousIsDynamic, scope, outerPath);
  } else if (_core.types.isJSXText(node)) {
    const textNode = domNodeFromJSXText(node, previousIsDynamic, scope);

    if (textNode) {
      yield textNode;
    }
  } else {
    throw new Error(`Invalid node type ${node.type}`);
  }
}

function* yieldDomNodeFromNodeSimplified(node, previousIsDynamic, scope, outerPath) {
  const domNodeIterator = yieldDomNodeFromNodeNonSimplified(
    node,
    previousIsDynamic,
    scope,
    outerPath,
  );
  let previous = domNodeIterator.next();

  if (!previous.done) {
    if (previous.value.type !== TEXT_TYPE) {
      yield previous.value;
    }

    let current = domNodeIterator.next();

    while (!current.done) {
      if (previous.value.type === TEXT_TYPE && current.value.type === TEXT_TYPE) {
        // If there's two text nodes you can just concacatinate them
        previous.value.text += current.value.text;
        current = domNodeIterator.next();
      } else if (previous.value.type === TEXT_TYPE) {
        yield previous.value;
      } else {
        yield current.value;
        previous = current;
        current = domNodeIterator.next();
      }
    }

    if (previous.value.type === TEXT_TYPE) {
      yield previous.value;
    }
  }
}

const htmlFromNode = node => {
  switch (node.type) {
    case ELEMENT_TYPE:
      const tag = node.tag;
      const attributeString = node.fields
        .filter(field => field.type === ATTRIBUTE_TYPE && isLiteral(field.expression))
        .map(field => attributeLiteralToHTMLAttributeString(field.key, field.expression))
        .join(' ');
      const childrenString = node.children
        .map(field => {
          return htmlFromNode(field);
        })
        .join('');
      return `<${tag}${
        attributeString !== '' ? ` ${attributeString}` : ''
      }>${childrenString}</${tag}>`;

    case TEXT_TYPE:
      return node.text;

    default:
      return '';
  }
};

const constDeclaration = (id, expression) => {
  return _core.types.variableDeclaration('const', [
    _core.types.variableDeclarator(id, expression),
  ]);
};

const STATIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'staticElementBlueprint';
const DYNAMIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'elementBlueprint';
const STATIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'staticFragmentBlueprint';
const DYNAMIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'fragmentBlueprint';

function* yieldDeclarationStatementsFromRootNodes(nodes, rootId, isRoot) {
  const childrenWithDomNodesAssociatedWithThem = nodes.filter(
    child => child.type === ELEMENT_TYPE,
  );

  if (childrenWithDomNodesAssociatedWithThem.length > 0) {
    const firstNode = childrenWithDomNodesAssociatedWithThem[0];

    if (firstNode.id) {
      if (isRoot && childrenWithDomNodesAssociatedWithThem.length === 1) {
        yield constDeclaration(firstNode.id, rootId);
      } else {
        yield constDeclaration(
          firstNode.id,
          _core.types.memberExpression(rootId, _core.types.identifier('firstChild')),
        );
      }

      yield* yieldDeclarationStatementsFromRootNodes(
        firstNode.children,
        firstNode.id,
        false,
      );
    }

    for (let c = 1; c < childrenWithDomNodesAssociatedWithThem.length - 1; c++) {
      const childNode = childrenWithDomNodesAssociatedWithThem[c];

      if (childNode.id) {
        const previousNode = childrenWithDomNodesAssociatedWithThem[c - 1];

        if (previousNode.id) {
          yield constDeclaration(
            childNode.id,
            _core.types.memberExpression(
              previousNode.id,
              _core.types.identifier('nextSibling'),
            ),
          );
        } else {
          yield constDeclaration(
            childNode.id,
            _core.types.memberExpression(
              _core.types.memberExpression(rootId, _core.types.identifier('childNodes')),
              _core.types.numericLiteral(c),
              true,
            ),
          );
        }

        yield* yieldDeclarationStatementsFromRootNodes(
          childNode.children,
          childNode.id,
          false,
        );
      }
    } // TODO: Could do previousSibling if the last node uses lastChild

    if (childrenWithDomNodesAssociatedWithThem.length >= 2) {
      const lastNode =
        childrenWithDomNodesAssociatedWithThem[
          childrenWithDomNodesAssociatedWithThem.length - 1
        ];

      if (lastNode.id) {
        yield constDeclaration(
          lastNode.id,
          _core.types.memberExpression(rootId, _core.types.identifier('lastChild')),
        );
        yield* yieldDeclarationStatementsFromRootNodes(
          lastNode.children,
          lastNode.id,
          false,
        );
      }
    }
  }
}

const dynamicFieldExpression = (
  rootId,
  beforeId,
  previousConsecutiveDynamicNodeCount,
) => {
  if (previousConsecutiveDynamicNodeCount === 1) {
    return mbxCallExpression('children', [rootId, beforeId]);
  } else if (previousConsecutiveDynamicNodeCount >= 2) {
    return mbxCallExpression('dynamicSection', [
      rootId,
      beforeId,
      _core.types.numericLiteral(previousConsecutiveDynamicNodeCount),
    ]);
  }

  return null;
};

const setterMap = new Map();

function* yieldFieldExpressionsFromNodes(nodes, rootId) {
  let previousConsecutiveDynamicNodeCount = 0;

  for (const node of nodes) {
    switch (node.type) {
      case TEXT_TYPE:
      case ELEMENT_TYPE:
        const dynamicExpression = dynamicFieldExpression(
          rootId,
          node.id,
          previousConsecutiveDynamicNodeCount,
        );

        if (dynamicExpression !== null) {
          yield dynamicExpression;
        }

        previousConsecutiveDynamicNodeCount = 0;

        if (node.type === ELEMENT_TYPE) {
          for (const field of node.fields) {
            switch (field.type) {
              case EVENT_TYPE:
              case ATTRIBUTE_TYPE:
                if (!isLiteral(field.expression)) {
                  yield mbxCallExpression(field.type, [
                    node.id,
                    _core.types.stringLiteral(field.key),
                  ]);
                }

                break;

              case PROPERTY_TYPE:
                yield mbxCallExpression(field.type, [node.id, field.setterId]);
                break;
            }
          }

          yield* yieldFieldExpressionsFromNodes(node.children, node.id);
        }

        break;

      case SUBCOMPONENT_TYPE:
      case DYNAMIC_TYPE:
        previousConsecutiveDynamicNodeCount++;
        break;
    }
  }

  const dynamicExpression = dynamicFieldExpression(
    rootId,
    _core.types.identifier('null'),
    previousConsecutiveDynamicNodeCount,
  );

  if (dynamicExpression !== null) {
    yield dynamicExpression;
  }
}

function* yieldFieldValuesFromNode(node) {
  switch (node.type) {
    case ELEMENT_TYPE:
      for (const field of node.fields) {
        switch (field.type) {
          case ATTRIBUTE_TYPE:
            if (!isLiteral(field.expression)) {
              yield field.expression;
            }

            break;

          default:
            yield field.expression;
        }
      }

      for (const childNode of node.children) {
        yield* yieldFieldValuesFromNode(childNode);
      }

      break;

    case DYNAMIC_TYPE:
      yield node.expression;
      break;

    case SUBCOMPONENT_TYPE:
      const objectProperties = [];

      for (const field of node.fields) {
        switch (field.type) {
          case SPREAD_TYPE:
            objectProperties.push(field.expression);
            break;

          case SUBCOMPONENT_PROPERTY_TYPE:
            objectProperties.push(
              _core.types.objectProperty(
                _core.types.identifier(field.key),
                field.expression,
              ),
            );
            break;
        }
      }

      if (node.childrenTemplateId) {
        const childArgs = [node.childrenTemplateId];

        for (const childNode of node.children) {
          childArgs.push(...yieldFieldValuesFromNode(childNode));
        }

        objectProperties.push(
          _core.types.objectProperty(
            _core.types.identifier('children'),
            mbxCallExpression('componentResult', childArgs),
          ),
        );
      } // TODO: This whole block of code assumes that it's a SFC and not a string (representing an HTML element)

      yield _core.types.callExpression(_core.types.identifier(node.nameExpression.name), [
        _core.types.objectExpression(objectProperties),
      ]);
  }
}

const nodeHasDom = node => node.type === ELEMENT_TYPE || node.type === TEXT_TYPE;

function* yieldTemplateInfoFromRootNodes(nodes, templateId, scope) {
  const subcomponentNodes = nodes.filter(node => node.type === SUBCOMPONENT_TYPE);

  for (const subcomponentNode of subcomponentNodes) {
    yield* yieldTemplateInfoFromSubcomponentNode(subcomponentNode, scope);
  }

  const nodesWithDom = nodes.filter(nodeHasDom);
  const dynamicElementLength = nodes.filter(
    node =>
      node.type === DYNAMIC_TYPE ||
      node.type === SUBCOMPONENT_TYPE ||
      (node.type === ELEMENT_TYPE && node.id),
  ).length;
  const args = [
    _core.types.stringLiteral(nodes.map(node => htmlFromNode(node)).join('')),
  ];
  let templateMethod;

  if (nodesWithDom.length <= 0) {
    return;
  } else if (nodesWithDom.length === 1) {
    if (dynamicElementLength > 0) {
      templateMethod = DYNAMIC_ELEMENT_TEMPLATE_FACTORY_NAME;
    } else {
      templateMethod = STATIC_ELEMENT_TEMPLATE_FACTORY_NAME;
    }
  } else {
    if (dynamicElementLength > 0) {
      templateMethod = DYNAMIC_FRAGMENT_TEMPLATE_FACTORY_NAME;
    } else {
      templateMethod = STATIC_FRAGMENT_TEMPLATE_FACTORY_NAME;
    }
  }

  if (dynamicElementLength > 0) {
    const rootParamId = scope.generateUidIdentifier('rootNode');
    const statements = [
      ...yieldDeclarationStatementsFromRootNodes(nodes, rootParamId, true),
    ];
    const fieldExpressions = [...yieldFieldExpressionsFromNodes(nodes, rootParamId)];
    statements.push(
      _core.types.returnStatement(_core.types.arrayExpression(fieldExpressions)),
    );
    args.push(
      _core.types.arrowFunctionExpression(
        [rootParamId],
        _core.types.blockStatement(statements),
      ),
    );
  }

  yield constDeclaration(templateId, mbxCallExpression(templateMethod, args));
}

function* yieldTemplateInfoFromSubcomponentNode(node, scope) {
  if (node.childrenTemplateId) {
    yield* yieldTemplateInfoFromRootNodes(node.children, node.childrenTemplateId, scope);
  }
}

const replacePathWithDomNodeSyntax = (nodes, path, outerPath) => {
  const templateId = path.scope.generateUidIdentifier('template');
  const templateDeclarations = yieldTemplateInfoFromRootNodes(
    nodes,
    templateId,
    path.scope,
  );

  for (const statement of templateDeclarations) {
    outerPath.insertBefore(statement);
  }

  const nodesWithDom = nodes.filter(nodeHasDom);

  if (nodesWithDom.length <= 0) {
    const componentResultArgs = [];

    for (const node of nodes) {
      componentResultArgs.push(...yieldFieldValuesFromNode(node));
    }

    if (componentResultArgs.length === 1) {
      path.replaceWith(_core.types.expressionStatement(componentResultArgs[0]));
    } else {
      path.replaceWith(
        _core.types.expressionStatement(_core.types.arrayExpression(componentResultArgs)),
      );
    }
  } else {
    const componentResultArgs = [templateId];

    for (const node of nodes) {
      componentResultArgs.push(
        _core.types.arrayExpression([...yieldFieldValuesFromNode(node)]),
      );
    }

    path.replaceWith(
      _core.types.expressionStatement(
        mbxCallExpression('componentResult', componentResultArgs),
      ),
    );
  }
};

var _default = (0, _helperPluginUtils.declare)((api, options) => {
  api.assertVersion(7);
  const THROW_IF_NAMESPACE =
    options.throwIfNamespace === undefined ? true : !!options.throwIfNamespace;
  const PRAGMA_DEFAULT = options.pragma || 'mbx.createElement';
  const PRAGMA_FRAG_DEFAULT = options.pragmaFrag || 'mbx.Fragment';
  const JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  const JSX_FRAG_ANNOTATION_REGEX = /\*?\s*@jsxFrag\s+([^\s]+)/; // returns a closure that returns an identifier or memberExpression node
  // based on the given id

  const createIdentifierParser = id => () => {
    return id
      .split('.')
      .map(name => _core.types.identifier(name))
      .reduce((object, property) => _core.types.memberExpression(object, property));
  };

  const visitor = (0, _helperBuilderReactJsx.default)({
    pre(state) {
      const tagName = state.tagName;
      const args = state.args;

      if (_core.types.react.isCompatTag(tagName)) {
        args.push(_core.types.stringLiteral(tagName));
      } else {
        args.push(state.tagExpr);
      }
    },

    post(state, pass) {
      state.callee = pass.get('jsxIdentifier')();
    },

    throwIfNamespace: THROW_IF_NAMESPACE,
  });
  visitor.Program = {
    enter(path, state) {
      const { file } = state; //path.unshift(t.memberExpression(t.identifier('swek'), t.identifier(1)));

      let pragma = PRAGMA_DEFAULT;
      let pragmaFrag = PRAGMA_FRAG_DEFAULT;
      let pragmaSet = !!options.pragma;
      let pragmaFragSet = !!options.pragmaFrag;

      if (file.ast.comments) {
        for (const comment of file.ast.comments) {
          const jsxMatches = JSX_ANNOTATION_REGEX.exec(comment.value);

          if (jsxMatches) {
            pragma = jsxMatches[1];
            pragmaSet = true;
          }

          const jsxFragMatches = JSX_FRAG_ANNOTATION_REGEX.exec(comment.value);

          if (jsxFragMatches) {
            pragmaFrag = jsxFragMatches[1];
            pragmaFragSet = true;
          }
        }
      }

      state.set('jsxIdentifier', createIdentifierParser(pragma));
      state.set('jsxFragIdentifier', createIdentifierParser(pragmaFrag));
      state.set('usedFragment', false);
      state.set('pragmaSet', pragmaSet);
      state.set('pragmaFragSet', pragmaFragSet);
    },

    exit(path, state) {
      if (
        state.get('pragmaSet') &&
        state.get('usedFragment') &&
        !state.get('pragmaFragSet')
      ) {
        throw new Error(
          'transform-react-jsx: pragma has been set but ' + 'pragmafrag has not been set',
        );
      }
    },
  };

  visitor.JSXFragment = function(path) {
    if (isRootJSXNode(path)) {
      const outerPath = findProgramAndOuterPath(path).path;
      const domNodes = [
        ...yieldDomNodeFromJSXFragment(path.node, false, path.scope, outerPath),
      ];
      replacePathWithDomNodeSyntax(domNodes, path, outerPath);
    }
  };

  visitor.JSXElement = {
    exit(path) {
      if (isRootJSXNode(path)) {
        const outerPath = findProgramAndOuterPath(path).path;
        const domNode = domNodeFromJSXElement(path.node, false, path.scope, outerPath);
        replacePathWithDomNodeSyntax([domNode], path, outerPath);
      }
    },
  };
  return {
    name: 'transform-react-jsx',
    inherits: _pluginSyntaxJsx.default,
    visitor,
  };
});

exports.default = _default;
//# sourceMappingURL=index.js.map
