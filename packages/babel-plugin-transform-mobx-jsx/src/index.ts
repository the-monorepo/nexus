/**
 * NOTE: Originally copy-paste of:
 * https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-jsx/src/index.js
 */
import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import helper from '@babel/helper-builder-react-jsx';
import { types as t } from '@babel/core';
function attributeLiteralToHTMLAttributeString(name: string, literal) {
  if (literal === false) {
    /*
      To represent a false value, the attribute has to be omitted altogether.
      @see https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
    */
    return '';
  }
  if (literal===null) {
    // This is like <element attrName/>
    return `${name}`;
  }
  switch(literal.type) {
    case 'StringLiteral':
      return `${name}="${literal.value.replace(/"/g, "\\\"")}"`
    case 'BooleanLiteral':
      return literal.value ? name : '';
    case 'NumericLiteral':
      return `${name}="${literal.value}"`
    default:
      throw new Error(`Invalid literal type: ${literal.type}`);
  }
}
const ATTR_TYPE = 0;
const PROP_TYPE = 1;
const EVENT_TYPE = 2;
type DynamicType = typeof ATTR_TYPE | typeof PROP_TYPE | typeof EVENT_TYPE;
type DynamicField = {
  type: DynamicType;
  name: string;
  value: any;
}

function extractFieldInfo(jsxAttributeObj): FieldInfo {
  const dynamicFields: any[] = [];
  const staticAttrs = {};
  const staticProps = {};
  for (const name in jsxAttributeObj) {
    const value = jsxAttributeObj[name];
    const cleanedName = name.replace(/^\$?\$?/, '');
    if(name.match(/^\$\$/)) {
      // Events are always dynamic since they have to be wrapped in {} anyway
      dynamicFields.push({
        type: EVENT_TYPE,
        name: cleanedName,
        callback: value
      });
    } else {
      const isDynamic = typeof value === 'function';
      if (name.match(/^\$/)) {
        const field = { type: PROP_TYPE, name: cleanedName, callback: value };
        if (isDynamic) {
          dynamicFields.push(field);
        } else {
          staticProps[name] = value;
        }
      } else {
        const field = { type: ATTR_TYPE, name: cleanedName, callback: value };
        if (isDynamic) {
          dynamicFields.push(field);
        } else {
          staticAttrs[name] = value;
        }
      }
    }
  }
  return {
    dynamicFields,
    staticProps,
    staticAttrs,
  }
}

function extractAttributeStringFromJSXAttribute(attribute, dynamicSections) {
  if (t.isJSXAttribute(attribute)) {
    console.log(attribute);
    const name = attribute.name.name;
    const value = attribute.value;
    if (t.isJSXExpressionContainer(value)) {
      const expression = value.expression;
      if (expression && expression.type.match(/Literal$/)) {
        return attributeLiteralToHTMLAttributeString(name, value.expression);
      } else {
        dynamicSections.push({
          name,
          expression: value.expression
        });
      }
    }
    if (!attribute.value.type.match(/Literal$/)) {
      throw new Error(`Expected non-literal type ${value.type}`);
    }
    return attributeLiteralToHTMLAttributeString(name, value);
  } else {
    throw new Error(`Unknown type ${attribute.type}`);
  }
}

function extractHTMLFromJSXElement(jsxElement, dynamicSections) {
  const jsxOpeningElement = jsxElement.openingElement;
  const tag = jsxOpeningElement.name.name;
  const attributeString = jsxOpeningElement.attributes.map(
      (jsxAttribute) => extractAttributeStringFromJSXAttribute(jsxAttribute, dynamicSections)
    ).filter(string => string !== '')
    .join(' ');
  return `<${tag}${attributeString !== '' ? ` ${attributeString}` : ''}>${jsxElement.children.map(extractHTML)}</${tag}>`;
}

function extractHTMLFromJSXFragment(jsxFragment, dynamicSections) {
  return jsxFragment.children.map(extractHTML, dynamicSections);
}

const HTMLComment = '<!---->';
function extractHTML(node, dynamicSections) {
  if (t.isJSXElement(node)) {
    return extractHTMLFromJSXElement(node, dynamicSections);
  } else if (t.isJSXExpressionContainer(node)) {
    return HTMLComment;
  } else if(t.isJSXFragment(node)) {
    return extractHTMLFromJSXFragment(node, dynamicSections);
  } else { 
    throw new Error(`Invalid node type ${node.type}`);
  }
}

// Taken from: https://github.com/ryansolid/babel-plugin-jsx-dom-expressions/blob/master/src/index.js
function createTemplate(path, templateHTML) {
  const templateId = path.scope.generateUidIdentifier("tmpl$");
  const program = path.findParent(t => t.isProgram()).node;
  const createTemplateExpression = t.callExpression(
    t.memberExpression(t.identifier('document'), t.identifier('createElement')), [t.stringLiteral('template')]
  );
  const setTemplateHTMLStatement = t.expressionStatement(
    t.assignmentExpression('=', t.memberExpression(templateId, t.identifier('innerHTML')), t.stringLiteral(templateHTML))
  );
  const templateVar = t.variableDeclaration('const', [
    t.variableDeclarator(
      templateId,
      createTemplateExpression
    )
  ]);
  program.body.unshift(templateVar, setTemplateHTMLStatement);
  return templateId;
}

export default declare((api, options) => {
  api.assertVersion(7);

  const THROW_IF_NAMESPACE =
    options.throwIfNamespace === undefined ? true : !!options.throwIfNamespace;

  const PRAGMA_DEFAULT = options.pragma || 'mbx.createElement';
  const PRAGMA_FRAG_DEFAULT = options.pragmaFrag || 'mbx.Fragment';

  const JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  const JSX_FRAG_ANNOTATION_REGEX = /\*?\s*@jsxFrag\s+([^\s]+)/;

  // returns a closure that returns an identifier or memberExpression node
  // based on the given id
  const createIdentifierParser = (id: string) => () => {
    return id
      .split('.')
      .map(name => t.identifier(name))
      .reduce((object, property) => t.memberExpression(object, property));
  };

  const visitor = helper({
    pre(state) {
      const tagName = state.tagName;
      const args = state.args;
      if (t.react.isCompatTag(tagName)) {
        args.push(t.stringLiteral(tagName));
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
      const { file } = state;

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

  visitor.JSXElement = function(path) {
    console.log(path.node);
    createTemplate(path, extractHTML(path.node, []));
  }

  visitor.JSXAttribute = function(path) {
    if (t.isJSXElement(path.node.value)) {
      path.node.value = t.jsxExpressionContainer(path.node.value);
    }
  };

  visitor.JSXExpressionContainer = function(path) {
    if (t.isExpression(path.node.expression)) {
      path.node.expression = t.functionExpression(
        null,
        [],
        t.blockStatement([t.returnStatement(path.node.expression)]),
      );
    }
  };

  return {
    name: 'transform-react-jsx',
    inherits: jsx,
    visitor,
  };
});
