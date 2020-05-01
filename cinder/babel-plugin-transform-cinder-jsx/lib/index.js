"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var core = _interopRequireWildcard(require("@babel/core"));

var _helperBuilderReactJsx = _interopRequireDefault(require("@babel/helper-builder-react-jsx"));

var _helperPluginUtils = require("@babel/helper-plugin-utils");

var _pluginSyntaxJsx = _interopRequireDefault(require("@babel/plugin-syntax-jsx"));

var t = _interopRequireWildcard(require("@babel/types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const cinderMemberExpression = field => {
  return t.memberExpression(t.identifier('cinder'), t.identifier(field));
};

const cinderCallExpression = (functionName, args) => {
  return t.callExpression(cinderMemberExpression(functionName), args);
};

const attributeLiteralToHTMLAttributeString = field => {
  const {
    key: name,
    expression: literalPath
  } = field; // TODO: Refactor

  const literal = literalPath.node;

  if (literal === null) {
    // This is like <element attrName/>
    return `${name}`;
  }

  if (literalPath.isStringLiteral()) {
    return `${name}=${literalPath}`;
  } else if (literalPath.isBooleanLiteral()) {
    return literalPath.node.value ? name : '';
  } else if (literalPath.isNumericLiteral() || literalPath.isBig) {
    return `${name}="${literalPath.node.value}"`;
  } else if (literalPath.isTemplateLiteral()) {
    return literalPath.node.quasis[0];
  } else if (literal.value !== undefined) {
    return `${name}=${literalPath.node.value.toString()}`;
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

var _default = (0, _helperPluginUtils.declare)((api, options) => {
  api.assertVersion(7);

  function domNodeFromJSXText(path, previousIsDynamic, scope) {
    return domNodeFromString(path.node.value, previousIsDynamic, scope);
  }

  const isElementTag = tag => {
    return tag[0].toLowerCase() === tag[0];
  };

  const isLiteral = value => {
    return value.node !== undefined && value.node !== null && value.isLiteral() && (!value.isTemplateLiteral() || value.node.expressions.length <= 0);
  };
  /*const isStatic = value => {
    return (
      value &&
      (isLiteral(value) ||
        t.isArrowFunctionExpression(value) ||
        t.isFunctionExpression(value))
    );
  };*/


  const fieldType = name => {
    return name.match(/^\$\$/) ? EVENT_TYPE : name.match(/^\$/) ? PROPERTY_TYPE : ATTRIBUTE_TYPE;
  };

  const findProgramAndOuterPath = path => {
    const parent = path.parentPath;

    if (!parent) {
      return {
        program: path
      };
    } else {
      const result = findProgramAndOuterPath(parent);

      if (result.path) {
        return result;
      } else {
        return {
          program: result.program,
          path: path
        };
      }
    }
  };

  const isRootJSXNode = path => {
    const parent = path.parentPath;

    if (parent.isJSXFragment() || parent.isJSXElement()) {
      return false;
    } else if (parent.isJSXExpressionContainer()) {
      // TODO: Very confusing condition
      return isRootJSXNode(parent);
    } else {
      return true;
    }
  };

  const cleanFieldName = name => name.replace(/^\$?\$?/, '');

  const valueExpressionFromJsxAttributeValue = valuePath => {
    let current = valuePath;

    while (current.isJSXExpressionContainer()) {
      current = valuePath.get('expression');
    }

    return current;
  };

  const domNodesFromJSXChildren = (jsxChildrenPaths, scope, outerPath) => {
    const children = [];
    let previousNode = null;

    for (const childPath of jsxChildrenPaths) {
      for (const node of yieldDomNodeFromNodeSimplified(childPath, previousNode !== null && isDynamicDomlessNode(previousNode), scope, outerPath)) {
        previousNode = node;
        children.push(node);
      }
    }

    return children;
  };

  const hasDynamicNodes = children => {
    return children.some(childNode => childNode.type === DYNAMIC_TYPE || childNode.type === ELEMENT_TYPE && childNode.id || SUBCOMPONENT_TYPE);
  };

  const domNodeFromJSXElement = (path, previousIsDynamic, scope, outerPath) => {
    const jsxOpeningElementPath = path.get('openingElement');
    const jsxAttributePathsOrPath = jsxOpeningElementPath.get('attributes');
    const jsxAttributePaths = Array.isArray(jsxAttributePathsOrPath) ? jsxAttributePathsOrPath : [jsxAttributePathsOrPath];
    const jsxOpeningElementNamePath = jsxOpeningElementPath.get('name');

    if (jsxOpeningElementNamePath.isJSXIdentifier() && isElementTag(jsxOpeningElementNamePath.node.name)) {
      const tag = jsxOpeningElementNamePath.node.name;
      const potentialId = scope.generateUidIdentifier(`${tag}$`);
      const fields = jsxAttributePaths.map(jsxAttributePath => {
        if (jsxAttributePath.isJSXSpreadAttribute()) {
          const argumentPath = jsxAttributePath.get('argument');
          const spreadExpressionPath = valueExpressionFromJsxAttributeValue(argumentPath);
          return {
            type: SPREAD_TYPE,
            expression: spreadExpressionPath
          };
        } else if (jsxAttributePath.isJSXAttribute()) {
          const namePath = jsxAttributePath.get('name');
          const valuePath = jsxAttributePath.get('value');

          if (namePath.isJSXNamespacedName()) {
            throw new Error('Not supported');
          } else if (namePath.isJSXIdentifier()) {
            const type = fieldType(namePath.node.name);

            switch (type) {
              case PROPERTY_TYPE:
                const key = cleanFieldName(namePath.node.name);

                const setterId = (() => {
                  if (setterMap.has(key)) {
                    return setterMap.get(key);
                  } else {
                    const id = outerPath.scope.generateUidIdentifier(`${key}$setter`);
                    const elementId = outerPath.scope.generateUidIdentifier('element');
                    const valueId = outerPath.scope.generateUidIdentifier('value');
                    outerPath.insertBefore(constDeclaration(id, t.arrowFunctionExpression([elementId, valueId], t.assignmentExpression('=', t.memberExpression(elementId, t.identifier(key)), valueId))));
                    setterMap.set(key, id);
                    return id;
                  }
                })();

                return {
                  type,
                  setterId,
                  expression: valueExpressionFromJsxAttributeValue(valuePath),
                  key
                };

              default:
                return {
                  type,
                  key: cleanFieldName(namePath.node.name),
                  expression: valueExpressionFromJsxAttributeValue(valuePath)
                };
            }
          }
        }

        throw new Error('Not supported');
      });
      const children = domNodesFromJSXChildren(path.get('children'), scope, outerPath);
      const childrenAreDynamic = hasDynamicNodes(children);
      const nonStaticAttributeFields = fields.filter(field => !(field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)));
      const resultNode = {
        type: ELEMENT_TYPE,
        tag,
        children,
        fields,
        id: previousIsDynamic || childrenAreDynamic || nonStaticAttributeFields.length > 0 ? potentialId : null
      };
      return resultNode;
    } else {
      const fields = jsxAttributePaths.map(jsxAttributePath => {
        if (jsxAttributePath.isJSXSpreadAttribute()) {
          const result = {
            type: SPREAD_TYPE,
            expression: jsxAttributePath.get('argument') // TODO: Check this is right

          };
          return result;
        } else if (jsxAttributePath.isJSXAttribute()) {
          const namePath = jsxAttributePath.get('name');

          if (namePath.isJSXNamespacedName()) {
            throw new Error('Not supported');
          } else if (namePath.isJSXIdentifier()) {
            const result = {
              type: SUBCOMPONENT_PROPERTY_TYPE,
              key: namePath.node.name,
              expression: valueExpressionFromJsxAttributeValue(jsxAttributePath.get('value'))
            };
            return result;
          }
        }

        throw new Error('Not supported');
      });
      const children = domNodesFromJSXChildren(path.get('children'), scope, outerPath);
      const resultNode = {
        type: SUBCOMPONENT_TYPE,
        nameExpression: jsxOpeningElementPath.get('name'),
        children,
        childrenTemplateId: children.length > 0 ? scope.generateUidIdentifier('subTemplate') : null,
        fields
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
      // TODO: We could probably do id assignment post DOM node tree collection
      id: previousIsDynamic ? scope.generateUidIdentifier('text') : null
    };
  };

  const isDynamicDomlessNode = node => {
    return node.type === DYNAMIC_TYPE || node.type === SUBCOMPONENT_TYPE;
  };

  function* yieldDomNodeFromJSXFragment(path, previousIsDynamic, scope, outerPath) {
    for (const childPath of path.get('children')) {
      for (const node of yieldDomNodeFromNodeSimplified(childPath, previousIsDynamic, scope, outerPath)) {
        previousIsDynamic = isDynamicDomlessNode(node);
        yield node;
      }
    }
  }

  function* yieldDomNodeFromJSXExpressionContainerNode(path, previousIsDynamic, scope, outerPath) {
    const expressionPath = path.get('expression'); // TODO: Function and array literals

    if (expressionPath.isJSXElement() || expressionPath.isJSXFragment()) {
      yield* yieldDomNodeFromNodeSimplified(expressionPath, previousIsDynamic, scope, outerPath);
    } else if (expressionPath.isStringLiteral()) {
      // TODO: Two contained literals next to each other would lead to incorrect state length
      const textNode = domNodeFromString(expressionPath.node.value, previousIsDynamic, scope);

      if (textNode) {
        yield textNode;
      }
    } else if (expressionPath.isNumericLiteral() || expressionPath.isBooleanLiteral()) {
      const textNode = domNodeFromString(expressionPath.node.value.toString(), previousIsDynamic, scope);

      if (textNode) {
        yield textNode;
      }
    } else {
      yield {
        type: DYNAMIC_TYPE,
        expression: expressionPath
      };
    }
  }

  function* yieldDomNodeFromNodeNonSimplified(path, previousIsDynamic, scope, outerPath) {
    if (path.isJSXElement()) {
      yield domNodeFromJSXElement(path, previousIsDynamic, scope, outerPath);
    } else if (path.isJSXExpressionContainer()) {
      yield* yieldDomNodeFromJSXExpressionContainerNode(path, previousIsDynamic, scope, outerPath);
    } else if (path.isJSXFragment()) {
      yield* yieldDomNodeFromJSXFragment(path, previousIsDynamic, scope, outerPath);
    } else if (path.isJSXText()) {
      const textNode = domNodeFromJSXText(path, previousIsDynamic, scope);

      if (textNode) {
        yield textNode;
      }
    } else {
      throw new Error(`Invalid node type ${path.node.type}`);
    }
  }

  function* yieldDomNodeFromNodeSimplified(path, previousIsDynamic, scope, outerPath) {
    const domNodeIterator = yieldDomNodeFromNodeNonSimplified(path, previousIsDynamic, scope, outerPath);
    const firstIteration = domNodeIterator.next();

    if (firstIteration.done) {
      return;
    }

    let previous = firstIteration.value;

    for (const current of domNodeIterator) {
      if (previous.type === TEXT_TYPE) {
        if (current.type === TEXT_TYPE) {
          previous.text += current.text;
        } else {
          yield previous;
        }
      } else {
        yield previous;
      }

      previous = current;
    }

    yield previous;
  }

  const htmlFromNode = node => {
    switch (node.type) {
      case ELEMENT_TYPE:
        const tag = node.tag;
        const attributeString = node.fields.filter(field => field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)).map(field => attributeLiteralToHTMLAttributeString(field)).join(' ');
        const childrenString = node.children.map(field => {
          return htmlFromNode(field);
        }).join('');
        return `<${tag}${attributeString !== '' ? ` ${attributeString}` : ''}>${childrenString}</${tag}>`;

      case TEXT_TYPE:
        return node.text;

      default:
        return '';
    }
  };

  const constDeclaration = (id, expression) => {
    return t.variableDeclaration('const', [t.variableDeclarator(id, expression)]);
  };

  const STATIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'staticElementBlueprint';
  const DYNAMIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'elementBlueprint';
  const STATIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'staticFragmentBlueprint';
  const DYNAMIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'fragmentBlueprint';

  function* yieldDeclarationStatementsFromRootNodes(nodes, rootId, isRoot, scope) {
    const childrenWithDomNodesAssociatedWithThem = nodes.filter(child => child.type === ELEMENT_TYPE || child.type === TEXT_TYPE);

    if (childrenWithDomNodesAssociatedWithThem.length > 0) {
      for (let c = 1; c < childrenWithDomNodesAssociatedWithThem.length - 1; c++) {
        const previous = childrenWithDomNodesAssociatedWithThem[c - 1];
        const current = childrenWithDomNodesAssociatedWithThem[c];

        if (previous.type === TEXT_TYPE && current.type === TEXT_TYPE) {
          if (previous.id === null) {
            // Need this to split text up when there's 2 text nodes next to each other in the blueprint
            previous.id = scope.generateDeclaredUidIdentifier('partialText');
          }
        }
      }

      const firstNode = childrenWithDomNodesAssociatedWithThem[0];

      if (firstNode.id) {
        if (isRoot && nodes.length === 1) {
          yield constDeclaration(firstNode.id, rootId);
        } else {
          yield constDeclaration(firstNode.id, t.memberExpression(rootId, t.identifier('firstChild')));
        }

        if (firstNode.type === ELEMENT_TYPE) {
          yield* yieldDeclarationStatementsFromRootNodes(firstNode.children, firstNode.id, false, scope);
        }
      }

      for (let c = 1; c < childrenWithDomNodesAssociatedWithThem.length - 1; c++) {
        const childNode = childrenWithDomNodesAssociatedWithThem[c];

        if (childNode.id) {
          const previousNode = childrenWithDomNodesAssociatedWithThem[c - 1];

          if (previousNode.type === TEXT_TYPE && childNode.type === TEXT_TYPE) {
            yield t.expressionStatement(t.callExpression(t.memberExpression(previousNode.id, t.identifier('splitText')), [t.numericLiteral(previousNode.text.length)]));
          }

          if (previousNode.id) {
            yield constDeclaration(childNode.id, t.memberExpression(previousNode.id, t.identifier('nextSibling')));
          } else {
            yield constDeclaration(childNode.id, t.memberExpression(t.memberExpression(rootId, t.identifier('childNodes')), t.numericLiteral(c), true));
          }

          if (childNode.type === ELEMENT_TYPE) {
            yield* yieldDeclarationStatementsFromRootNodes(childNode.children, childNode.id, false, scope);
          }
        }
      } // TODO: Could do previousSibling if the last node uses lastChild


      if (childrenWithDomNodesAssociatedWithThem.length >= 2) {
        const lastNode = childrenWithDomNodesAssociatedWithThem[childrenWithDomNodesAssociatedWithThem.length - 1];

        if (lastNode.id) {
          const previousNode = childrenWithDomNodesAssociatedWithThem[childrenWithDomNodesAssociatedWithThem.length - 2];

          if (previousNode.type === TEXT_TYPE && lastNode.type === TEXT_TYPE) {
            const previousId = childrenWithDomNodesAssociatedWithThem.length === 2 ? t.identifier('firstChild') : previousNode.id;
            yield t.expressionStatement(t.callExpression(t.memberExpression(previousId, t.identifier('splitText')), [t.numericLiteral(previousNode.text.length)]));
          }

          yield constDeclaration(lastNode.id, t.memberExpression(rootId, t.identifier('lastChild')));

          if (lastNode.type === ELEMENT_TYPE) {
            yield* yieldDeclarationStatementsFromRootNodes(lastNode.children, lastNode.id, false, scope);
          }
        }
      }
    }
  }

  const dynamicFieldExpression = (rootId, beforeId, previousConsecutiveDynamicNodeCount) => {
    if (previousConsecutiveDynamicNodeCount === 1) {
      return cinderCallExpression('children', [rootId, beforeId]);
    } else if (previousConsecutiveDynamicNodeCount >= 2) {
      return cinderCallExpression('dynamicSection', [rootId, beforeId, t.numericLiteral(previousConsecutiveDynamicNodeCount)]);
    }

    return null;
  };

  function* yieldFieldExpressionsFromNodes(nodes, rootId) {
    let previousConsecutiveDynamicNodeCount = 0;

    for (const node of nodes) {
      switch (node.type) {
        case TEXT_TYPE:
        case ELEMENT_TYPE:
          const dynamicExpression = dynamicFieldExpression(rootId, node.id, previousConsecutiveDynamicNodeCount);

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
                    if (node.id === null) {
                      throw new Error('Not supported');
                    }

                    yield cinderCallExpression(field.type, [node.id, t.stringLiteral(field.key)]);
                  }

                  break;

                case PROPERTY_TYPE:
                  yield cinderCallExpression(field.type, [node.id, field.setterId]);
                  break;

                case SPREAD_TYPE:
                  yield cinderCallExpression(field.type, [node.id]);
                  break;

                default:
                  throw new Error(`Not supported: ${field.type}`);
              }
            }

            if (node.id !== null) {
              yield* yieldFieldExpressionsFromNodes(node.children, node.id);
            }
          }

          break;

        case SUBCOMPONENT_TYPE:
        case DYNAMIC_TYPE:
          previousConsecutiveDynamicNodeCount++;
          break;
      }
    }

    const dynamicExpression = dynamicFieldExpression(rootId, t.identifier('null'), previousConsecutiveDynamicNodeCount);

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
                yield field.expression.node;
              }

              break;

            default:
              yield field.expression.node;
          }
        }

        for (const childNode of node.children) {
          yield* yieldFieldValuesFromNode(childNode);
        }

        break;

      case DYNAMIC_TYPE:
        yield node.expression.node;
        break;

      case SUBCOMPONENT_TYPE:
        const objectProperties = [];

        for (const field of node.fields) {
          switch (field.type) {
            case SPREAD_TYPE:
              objectProperties.push(t.spreadElement(field.expression.node));
              break;

            case SUBCOMPONENT_PROPERTY_TYPE:
              if (field.expression.node === null) {
                throw new Error('Not supported');
              }

              objectProperties.push(t.objectProperty(t.identifier(field.key), field.expression.node));
              break;
          }
        }

        if (node.childrenTemplateId) {
          const fieldValues = [];

          for (const childNode of node.children) {
            fieldValues.push(...yieldFieldValuesFromNode(childNode));
          }

          const domChildren = node.children.filter(nodeHasDom);

          if (domChildren.length > 0) {
            objectProperties.push(t.objectProperty(t.identifier('children'), cinderCallExpression('componentResult', [node.childrenTemplateId, t.arrayExpression([...fieldValues])])));
          } else if (fieldValues.length > 0) {
            objectProperties.push(t.objectProperty(t.identifier('children'), fieldValues.length === 1 ? fieldValues[0] : t.arrayExpression([...fieldValues])));
          }
        } // TODO: This whole block of code assumes that it's a SFC and not a string (representing an HTML element)


        if (!node.nameExpression.isJSXIdentifier()) {
          throw new Error('Not supported');
        }

        yield t.callExpression(t.identifier(node.nameExpression.node.name), [t.objectExpression(objectProperties)]);
    }
  }

  const nodeHasDom = node => node.type === ELEMENT_TYPE || node.type === TEXT_TYPE;

  function* yieldTemplateInfoFromRootNodes(nodes, templateId, scope) {
    const nodeStack = [...nodes];

    while (nodeStack.length > 0) {
      const node = nodeStack.pop();

      switch (node.type) {
        case SUBCOMPONENT_TYPE:
          if (node.childrenTemplateId !== null) {
            yield* yieldTemplateInfoFromRootNodes(node.children, node.childrenTemplateId, scope);
          } else {
            nodeStack.push(...[...node.children].reverse());
          }

          break;

        case ELEMENT_TYPE:
          nodeStack.push(...[...node.children].reverse());
          break;
      }
    }

    const nodesWithDom = nodes.filter(nodeHasDom);
    const isDynamicChildren = hasDynamicNodes(nodes);
    const args = [t.stringLiteral(nodes.map(node => htmlFromNode(node)).join(''))];
    let templateMethod;

    if (nodesWithDom.length <= 0) {
      return;
    } else if (nodes.length === 1) {
      if (isDynamicChildren) {
        templateMethod = DYNAMIC_ELEMENT_TEMPLATE_FACTORY_NAME;
      } else {
        templateMethod = STATIC_ELEMENT_TEMPLATE_FACTORY_NAME;
      }
    } else {
      if (isDynamicChildren) {
        templateMethod = DYNAMIC_FRAGMENT_TEMPLATE_FACTORY_NAME;
      } else {
        templateMethod = STATIC_FRAGMENT_TEMPLATE_FACTORY_NAME;
      }
    }

    if (isDynamicChildren) {
      const rootParamId = scope.generateUidIdentifier('rootNode');
      const statements = [...yieldDeclarationStatementsFromRootNodes(nodes, rootParamId, true, scope)];
      const fieldExpressions = [...yieldFieldExpressionsFromNodes(nodes, rootParamId)];
      statements.push(t.returnStatement(t.arrayExpression(fieldExpressions)));
      const blockStatement = t.blockStatement(statements);
      const arrowFunction = t.arrowFunctionExpression([rootParamId], blockStatement);
      args.push(arrowFunction);
    }

    yield constDeclaration(templateId, cinderCallExpression(templateMethod, args));
  }

  const replacePathWithDomNodeSyntax = (nodes, path, outerPath) => {
    const templateId = path.scope.generateUidIdentifier('template');
    const templateDeclarations = yieldTemplateInfoFromRootNodes(nodes, templateId, path.scope);

    for (const statement of templateDeclarations) {
      outerPath.insertBefore(statement);
    }

    const nodesWithDom = nodes.filter(nodeHasDom);

    if (nodesWithDom.length <= 0) {
      const componentResultArgs = [];

      for (const node of nodes) {
        componentResultArgs.push(...yieldFieldValuesFromNode(node));
      }

      path.replaceWith(t.expressionStatement(componentResultArgs.length === 1 ? componentResultArgs[0] : t.arrayExpression(componentResultArgs)));
    } else {
      const fieldValues = [];

      for (const node of nodes) {
        const nodeFieldValues = yieldFieldValuesFromNode(node);
        fieldValues.push(...nodeFieldValues);
      }

      path.replaceWith(t.expressionStatement(cinderCallExpression('componentResult', [templateId, t.arrayExpression(fieldValues)])));
    }
  };

  const THROW_IF_NAMESPACE = options.throwIfNamespace === undefined ? true : !!options.throwIfNamespace;
  const PRAGMA_DEFAULT = options.pragma || 'cinder.createElement';
  const PRAGMA_FRAG_DEFAULT = options.pragmaFrag || 'cinder.Fragment';
  const JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  const JSX_FRAG_ANNOTATION_REGEX = /\*?\s*@jsxFrag\s+([^\s]+)/; // returns a closure that returns an identifier or memberExpression node
  // based on the given id

  const createIdentifierParser = id => () => {
    const identifiers = id.split('.').map(name => t.identifier(name));
    let cur = identifiers[0];

    for (let i = 1; i < identifiers.length; i++) {
      cur = t.memberExpression(cur, identifiers[i]);
    }

    return cur;
  }; // TODO: Type it properly


  let setterMap;
  const visitor = (0, _helperBuilderReactJsx.default)({
    pre(state) {
      const tagName = state.tagName;
      const args = state.args;

      if (core.types.react.isCompatTag(tagName)) {
        args.push(t.stringLiteral(tagName));
      } else {
        args.push(state.tagExpr);
      }
    },

    post(state, pass) {
      state.callee = pass.get('jsxIdentifier')();
    },

    throwIfNamespace: THROW_IF_NAMESPACE
  });
  visitor.Program = {
    enter(path, state) {
      setterMap = new Map();
      const {
        file
      } = state; //path.unshift(t.memberExpression(t.identifier('swek'), t.identifier(1)));

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
      if (state.get('pragmaSet') && state.get('usedFragment') && !state.get('pragmaFragSet')) {
        throw new Error('transform-react-jsx: pragma has been set but ' + 'pragmafrag has not been set');
      }
    }

  };

  visitor.JSXFragment = function (path) {
    if (isRootJSXNode(path)) {
      const outerPath = path.findParent(parentPath => parentPath === undefined || parentPath.parentPath.isProgram());
      const domNodes = [...yieldDomNodeFromJSXFragment(path, false, path.scope, outerPath)];
      replacePathWithDomNodeSyntax(domNodes, path, outerPath);
    }
  };

  visitor.JSXElement = {
    exit(path) {
      if (isRootJSXNode(path)) {
        const outerPath = path.findParent(parentPath => parentPath === undefined || parentPath.parentPath.isProgram());
        const domNode = domNodeFromJSXElement(path, false, path.scope, outerPath);
        replacePathWithDomNodeSyntax([domNode], path, outerPath);
      }
    }

  };
  return {
    name: 'transform-react-jsx',
    inherits: _pluginSyntaxJsx.default,
    visitor
  };
});

exports.default = _default;
//# sourceMappingURL=index.js.map
