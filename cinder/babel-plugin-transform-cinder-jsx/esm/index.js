"use strict";

import * as core from '@babel/core';
import helper from '@babel/helper-builder-react-jsx';
import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import * as t from '@babel/types';

var cinderMemberExpression = field => {
  return t.memberExpression(t.identifier('cinder'), t.identifier(field));
};

var cinderCallExpression = (functionName, args) => {
  return t.callExpression(cinderMemberExpression(functionName), args);
};

var attributeLiteralToHTMLAttributeString = field => {
  var {
    key: name,
    expression: literalPath
  } = field; // TODO: Refactor

  var literal = literalPath.node;

  if (literal === null) {
    // This is like <element attrName/>
    return "".concat(name);
  }

  if (literalPath.isStringLiteral()) {
    return "".concat(name, "=").concat(literalPath);
  } else if (literalPath.isBooleanLiteral()) {
    return literalPath.node.value ? name : '';
  } else if (literalPath.isNumericLiteral() || literalPath.isBig) {
    return "".concat(name, "=\"").concat(literalPath.node.value, "\"");
  } else if (literalPath.isTemplateLiteral()) {
    return literalPath.node.quasis[0];
  } else if (literal.value !== undefined) {
    return "".concat(name, "=").concat(literalPath.node.value.toString());
  }
};

var TEXT_TYPE = 'text';
var DYNAMIC_TYPE = 'dynamic';
var ELEMENT_TYPE = 'element';
var SUBCOMPONENT_TYPE = 'subcomponent';
var PROPERTY_TYPE = 'property';
var SPREAD_TYPE = 'spread';
var EVENT_TYPE = 'event';
var ATTRIBUTE_TYPE = 'attribute';
var SUBCOMPONENT_PROPERTY_TYPE = 'subcomponent_property';
export default declare((api, options) => {
  api.assertVersion(7);

  function domNodeFromJSXText(path, previousIsDynamic, scope) {
    return domNodeFromString(path.node.value, previousIsDynamic, scope);
  }

  var isElementTag = tag => {
    return tag[0].toLowerCase() === tag[0];
  };

  var isLiteral = value => {
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


  var fieldType = name => {
    return name.match(/^\$\$/) ? EVENT_TYPE : name.match(/^\$/) ? PROPERTY_TYPE : ATTRIBUTE_TYPE;
  };

  var findProgramAndOuterPath = path => {
    var parent = path.parentPath;

    if (!parent) {
      return {
        program: path
      };
    } else {
      var result = findProgramAndOuterPath(parent);

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

  var isRootJSXNode = path => {
    var parent = path.parentPath;

    if (parent.isJSXFragment() || parent.isJSXElement()) {
      return false;
    } else if (parent.isJSXExpressionContainer()) {
      // TODO: Very confusing condition
      return isRootJSXNode(parent);
    } else {
      return true;
    }
  };

  var cleanFieldName = name => name.replace(/^\$?\$?/, '');

  var valueExpressionFromJsxAttributeValue = valuePath => {
    var current = valuePath;

    while (current.isJSXExpressionContainer()) {
      current = valuePath.get('expression');
    }

    return current;
  };

  var domNodesFromJSXChildren = (jsxChildrenPaths, scope, outerPath) => {
    var children = [];
    var previousNode = null;

    for (var childPath of jsxChildrenPaths) {
      for (var node of yieldDomNodeFromNodeSimplified(childPath, previousNode !== null && isDynamicDomlessNode(previousNode), scope, outerPath)) {
        previousNode = node;
        children.push(node);
      }
    }

    return children;
  };

  var hasDynamicNodes = children => {
    return children.some(childNode => childNode.type === DYNAMIC_TYPE || childNode.type === ELEMENT_TYPE && childNode.id || SUBCOMPONENT_TYPE);
  };

  var domNodeFromJSXElement = (path, previousIsDynamic, scope, outerPath) => {
    var jsxOpeningElementPath = path.get('openingElement');
    var jsxAttributePathsOrPath = jsxOpeningElementPath.get('attributes');
    var jsxAttributePaths = Array.isArray(jsxAttributePathsOrPath) ? jsxAttributePathsOrPath : [jsxAttributePathsOrPath];
    var jsxOpeningElementNamePath = jsxOpeningElementPath.get('name');

    if (jsxOpeningElementNamePath.isJSXIdentifier() && isElementTag(jsxOpeningElementNamePath.node.name)) {
      var tag = jsxOpeningElementNamePath.node.name;
      var potentialId = scope.generateUidIdentifier("".concat(tag, "$"));
      var fields = jsxAttributePaths.map(jsxAttributePath => {
        if (jsxAttributePath.isJSXSpreadAttribute()) {
          var argumentPath = jsxAttributePath.get('argument');
          var spreadExpressionPath = valueExpressionFromJsxAttributeValue(argumentPath);
          return {
            type: SPREAD_TYPE,
            expression: spreadExpressionPath
          };
        } else if (jsxAttributePath.isJSXAttribute()) {
          var namePath = jsxAttributePath.get('name');
          var valuePath = jsxAttributePath.get('value');

          if (namePath.isJSXNamespacedName()) {
            throw new Error('Not supported');
          } else if (namePath.isJSXIdentifier()) {
            var type = fieldType(namePath.node.name);

            switch (type) {
              case PROPERTY_TYPE:
                var key = cleanFieldName(namePath.node.name);

                var setterId = (() => {
                  if (setterMap.has(key)) {
                    return setterMap.get(key);
                  } else {
                    var id = outerPath.scope.generateUidIdentifier("".concat(key, "$setter"));
                    var elementId = outerPath.scope.generateUidIdentifier('element');
                    var valueId = outerPath.scope.generateUidIdentifier('value');
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
      var children = domNodesFromJSXChildren(path.get('children'), scope, outerPath);
      var childrenAreDynamic = hasDynamicNodes(children);
      var nonStaticAttributeFields = fields.filter(field => !(field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)));
      var resultNode = {
        type: ELEMENT_TYPE,
        tag,
        children,
        fields,
        id: previousIsDynamic || childrenAreDynamic || nonStaticAttributeFields.length > 0 ? potentialId : null
      };
      return resultNode;
    } else {
      var _fields = jsxAttributePaths.map(jsxAttributePath => {
        if (jsxAttributePath.isJSXSpreadAttribute()) {
          var result = {
            type: SPREAD_TYPE,
            expression: jsxAttributePath.get('argument') // TODO: Check this is right

          };
          return result;
        } else if (jsxAttributePath.isJSXAttribute()) {
          var namePath = jsxAttributePath.get('name');

          if (namePath.isJSXNamespacedName()) {
            throw new Error('Not supported');
          } else if (namePath.isJSXIdentifier()) {
            var _result = {
              type: SUBCOMPONENT_PROPERTY_TYPE,
              key: namePath.node.name,
              expression: valueExpressionFromJsxAttributeValue(jsxAttributePath.get('value'))
            };
            return _result;
          }
        }

        throw new Error('Not supported');
      });

      var _children = domNodesFromJSXChildren(path.get('children'), scope, outerPath);

      var _resultNode = {
        type: SUBCOMPONENT_TYPE,
        nameExpression: jsxOpeningElementPath.get('name'),
        children: _children,
        childrenTemplateId: _children.length > 0 ? scope.generateUidIdentifier('subTemplate') : null,
        fields: _fields
      };
      return _resultNode;
    }
  };

  var domNodeFromString = (aString, previousIsDynamic, scope) => {
    var html = aString.replace(/^\s*\n\s*|\s*\n\s*$/g, '');

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

  var isDynamicDomlessNode = node => {
    return node.type === DYNAMIC_TYPE || node.type === SUBCOMPONENT_TYPE;
  };

  function* yieldDomNodeFromJSXFragment(path, previousIsDynamic, scope, outerPath) {
    for (var childPath of path.get('children')) {
      for (var node of yieldDomNodeFromNodeSimplified(childPath, previousIsDynamic, scope, outerPath)) {
        previousIsDynamic = isDynamicDomlessNode(node);
        yield node;
      }
    }
  }

  function* yieldDomNodeFromJSXExpressionContainerNode(path, previousIsDynamic, scope, outerPath) {
    var expressionPath = path.get('expression'); // TODO: Function and array literals

    if (expressionPath.isJSXElement() || expressionPath.isJSXFragment()) {
      yield* yieldDomNodeFromNodeSimplified(expressionPath, previousIsDynamic, scope, outerPath);
    } else if (expressionPath.isStringLiteral()) {
      // TODO: Two contained literals next to each other would lead to incorrect state length
      var textNode = domNodeFromString(expressionPath.node.value, previousIsDynamic, scope);

      if (textNode) {
        yield textNode;
      }
    } else if (expressionPath.isNumericLiteral() || expressionPath.isBooleanLiteral()) {
      var _textNode = domNodeFromString(expressionPath.node.value.toString(), previousIsDynamic, scope);

      if (_textNode) {
        yield _textNode;
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
      var textNode = domNodeFromJSXText(path, previousIsDynamic, scope);

      if (textNode) {
        yield textNode;
      }
    } else {
      throw new Error("Invalid node type ".concat(path.node.type));
    }
  }

  function* yieldDomNodeFromNodeSimplified(path, previousIsDynamic, scope, outerPath) {
    var domNodeIterator = yieldDomNodeFromNodeNonSimplified(path, previousIsDynamic, scope, outerPath);
    var firstIteration = domNodeIterator.next();

    if (firstIteration.done) {
      return;
    }

    var previous = firstIteration.value;

    for (var current of domNodeIterator) {
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

  var htmlFromNode = node => {
    switch (node.type) {
      case ELEMENT_TYPE:
        var tag = node.tag;
        var attributeString = node.fields.filter(field => field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)).map(field => attributeLiteralToHTMLAttributeString(field)).join(' ');
        var childrenString = node.children.map(field => {
          return htmlFromNode(field);
        }).join('');
        return "<".concat(tag).concat(attributeString !== '' ? " ".concat(attributeString) : '', ">").concat(childrenString, "</").concat(tag, ">");

      case TEXT_TYPE:
        return node.text;

      default:
        return '';
    }
  };

  var constDeclaration = (id, expression) => {
    return t.variableDeclaration('const', [t.variableDeclarator(id, expression)]);
  };

  var STATIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'staticElementBlueprint';
  var DYNAMIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'elementBlueprint';
  var STATIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'staticFragmentBlueprint';
  var DYNAMIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'fragmentBlueprint';

  function* yieldDeclarationStatementsFromRootNodes(nodes, rootId, isRoot, scope) {
    var childrenWithDomNodesAssociatedWithThem = nodes.filter(child => child.type === ELEMENT_TYPE || child.type === TEXT_TYPE);

    if (childrenWithDomNodesAssociatedWithThem.length > 0) {
      for (var c = 1; c < childrenWithDomNodesAssociatedWithThem.length - 1; c++) {
        var previous = childrenWithDomNodesAssociatedWithThem[c - 1];
        var current = childrenWithDomNodesAssociatedWithThem[c];

        if (previous.type === TEXT_TYPE && current.type === TEXT_TYPE) {
          if (previous.id === null) {
            // Need this to split text up when there's 2 text nodes next to each other in the blueprint
            previous.id = scope.generateDeclaredUidIdentifier('partialText');
          }
        }
      }

      var firstNode = childrenWithDomNodesAssociatedWithThem[0];

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

      for (var _c = 1; _c < childrenWithDomNodesAssociatedWithThem.length - 1; _c++) {
        var childNode = childrenWithDomNodesAssociatedWithThem[_c];

        if (childNode.id) {
          var previousNode = childrenWithDomNodesAssociatedWithThem[_c - 1];

          if (previousNode.type === TEXT_TYPE && childNode.type === TEXT_TYPE) {
            yield t.expressionStatement(t.callExpression(t.memberExpression(previousNode.id, t.identifier('splitText')), [t.numericLiteral(previousNode.text.length)]));
          }

          if (previousNode.id) {
            yield constDeclaration(childNode.id, t.memberExpression(previousNode.id, t.identifier('nextSibling')));
          } else {
            yield constDeclaration(childNode.id, t.memberExpression(t.memberExpression(rootId, t.identifier('childNodes')), t.numericLiteral(_c), true));
          }

          if (childNode.type === ELEMENT_TYPE) {
            yield* yieldDeclarationStatementsFromRootNodes(childNode.children, childNode.id, false, scope);
          }
        }
      } // TODO: Could do previousSibling if the last node uses lastChild


      if (childrenWithDomNodesAssociatedWithThem.length >= 2) {
        var lastNode = childrenWithDomNodesAssociatedWithThem[childrenWithDomNodesAssociatedWithThem.length - 1];

        if (lastNode.id) {
          var _previousNode = childrenWithDomNodesAssociatedWithThem[childrenWithDomNodesAssociatedWithThem.length - 2];

          if (_previousNode.type === TEXT_TYPE && lastNode.type === TEXT_TYPE) {
            var previousId = childrenWithDomNodesAssociatedWithThem.length === 2 ? t.identifier('firstChild') : _previousNode.id;
            yield t.expressionStatement(t.callExpression(t.memberExpression(previousId, t.identifier('splitText')), [t.numericLiteral(_previousNode.text.length)]));
          }

          yield constDeclaration(lastNode.id, t.memberExpression(rootId, t.identifier('lastChild')));

          if (lastNode.type === ELEMENT_TYPE) {
            yield* yieldDeclarationStatementsFromRootNodes(lastNode.children, lastNode.id, false, scope);
          }
        }
      }
    }
  }

  var dynamicFieldExpression = (rootId, beforeId, previousConsecutiveDynamicNodeCount) => {
    if (previousConsecutiveDynamicNodeCount === 1) {
      return cinderCallExpression('children', [rootId, beforeId]);
    } else if (previousConsecutiveDynamicNodeCount >= 2) {
      return cinderCallExpression('dynamicSection', [rootId, beforeId, t.numericLiteral(previousConsecutiveDynamicNodeCount)]);
    }

    return null;
  };

  function* yieldFieldExpressionsFromNodes(nodes, rootId) {
    var previousConsecutiveDynamicNodeCount = 0;

    for (var node of nodes) {
      switch (node.type) {
        case TEXT_TYPE:
        case ELEMENT_TYPE:
          var _dynamicExpression = dynamicFieldExpression(rootId, node.id, previousConsecutiveDynamicNodeCount);

          if (_dynamicExpression !== null) {
            yield _dynamicExpression;
          }

          previousConsecutiveDynamicNodeCount = 0;

          if (node.type === ELEMENT_TYPE) {
            for (var field of node.fields) {
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
                  throw new Error("Not supported: ".concat(field.type));
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

    var dynamicExpression = dynamicFieldExpression(rootId, t.identifier('null'), previousConsecutiveDynamicNodeCount);

    if (dynamicExpression !== null) {
      yield dynamicExpression;
    }
  }

  function* yieldFieldValuesFromNode(node) {
    switch (node.type) {
      case ELEMENT_TYPE:
        for (var field of node.fields) {
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

        for (var childNode of node.children) {
          yield* yieldFieldValuesFromNode(childNode);
        }

        break;

      case DYNAMIC_TYPE:
        yield node.expression.node;
        break;

      case SUBCOMPONENT_TYPE:
        var objectProperties = [];

        for (var _field of node.fields) {
          switch (_field.type) {
            case SPREAD_TYPE:
              objectProperties.push(t.spreadElement(_field.expression.node));
              break;

            case SUBCOMPONENT_PROPERTY_TYPE:
              if (_field.expression.node === null) {
                throw new Error('Not supported');
              }

              objectProperties.push(t.objectProperty(t.identifier(_field.key), _field.expression.node));
              break;
          }
        }

        if (node.childrenTemplateId) {
          var fieldValues = [];

          for (var _childNode of node.children) {
            fieldValues.push(...yieldFieldValuesFromNode(_childNode));
          }

          var domChildren = node.children.filter(nodeHasDom);

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

  var nodeHasDom = node => node.type === ELEMENT_TYPE || node.type === TEXT_TYPE;

  function* yieldTemplateInfoFromRootNodes(nodes, templateId, scope) {
    var nodeStack = [...nodes];

    while (nodeStack.length > 0) {
      var node = nodeStack.pop();

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

    var nodesWithDom = nodes.filter(nodeHasDom);
    var isDynamicChildren = hasDynamicNodes(nodes);
    var args = [t.stringLiteral(nodes.map(node => htmlFromNode(node)).join(''))];
    var templateMethod;

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
      var rootParamId = scope.generateUidIdentifier('rootNode');
      var statements = [...yieldDeclarationStatementsFromRootNodes(nodes, rootParamId, true, scope)];
      var fieldExpressions = [...yieldFieldExpressionsFromNodes(nodes, rootParamId)];
      statements.push(t.returnStatement(t.arrayExpression(fieldExpressions)));
      var blockStatement = t.blockStatement(statements);
      var arrowFunction = t.arrowFunctionExpression([rootParamId], blockStatement);
      args.push(arrowFunction);
    }

    yield constDeclaration(templateId, cinderCallExpression(templateMethod, args));
  }

  var replacePathWithDomNodeSyntax = (nodes, path, outerPath) => {
    var templateId = path.scope.generateUidIdentifier('template');
    var templateDeclarations = yieldTemplateInfoFromRootNodes(nodes, templateId, path.scope);

    for (var statement of templateDeclarations) {
      outerPath.insertBefore(statement);
    }

    var nodesWithDom = nodes.filter(nodeHasDom);

    if (nodesWithDom.length <= 0) {
      var componentResultArgs = [];

      for (var node of nodes) {
        componentResultArgs.push(...yieldFieldValuesFromNode(node));
      }

      path.replaceWith(t.expressionStatement(componentResultArgs.length === 1 ? componentResultArgs[0] : t.arrayExpression(componentResultArgs)));
    } else {
      var fieldValues = [];

      for (var _node of nodes) {
        var nodeFieldValues = yieldFieldValuesFromNode(_node);
        fieldValues.push(...nodeFieldValues);
      }

      path.replaceWith(t.expressionStatement(cinderCallExpression('componentResult', [templateId, t.arrayExpression(fieldValues)])));
    }
  };

  var THROW_IF_NAMESPACE = options.throwIfNamespace === undefined ? true : !!options.throwIfNamespace;
  var PRAGMA_DEFAULT = options.pragma || 'cinder.createElement';
  var PRAGMA_FRAG_DEFAULT = options.pragmaFrag || 'cinder.Fragment';
  var JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  var JSX_FRAG_ANNOTATION_REGEX = /\*?\s*@jsxFrag\s+([^\s]+)/; // returns a closure that returns an identifier or memberExpression node
  // based on the given id

  var createIdentifierParser = id => () => {
    var identifiers = id.split('.').map(name => t.identifier(name));
    var cur = identifiers[0];

    for (var i = 1; i < identifiers.length; i++) {
      cur = t.memberExpression(cur, identifiers[i]);
    }

    return cur;
  }; // TODO: Type it properly


  var setterMap;
  var visitor = helper({
    pre(state) {
      var tagName = state.tagName;
      var args = state.args;

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
      var {
        file
      } = state; //path.unshift(t.memberExpression(t.identifier('swek'), t.identifier(1)));

      var pragma = PRAGMA_DEFAULT;
      var pragmaFrag = PRAGMA_FRAG_DEFAULT;
      var pragmaSet = !!options.pragma;
      var pragmaFragSet = !!options.pragmaFrag;

      if (file.ast.comments) {
        for (var comment of file.ast.comments) {
          var jsxMatches = JSX_ANNOTATION_REGEX.exec(comment.value);

          if (jsxMatches) {
            pragma = jsxMatches[1];
            pragmaSet = true;
          }

          var jsxFragMatches = JSX_FRAG_ANNOTATION_REGEX.exec(comment.value);

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
      var outerPath = path.findParent(parentPath => parentPath === undefined || parentPath.parentPath.isProgram());
      var domNodes = [...yieldDomNodeFromJSXFragment(path, false, path.scope, outerPath)];
      replacePathWithDomNodeSyntax(domNodes, path, outerPath);
    }
  };

  visitor.JSXElement = {
    exit(path) {
      if (isRootJSXNode(path)) {
        var outerPath = path.findParent(parentPath => parentPath === undefined || parentPath.parentPath.isProgram());
        var domNode = domNodeFromJSXElement(path, false, path.scope, outerPath);
        replacePathWithDomNodeSyntax([domNode], path, outerPath);
      }
    }

  };
  return {
    name: 'transform-react-jsx',
    inherits: jsx,
    visitor
  };
});
//# sourceMappingURL=index.js.map
