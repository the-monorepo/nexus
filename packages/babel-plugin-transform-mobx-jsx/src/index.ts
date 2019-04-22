/**
 * NOTE: Originally copy-paste of:
 * https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-jsx/src/index.js
 */
import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import helper from '@babel/helper-builder-react-jsx';
import { types as t } from '@babel/core';

function constDeclaration(id, expression) {
  return t.variableDeclaration('const', [
    t.variableDeclarator(
      id,
      expression
    )
  ]);
}

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
const SPREAD_TYPE = 3;
type DynamicType = typeof ATTR_TYPE | typeof PROP_TYPE | typeof EVENT_TYPE | typeof SPREAD_TYPE;
type DynamicField = {
  type: DynamicType;
  name: string;
  value: any;
}

function wrapInArrowFunctionExpression(expression) {
  return t.arrowFunctionExpression(
    [],
    expression,
  );
}

function mbxCallExpression(functionName, args) {
  return t.callExpression(
    mbxMemberExpression(functionName),
    args
  );
}

function fieldInfo(name: string | null) {
  if (name) {
    const cleanedName = name.replace(/^\$?\$?/, '');
    const type = name.match(/^\$\$/) ? EVENT_TYPE : name.match(/^\$/) ? PROP_TYPE : ATTR_TYPE;
    return { name: cleanedName, type };  
  } else {
    return { type: SPREAD_TYPE };
  }
}

function extractAttributeStringFromJSXAttribute(attribute, parentClient: ChildClient) {
  if (t.isJSXAttribute(attribute)) {
    const name = attribute.name.name;
    const value = attribute.value;
    if (t.isJSXExpressionContainer(value)) {
      const expression = value.expression;
      if (expression && expression.type.match(/Literal$/)) {
        return attributeLiteralToHTMLAttributeString(name, value.expression);
      } else {
        console.log('yes', parentClient);
        parentClient.addAttribute({
          name,
          expression: value.expression
        });
        return '';
      }
    }
    if (!attribute.value.type.match(/Literal$/)) {
      throw new Error(`Was expecting a literal type but got ${value.type}`);
    }
    return attributeLiteralToHTMLAttributeString(name, value);
  } else {
    throw new Error(`Unknown type ${attribute.type}`);
  }
}

type DynamicAttribute = {
  name: string | null;
  expression: any;
}

function mbxMemberExpression(field: string) {
  return t.memberExpression(
    t.identifier('mbx'),
    t.identifier(field)
  );
}

function attributeExpression(id, attribute: DynamicAttribute) {
  const { name, type } = fieldInfo(attribute.name);
  function nonSpreadFieldExpression(methodName) {
    return t.callExpression(mbxMemberExpression(methodName), [id, t.stringLiteral(name), wrapInArrowFunctionExpression(attribute.expression)]);
  }
  switch(type) {
    case ATTR_TYPE:
      return nonSpreadFieldExpression('attribute');
    case PROP_TYPE:
      return nonSpreadFieldExpression('property');
    case EVENT_TYPE:
      return nonSpreadFieldExpression('event');
    case SPREAD_TYPE:
      throw new Error('TODO');
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function declarationInfo(scope, parentId, index, name?: string) {
  const id = scope.generateUidIdentifier(`${name}$`);
  const declaration = constDeclaration(
    id, 
    t.memberExpression(
      t.memberExpression(
        parentId,
        t.identifier('children'),
      ),
      t.numericLiteral(index),
      true
    ),
  );
  return { id, declaration };
}

interface AbstractClient {
  declarationStatements(scope, parentId): { [Symbol.iterator]() },
  reactionExpressions(),
}
class DynamicChildClient implements AbstractClient {
  private parentId;
  private id;
  constructor(private readonly index: number, private readonly expression, private readonly name: string = 'marker') {
    
  }

  public *declarationStatements(scope, parentId) {
    const { declaration, id } = declarationInfo(scope, parentId, this.index, this.name);
    this.id = id;
    yield declaration;
    this.parentId = parentId;
  }

  public *reactionExpressions() {
    yield t.callExpression(
      mbxMemberExpression('children'),
      [
        this.id,
        wrapInArrowFunctionExpression(this.expression)
      ]
    );
  }
}

interface ChildClient extends AbstractClient { 
  addChildClient(client: AbstractClient);
  addAttribute(attribute: DynamicAttribute);
}

class Client implements ChildClient {
  private id;
  constructor(
    private readonly index: number,
    private readonly name: string = 'element',
    private readonly childClients: AbstractClient[] = [],
    private readonly attributes: DynamicAttribute[] = []  
  ) {
  }
  
  public *declarationStatements(scope, parentId) {
    if (this.attributes.length > 0 || this.childClients.length > 0) {
      const { declaration, id } = declarationInfo(scope, parentId, this.index, this.name);
      yield declaration;
      this.id = id;
      for(const client of this.childClients) {
        for(const statement of client.declarationStatements(scope, this.id)) {
          yield statement
        }
      }  
    }
  }

  public *reactionExpressions() {
    if (this.attributes.length > 0) {
      const attributeExpressions: any[] = [];
      for (const attribute of this.attributes) {
        attributeExpressions.push(attributeExpression(this.id, attribute));
      }
      yield t.callExpression(
        mbxMemberExpression('fields'),
        [this.id, ...attributeExpressions]
      );
    }

    for(const childClient of this.childClients) {
      for(const expression of childClient.reactionExpressions()) {
        yield expression;
      }
    } 
  }
  
  public addChildClient(client: AbstractClient) {
    this.childClients.push(client);
  }

  public addAttribute(attribute: DynamicAttribute) {
    this.attributes.push(attribute);
  }
}

class FragmentClient implements ChildClient {
  constructor(
    private readonly childClients: AbstractClient[] = []
  ) {}

  public *declarationStatements(scope, parentId) {
    for(const childClient of this.childClients) {
      for(const statement of childClient.declarationStatements(scope, parentId)) {
        yield statement;
      }
    }
  }

  public *reactionExpressions() {
    for(const childClient of this.childClients) {
      for(const expression of childClient.reactionExpressions()) {
        yield expression;
      }
    }
  }

  public addAttribute() {
    throw new Error("You can't have attributes on fragment clients");
  }

  public addChildClient(client) {
    this.childClients.push(client);
  }
}

type State = {
  length: number
};

function extractHTMLFromJSXElement(jsxElement, parentClient: ChildClient, state: State) {
  const jsxOpeningElement = jsxElement.openingElement;
  const tag = jsxOpeningElement.name.name;
  const client = new Client(state.length, tag);
  const attributeString = jsxOpeningElement.attributes.map(
      (jsxAttribute) => extractAttributeStringFromJSXAttribute(jsxAttribute, client)
    ).filter(string => string !== '')
    .join(' ');
  const nestedState: State = { length: 0 };
  const childrenString = jsxElement.children.map((child) => extractHTMLFromNode(child, client, nestedState)).join('');
  parentClient.addChildClient(client);
  state.length++;
  return `<${tag}${attributeString !== '' ? ` ${attributeString}` : ''}>${childrenString}</${tag}>`;
}

function extractHTMLFromJSXFragment(jsxFragment, parentClient, state: State) {
  return jsxFragment.children.map((child) => {
    return extractHTMLFromNode(child, parentClient, state);
  }).join('');
}

function extractHTMLFromJSXText(jsxText, state: State) {
  console.log(JSON.stringify(jsxText.value));
  const html = jsxText.value.replace(/^\s*\n\s*|\s*\n\s*$/g, '');
  state.length++;
  return html;
}

const HTMLComment = '<!---->';
function extractHTMLFromJSXExpressionContainerNode(node, parentClient: ChildClient, state: State) {
  const expression = node.expression;
  // TODO: Function and array literals
  if (t.isJSXElement(expression) || t.isJSXFragment(expression)) {
    return extractHTMLFromNode(expression, parentClient, state);
  } else if (t.isStringLiteral(expression)) {
    return expression.value;
  } else if (t.isNumericLiteral(expression) || t.isBooleanLiteral(expression)) {
    return expression.value.toString();
  } else {
    parentClient.addChildClient(new DynamicChildClient(state.length, expression));
    state.length++;
    return HTMLComment;
  }
}

function extractHTMLFromNode(node, parentClient: ChildClient, state: State) {
  if (t.isJSXElement(node)) {
    return extractHTMLFromJSXElement(node, parentClient, state);
  } else if (t.isJSXExpressionContainer(node)) {
    return extractHTMLFromJSXExpressionContainerNode(node, parentClient, state);
  } else if(t.isJSXFragment(node)) {
    return extractHTMLFromJSXFragment(node, parentClient, state);
  } else if(t.isJSXText(node)) {
    return extractHTMLFromJSXText(node, state);
  } else {
    throw new Error(`Invalid node type ${node.type}`);
  }
}

function findProgram(path) {
  return path.findParent(t => t.isProgram()).node;
}

// Taken from: https://github.com/ryansolid/babel-plugin-jsx-dom-expressions/blob/master/src/index.js
function addComponent(componentId, program, templateHTML, componentFactoryName) {
  const createTemplateExpression = mbxCallExpression(
    componentFactoryName,
    [t.stringLiteral(templateHTML)],
  );
  const templateVar = t.variableDeclaration('const', [
    t.variableDeclarator(
      componentId,
      createTemplateExpression
    )
  ]);
  program.body.unshift(templateVar);
}

function isElementTag(tag) {
  return tag[0].toLowerCase() === tag[0];
}

function generateComponentIdentifier(scope) {
  return scope.generateUidIdentifier('component$');
}

function isRootJSXNode(path) {
  const parent = path.parent;
  if (t.isJSXFragment(parent) || t.isJSXElement(parent)) {
    return false;
  } else if (t.isJSXExpressionContainer(parent)) {
    // TODO: Very confusing condition
    return isRootJSXNode(path.parentPath);
  } else {
    return true;
  }
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
      //path.unshift(t.memberExpression(t.identifier('swek'), t.identifier(1)));
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
    }
  }

  visitor.JSXElement = function(path) {
    if (isRootJSXNode(path)) {
      const program = findProgram(path);
      const client = new FragmentClient();
      const componentId = generateComponentIdentifier(path.scope);
      addComponent(
        componentId,
        program,
        extractHTMLFromNode(path.node, client, { length: 0 }),
        'elementComponent'
      );
      const rootId = path.scope.generateUidIdentifier('root$');
      path.replaceWithMultiple([
        constDeclaration(
          rootId,
          t.callExpression(
            t.memberExpression(componentId, t.identifier('create')),
            []
          )
        ),
        ...client.declarationStatements(path.scope, rootId),
        t.expressionStatement(t.callExpression(
          mbxMemberExpression('node'),
          [...client.reactionExpressions()]
        ))
      ]);
    }
  }

  visitor.JSXExpressionContainer = function(path) {
    if (t.isExpression(path.node.expression)) {
      /*path.node.expression = t.functionExpression(
        null,
        [],
        t.blockStatement([t.returnStatement(path.node.expression)]),
      );*/
    }
  };

  return {
    name: 'transform-react-jsx',
    inherits: jsx,
    visitor,
  };
});
