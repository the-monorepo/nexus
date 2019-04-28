/**
 * NOTE: Originally copy-paste of:
 * https://github.com/babel/babel/blob/master/packages/babel-plugin-transform-react-jsx/src/index.js
 */
import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import helper from '@babel/helper-builder-react-jsx';
import { types as t } from '@babel/core';
import { reaction } from 'mobx';

function constDeclaration(id, expression) {
  return t.variableDeclaration('const', [t.variableDeclarator(id, expression)]);
}

function attributeLiteralToHTMLAttributeString(name: string, literal) {
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
      throw new Error(`Invalid literal type: ${literal.type}`);
  }
}
const ATTR_TYPE = 0;
const PROP_TYPE = 1;
const EVENT_TYPE = 2;
const SPREAD_TYPE = 3;
type DynamicType =
  | typeof ATTR_TYPE
  | typeof PROP_TYPE
  | typeof EVENT_TYPE
  | typeof SPREAD_TYPE;
interface DynamicField {
  type: DynamicType;
  name: string;
  value: any;
}

function wrapInArrowFunctionExpression(expression) {
  return t.arrowFunctionExpression([], expression);
}

function mbxCallExpression(functionName, args) {
  return t.callExpression(mbxMemberExpression(functionName), args);
}

function fieldInfo(name: string | null) {
  if (name) {
    const cleanedName = name.replace(/^\$?\$?/, '');
    const type = name.match(/^\$\$/)
      ? EVENT_TYPE
      : name.match(/^\$/)
      ? PROP_TYPE
      : ATTR_TYPE;
    return { name: cleanedName, type };
  } else {
    return { type: SPREAD_TYPE };
  }
}
interface StaticField {
  name: string;
  literal;
}
interface FieldHoldingClient {
  addStaticField(attribute: StaticField);
  addDynamicField(attribute: DynamicAttribute);
}

function isStatic(value) {
  return (
    value &&
    (value.type.match(/Literal$/) ||
      t.isArrowFunctionExpression(value) ||
      t.isFunctionExpression(value) ||
      t.isIdentifier(value)
    )
  );
}

function addFieldToClientFromJSXAttribute(field, client: FieldHoldingClient) {
  if (t.isJSXAttribute(field)) {
    const name = field.name.name;
    const value = field.value;
    if (t.isJSXExpressionContainer(value)) {
      const expression = value.expression;
      if (isStatic(expression)) {
        client.addStaticField({
          name,
          literal: expression,
        });
      } else {
        client.addDynamicField({
          name,
          expression,
        });
      }
    } else if (isStatic(field.value)) {
      client.addStaticField({
        name,
        literal: value,
      });
    } else {
      throw new Error(`Was expecting a literal type but got ${value.type}`);
    }
  } else {
    throw new Error(`Unknown type ${field.type}`);
  }
}

interface DynamicAttribute {
  name: string | null;
  expression: any;
}

function mbxMemberExpression(field: string) {
  return t.memberExpression(t.identifier('mbx'), t.identifier(field));
}

function fieldExpression(id, attribute: DynamicAttribute) {
  const { name, type } = fieldInfo(attribute.name);
  function nonSpreadFieldExpression(methodName) {
    return t.callExpression(mbxMemberExpression(methodName), [
      t.stringLiteral(name),
      wrapInArrowFunctionExpression(attribute.expression),
    ]);
  }
  switch (type) {
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

function declarationInfo(scope, parentId, index, name: string) {
  const id = scope.generateUidIdentifier(`${name}$`);
  const declaration = constDeclaration(
    id,
    t.memberExpression(
      t.memberExpression(parentId, t.identifier('childNodes')),
      t.numericLiteral(index),
      true,
    ),
  );
  return { id, declaration };
}

interface AbstractClient {
  templateStatements(scope): { [Symbol.iterator]() };
  // TODO: Bit of a hack passing down isParent not event sure if it works if u have fragments
  declarationStatements(scope, parentId, isParent: boolean): { [Symbol.iterator]() };
  reactionExpressions();
  html(): string;
}
class DynamicChildrenClient implements AbstractClient {
  private id;
  constructor(
    private readonly index: number,
    private readonly expression,
    private readonly name: string = 'marker',
  ) {}

  public html() {
    return HTMLDynamicChildrenMarker;
  }

  public *templateStatements() {}

  public *declarationStatements(scope, parentId) {
    const { declaration, id } = declarationInfo(scope, parentId, this.index, this.name);
    this.id = id;
    yield declaration;
  }

  public *reactionExpressions() {
    yield t.callExpression(mbxMemberExpression('children'), [
      this.id,
      wrapInArrowFunctionExpression(this.expression),
    ]);
  }
}

interface ChildClient extends AbstractClient {
  addChildClient(client: AbstractClient);
}

function cleanedFieldName(name: string) {
  return name.replace(/^\$?\$?/, '');
}

function fieldType(name: string) {
  return name.match(/^\$\$/) ? EVENT_TYPE : name.match(/^\$/) ? PROP_TYPE : ATTR_TYPE;
}

const ELEMENT_TEMPLATE_FACTORY_NAME = 'elementTemplate';
const FRAGMENT_TEMPLATE_FACTORY_NAME = 'fragmentTemplate';
function templateDeclaration(templateId, factoryFunctionName, childClients) {
  return constDeclaration(
    templateId,
    mbxCallExpression(factoryFunctionName, [
      t.stringLiteral(childClients.map(client => client.html()).join('')),
    ]),
  );
}

function createFromTemplateDeclaration(id, templateId) {
  return constDeclaration(id, t.callExpression(templateId, []));
}

class StaticElementClient implements ChildClient, FieldHoldingClient {
  private id;
  constructor(
    private readonly index: number,
    private readonly jsxElement,
    private readonly name: string = 'element',
    private readonly childClients: AbstractClient[] = [],
    private readonly staticFields: StaticField[] = [],
    private readonly dynamicFields: DynamicAttribute[] = [],
  ) {}

  addStaticField(field) {
    // TODO: Having seperate arrays for static and dynamic breaks override ordering
    this.staticFields.push(field);
  }

  addDynamicField(field) {
    this.dynamicFields.push(field);
  }

  html() {
    const attributeString = this.staticFields
      .filter(field => fieldType(field.name) === ATTR_TYPE)
      .map(({ name, literal }) => {
        return attributeLiteralToHTMLAttributeString(name, literal);
      })
      .filter(string => string !== '')
      .join(' ');
    const tag = this.jsxElement.openingElement.name.name;
    const childrenString = this.childClients.map(client => client.html()).join('');
    return `<${tag}${
      attributeString !== '' ? ` ${attributeString}` : ''
    }>${childrenString}</${tag}>`;
  }

  public *templateStatements(scope) {
    for (const client of this.childClients) {
      yield* client.templateStatements(scope);
    }
  }

  public *declarationStatements(scope, parentId, isParent) {
    const nonAttributeStaticFields: StaticField[] = this.staticFields.filter(
      field => fieldType(field.name) !== ATTR_TYPE,
    );
    if (
      this.childClients.length > 0 ||
      nonAttributeStaticFields.length > 0 ||
      this.dynamicFields.length > 0
    ) {
      if (isParent) {
        this.id = parentId;
      } else {
        const { declaration, id } = declarationInfo(
          scope,
          parentId,
          this.index,
          this.name,
        );
        yield declaration;
        this.id = id;
      }
      for (const client of this.childClients) {
        yield* client.declarationStatements(scope, this.id, false);
      }

      for (const field of nonAttributeStaticFields) {
        const type = fieldType(field.name);
        const cleanedName = cleanedFieldName(field.name);
        switch (type) {
          case PROP_TYPE:
            yield t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(this.id, t.identifier(cleanedName)),
                field.literal,
              ),
            );
            break;
          case EVENT_TYPE:
            yield t.expressionStatement(
              t.callExpression(
                t.memberExpression(this.id, t.identifier('addEventListener')),
                [t.stringLiteral(cleanedName), field.literal],
              ),
            );
            break;
          default:
            throw new Error(`Unexpected field type ${type}`);
        }
      }
    }
  }

  public *reactionExpressions() {
    if (this.dynamicFields.length > 0) {
      const fieldExpressions: any[] = [];
      for (const attribute of this.dynamicFields) {
        fieldExpressions.push(fieldExpression(this.id, attribute));
      }
      yield t.callExpression(mbxMemberExpression('fields'), [
        this.id,
        ...fieldExpressions,
      ]);
    }

    for (const childClient of this.childClients) {
      yield* childClient.reactionExpressions();
    }
  }

  public addChildClient(client: AbstractClient) {
    this.childClients.push(client);
  }
}

class RootElementClient implements ChildClient {
  public id;
  private templateId;
  constructor(private readonly childClients: AbstractClient[] = []) {}

  html() {
    return '';
  }

  public *templateStatements(scope) {
    for (const client of this.childClients) {
      yield* client.templateStatements(scope);
    }
    this.templateId = scope.generateUidIdentifier('template$');
    yield templateDeclaration(
      this.templateId,
      ELEMENT_TEMPLATE_FACTORY_NAME,
      this.childClients,
    );
  }

  public *declarationStatements(scope) {
    this.id = scope.generateUidIdentifier('root$');
    yield createFromTemplateDeclaration(this.id, this.templateId);
    for (const childClient of this.childClients) {
      yield* childClient.declarationStatements(scope, this.id, true);
    }
  }

  public *reactionExpressions() {
    for (const childClient of this.childClients) {
      yield* childClient.reactionExpressions();
    }
  }

  public addAttribute() {
    throw new Error("You can't have attributes on fragment clients");
  }

  public addChildClient(client) {
    this.childClients.push(client);
  }
}

interface State {
  length: number;
}

class SubComponentClient implements ChildClient, FieldHoldingClient {
  private id;
  private placeholderId;
  private templateId;
  constructor(
    private readonly index: number,
    private readonly nameExpression,
    private readonly childClients: AbstractClient[] = [],
    private readonly fields: (
      | { type: 'static'; field: StaticField }
      | { type: 'dynamic'; field: DynamicAttribute })[] = [],
  ) {}
  public html() {
    return HTMLPlaceholder;
  }
  public *templateStatements(scope) {
    if (this.childClients.length > 0) {
      this.templateId = scope.generateUidIdentifier('subTemplate$');
      yield templateDeclaration(
        this.templateId,
        this.childClients.length <= 1
          ? ELEMENT_TEMPLATE_FACTORY_NAME
          : FRAGMENT_TEMPLATE_FACTORY_NAME,
        this.childClients,
      );
    }
    for (const client of this.childClients) {
      yield* client.templateStatements(scope);
    }
  }
  public *declarationStatements(scope, parentId, isParent) {
    if (isParent) {
      this.placeholderId = parentId;
    } else {
      const placeholderInfo = declarationInfo(scope, parentId, this.index, 'placeholder');
      this.placeholderId = placeholderInfo.id;
      yield placeholderInfo.declaration;
    }
    if (this.templateId) {
      this.id = scope.generateUidIdentifier('subRoot$');
      yield createFromTemplateDeclaration(this.id, this.templateId);
      for (const client of this.childClients) {
        yield* client.declarationStatements(
          scope,
          this.id,
          this.childClients.length <= 1,
        );
      }
    }
  }
  public *reactionExpressions() {
    const reactionExpressions: any[] = [];
    for (const fieldHolder of this.fields) {
      const { type, field } = fieldHolder;
      if (type === 'static') {
        reactionExpressions.push(
          mbxCallExpression('staticField', [
            t.stringLiteral(field.name),
            (field as StaticField).literal,
          ]),
        );
      } else {
        reactionExpressions.push(
          mbxCallExpression('dynamicField', [
            t.stringLiteral(field.name),
            wrapInArrowFunctionExpression((field as DynamicAttribute).expression),
          ]),
        );
      }
    }

    yield mbxCallExpression('subComponent', [
      t.isJSXIdentifier(this.nameExpression)
        ? t.identifier(this.nameExpression.name)
        : this.nameExpression,
      this.placeholderId,
      this.id ? this.id : t.identifier('undefined'),
      ...reactionExpressions,
    ]);

    for (const client of this.childClients) {
      yield* client.reactionExpressions();
    }
  }
  public addDynamicField(field) {
    this.fields.push({ type: 'dynamic', field });
  }
  public addStaticField(field) {
    this.fields.push({ type: 'static', field });
  }
  public addChildClient(client: AbstractClient) {
    this.childClients.push(client);
  }
}

function clientFromJSXElement(jsxElement, state: State): ChildClient {
  const jsxOpeningElement = jsxElement.openingElement;
  const newClient = (() => {
    if (
      t.isJSXIdentifier(jsxOpeningElement.name) &&
      isElementTag(jsxOpeningElement.name.name)
    ) {
      const tag = jsxOpeningElement.name.name;
      const client = new StaticElementClient(state.length, jsxElement, tag);
      const ownState = { length: 0 };
      for (const child of jsxElement.children) {
        const childClient = clientFromNode(child, ownState);
        if (childClient) {
          client.addChildClient(childClient);
        }
      }
      state.length++;
      return client;
    } else {
      const client = new SubComponentClient(state.length, jsxOpeningElement.name);
      const ownState = { length: 0 };
      for (const child of jsxElement.children) {
        const childClient = clientFromNode(child, ownState);
        if (childClient) {
          client.addChildClient(childClient);
        }
      }
      state.length++;
      return client;
    }
  })();
  jsxElement.openingElement.attributes.forEach(field =>
    addFieldToClientFromJSXAttribute(field, newClient),
  );
  return newClient;
}

class FragmentClient implements ChildClient {
  constructor(private readonly childClients: ChildClient[]) {}
  public html() {
    return this.childClients.map(client => client.html()).join('');
  }
  public addChildClient(client) {
    this.childClients.push(client);
  }
  public *templateStatements(scope) {
    for (const client of this.childClients) {
      yield* client.templateStatements(scope);
    }
  }
  public *reactionExpressions() {
    for (const client of this.childClients) {
      yield* client.reactionExpressions();
    }
  }
  public *declarationStatements(scope, parentId, isParent) {
    for (const client of this.childClients) {
      yield* client.declarationStatements(scope, parentId, isParent);
    }
  }
}

class TextClient implements AbstractClient {
  constructor(private readonly text: string) {}
  html() {
    return this.text;
  }
  *templateStatements() {}
  *declarationStatements() {}
  *reactionExpressions() {}
}

function clientFromJSXFragment(jsxFragment, state: State): FragmentClient {
  return new FragmentClient(
    jsxFragment.children.map(child => {
      return clientFromNode(child, state);
    }),
  );
}

function clientFromJSXText(jsxText, state: State): TextClient | null {
  return clientFromString(jsxText.value, state);
}

function clientFromString(aString: string, state: State): TextClient | null {
  const html = aString.replace(/^\s*\n\s*|\s*\n\s*$/g, '');
  if (html === '') {
    return null;
  }
  state.length++;
  return new TextClient(html);
}

const HTMLComment = '<!---->';
const HTMLDynamicChildrenMarker = HTMLComment;
const HTMLPlaceholder = HTMLComment;
function clientFromJSXExpressionContainerNode(node, state: State): AbstractClient | null {
  const expression = node.expression;
  // TODO: Function and array literals
  if (t.isJSXElement(expression) || t.isJSXFragment(expression)) {
    return clientFromNode(expression, state);
  } else if (t.isStringLiteral(expression)) {
    // TODO: Two contained literals next to each other would lead to incorrect state length
    return clientFromString(expression.value, state);
  } else if (t.isNumericLiteral(expression) || t.isBooleanLiteral(expression)) {
    return clientFromString(expression.value.toString(), state);
  } else {
    const client = new DynamicChildrenClient(state.length, expression);
    state.length++;
    return client;
  }
}

function clientFromNode(node, state: State): AbstractClient | null {
  if (t.isJSXElement(node)) {
    return clientFromJSXElement(node, state);
  } else if (t.isJSXExpressionContainer(node)) {
    return clientFromJSXExpressionContainerNode(node, state);
  } else if (t.isJSXFragment(node)) {
    return clientFromJSXFragment(node, state);
  } else if (t.isJSXText(node)) {
    return clientFromJSXText(node, state);
  } else {
    throw new Error(`Invalid node type ${node.type}`);
  }
}

function findProgramAndOuterPath(path) {
  const parent = path.parentPath;
  if (!parent) {
    return { program: path };
  } else {
    const result = findProgramAndOuterPath(parent);
    if (result.path) {
      return result;
    } else {
      return { program: result.program, path: path };
    }
  }
}

function isElementTag(tag) {
  return tag[0].toLowerCase() === tag[0];
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
  };

  visitor.JSXElement = function(path) {
    if (isRootJSXNode(path)) {
      const client = new RootElementClient();
      client.addChildClient(clientFromJSXElement(path.node, { length: 0 }));
      const result = findProgramAndOuterPath(path);
      const outerPath = result.path;
      for (const statement of client.templateStatements(path.scope)) {
        outerPath.insertBefore(statement);
      }

      const replacementStatements = [...client.declarationStatements(path.scope)];
      const reactionExpressions = [...client.reactionExpressions()];
      if (reactionExpressions.length > 0) {
        replacementStatements.push(
          t.expressionStatement(
            t.callExpression(mbxMemberExpression('dynamicNode'), [
              client.id,
              ...reactionExpressions,
            ]),
          ),
        );
      } else {
        replacementStatements.push(
          t.expressionStatement(
            t.callExpression(mbxMemberExpression('staticNode'), [client.id]),
          ),
        );
      }
      path.replaceWithMultiple(replacementStatements);
    }
  };
  /*
  visitor.JSXExpressionContainer = {
    enter(path) {
      if (path.match(/Literal$/)) {
        const literal = path.expression;
        const parent = path.parent;
        if (t.isJSXElement(parent)) {
          // TODO:
          path.replaceWith(t.jsxText());
        } else {
          path.replaceWith(literal);
        }
      }
    }
  };*/

  return {
    name: 'transform-react-jsx',
    inherits: jsx,
    visitor,
  };
});
