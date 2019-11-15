import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import helper from '@babel/helper-builder-react-jsx';
import { types as t } from '@babel/core';
import { JSXAttribute, JSXElement, JSXFragment, JSXText } from '@babel/types';
import { JSXExpressionContainer } from '@babel/types';

const mbxMemberExpression = (field: string) => {
  return t.memberExpression(t.identifier('mbx'), t.identifier(field));
};

const mbxCallExpression = (functionName, args) => {
  return t.callExpression(mbxMemberExpression(functionName), args);
};

const attributeLiteralToHTMLAttributeString = (field) => {
  const { key: name, expression: literal } = field;
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
    case 'TemplateLiteral':
      return literal.quasis[0];
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

type PropertyField = {
  type: typeof PROPERTY_TYPE;
  key: string;
  expression: any;
  setterId: any;
};
type SpreadField = {
  type: typeof SPREAD_TYPE;
  expression: any;
};
type EventField = {
  type: typeof EVENT_TYPE;
  key: string;
  expression: any;
};
type AttributeField = {
  type: typeof ATTRIBUTE_TYPE;
  key: string;
  expression: any;
};
type ElementField = AttributeField | PropertyField | EventField; // TODO: SpreadType

/**
 * We have no idea how many node will be in this section.
 * Could be 0, could be 100
 */
type DynamicSection = {
  type: typeof DYNAMIC_TYPE;
  expression: any;
};
/**
 * Just a typical HTML/XML element
 */
type ElementNode = {
  type: typeof ELEMENT_TYPE;
  tag: string;
  children: Node[];
  fields: ElementField[];
  id: any;
};

const SUBCOMPONENT_PROPERTY_TYPE = 'subcomponent_property';
type SubcomponentPropertyField = {
  type: typeof SUBCOMPONENT_PROPERTY_TYPE;
  key: string;
  expression: any;
};

type SubcomponentField = SubcomponentPropertyField | SpreadField;

/**
 * Represents things like:
 * <Subcomponent><child>...</child>...</SubComponent>
 * Note that this is similar to a DynamicSection in that we have
 * no idea how many root nodes the subcomponent represents:
 * Could be 0, could 100
 */
type SubcomponentNode = {
  type: typeof SUBCOMPONENT_TYPE;
  nameExpression: any;
  children: Node[];
  childrenTemplateId: any;
  fields: SubcomponentField[];
};
/**
 * Just a text node
 */
type TextNode = {
  type: typeof TEXT_TYPE;
  text: string;
  id?: any;
};
type Node = DynamicSection | ElementNode | TextNode | SubcomponentNode;
function domNodeFromJSXText(jsxText: JSXText, previousIsDynamic: boolean, scope) {
  return domNodeFromString(jsxText.value, previousIsDynamic, scope);
}

const isElementTag = (tag: string) => {
  return tag[0].toLowerCase() === tag[0];
};

const isLiteral = (value): boolean => value && value.type.match(/Literal$/) && (value.type !== 'TemplateLiteral' || value.expressions.length <= 0);

const isStatic = value => {
  return (
    value &&
    (isLiteral(value) ||
      t.isArrowFunctionExpression(value) ||
      t.isFunctionExpression(value))
  );
};

const fieldType = (name: string) => {
  return name.match(/^\$\$/)
    ? EVENT_TYPE
    : name.match(/^\$/)
    ? PROPERTY_TYPE
    : ATTRIBUTE_TYPE;
};

const findProgramAndOuterPath = path => {
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
};

const isRootJSXNode = path => {
  const parent = path.parent;
  if (t.isJSXFragment(parent) || t.isJSXElement(parent)) {
    return false;
  } else if (t.isJSXExpressionContainer(parent)) {
    // TODO: Very confusing condition
    return isRootJSXNode(path.parentPath);
  } else {
    return true;
  }
};

const cleanFieldName = (name: string) => name.replace(/^\$?\$?/, '');

const valueExpressionFromJsxAttributeValue = (jsxValue: JSXAttribute['value']) =>
  t.isJSXExpressionContainer(jsxValue) ? jsxValue.expression : jsxValue;

const domNodesFromJSXChildren = (
  jsxChildren: JSXElement['children'],
  scope,
  outerPath,
): any[] => {
  const children: Node[] = [];
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

const hasDynamicNodes = (children: Node[]) => {
  return children.some(
    childNode =>
      childNode.type === DYNAMIC_TYPE ||
      (childNode.type === ELEMENT_TYPE && childNode.id) ||
      SUBCOMPONENT_TYPE,
  );
};

const domNodeFromJSXElement = (
  jsxElement: JSXElement,
  previousIsDynamic,
  scope,
  outerPath,
): SubcomponentNode | ElementNode => {
  const jsxOpeningElement = jsxElement.openingElement;

  const jsxAttributes = jsxElement.openingElement.attributes;
  if (
    t.isJSXIdentifier(jsxOpeningElement.name) &&
    isElementTag(jsxOpeningElement.name.name)
  ) {
    const tag = jsxOpeningElement.name.name;
    const potentialId = scope.generateUidIdentifier(`${tag}$`);
    const fields: ElementField[] = jsxAttributes.map(
      (jsxAttribute): ElementField => {
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
                    t.arrowFunctionExpression(
                      [elementId, valueId],
                      t.assignmentExpression(
                        '=',
                        t.memberExpression(elementId, t.identifier(key)),
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
            } as ElementField;
        }
      },
    );
    const children = domNodesFromJSXChildren(jsxElement.children, scope, outerPath);
    const childrenAreDynamic = hasDynamicNodes(children);
    const nonStaticAttributeFields = fields.filter(
      field => !(field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)),
    );
    const resultNode: ElementNode = {
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
    const fields: SubcomponentField[] = jsxAttributes.map(
      (jsxAttribute): SubcomponentField => {
        if (t.isJSXSpreadAttribute(jsxAttribute)) {
          const result: SpreadField = {
            type: SPREAD_TYPE,
            expression: jsxAttribute.argument, // TODO: Check this is right
          };
          return result;
        } else {
          const result: SubcomponentPropertyField = {
            type: SUBCOMPONENT_PROPERTY_TYPE,
            key: jsxAttribute.name.name,
            expression: valueExpressionFromJsxAttributeValue(jsxAttribute.value),
          };
          return result;
        }
      },
    );
    const children = domNodesFromJSXChildren(jsxElement.children, scope, outerPath);
    const resultNode: SubcomponentNode = {
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

const domNodeFromString = (
  aString: string,
  previousIsDynamic: boolean,
  scope,
): TextNode | null => {
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

const isDynamicDomlessNode = (node: Node) => {
  return node.type === DYNAMIC_TYPE || node.type === SUBCOMPONENT_TYPE;
};

function* yieldDomNodeFromJSXFragment(
  jsxFragment: JSXFragment,
  previousIsDynamic: boolean,
  scope,
  outerPath,
) {
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
  node: JSXExpressionContainer,
  previousIsDynamic: boolean,
  scope,
  outerPath,
): IterableIterator<Node> {
  const expression = node.expression;
  // TODO: Function and array literals
  if (t.isJSXElement(expression) || t.isJSXFragment(expression)) {
    yield* yieldDomNodeFromNodeSimplified(
      expression,
      previousIsDynamic,
      scope,
      outerPath,
    );
  } else if (t.isStringLiteral(expression)) {
    // TODO: Two contained literals next to each other would lead to incorrect state length
    const textNode = domNodeFromString(expression.value, previousIsDynamic, scope);
    if (textNode) {
      yield textNode;
    }
  } else if (t.isNumericLiteral(expression) || t.isBooleanLiteral(expression)) {
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

function* yieldDomNodeFromNodeNonSimplified(
  node: JSXElement['children'][0],
  previousIsDynamic,
  scope,
  outerPath,
): IterableIterator<Node> {
  if (t.isJSXElement(node)) {
    yield domNodeFromJSXElement(node, previousIsDynamic, scope, outerPath);
  } else if (t.isJSXExpressionContainer(node)) {
    yield* yieldDomNodeFromJSXExpressionContainerNode(
      node,
      previousIsDynamic,
      scope,
      outerPath,
    );
  } else if (t.isJSXFragment(node)) {
    yield* yieldDomNodeFromJSXFragment(node, previousIsDynamic, scope, outerPath);
  } else if (t.isJSXText(node)) {
    const textNode = domNodeFromJSXText(node, previousIsDynamic, scope);
    if (textNode) {
      yield textNode;
    }
  } else {
    throw new Error(`Invalid node type ${node.type}`);
  }
}

function* yieldDomNodeFromNodeSimplified(
  node: JSXElement | JSXFragment,
  previousIsDynamic: boolean,
  scope,
  outerPath,
): IterableIterator<Node> {
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

const htmlFromNode = (node: Node): string => {
  switch (node.type) {
    case ELEMENT_TYPE:
      const tag: string = node.tag;
      const attributeString: string = (node.fields.filter(
        field => field.type === ATTRIBUTE_TYPE && isLiteral(field.expression),
      ) as AttributeField[])
        .map(field => attributeLiteralToHTMLAttributeString(field))
        .join(' ');
      const childrenString: string = node.children
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
  return t.variableDeclaration('const', [t.variableDeclarator(id, expression)]);
};

const STATIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'staticElementBlueprint';
const DYNAMIC_ELEMENT_TEMPLATE_FACTORY_NAME = 'elementBlueprint';
const STATIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'staticFragmentBlueprint';
const DYNAMIC_FRAGMENT_TEMPLATE_FACTORY_NAME = 'fragmentBlueprint';

function* yieldDeclarationStatementsFromRootNodes(
  nodes: Node[],
  rootId: any,
  isRoot: boolean,
) {
  const childrenWithDomNodesAssociatedWithThem: ElementNode[] = nodes.filter(
    child => child.type === ELEMENT_TYPE,
  ) as ElementNode[];

  if (childrenWithDomNodesAssociatedWithThem.length > 0) {
    const firstNode = childrenWithDomNodesAssociatedWithThem[0];
    if (firstNode.id) {
      if (isRoot && childrenWithDomNodesAssociatedWithThem.length === 1) {
        yield constDeclaration(firstNode.id, rootId);
      } else {
        yield constDeclaration(
          firstNode.id,
          t.memberExpression(rootId, t.identifier('firstChild')),
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
            t.memberExpression(previousNode.id, t.identifier('nextSibling')),
          );
        } else {
          yield constDeclaration(
            childNode.id,
            t.memberExpression(
              t.memberExpression(rootId, t.identifier('childNodes')),
              t.numericLiteral(c),
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
    }
    // TODO: Could do previousSibling if the last node uses lastChild
    if (childrenWithDomNodesAssociatedWithThem.length >= 2) {
      const lastNode =
        childrenWithDomNodesAssociatedWithThem[
          childrenWithDomNodesAssociatedWithThem.length - 1
        ];
      if (lastNode.id) {
        yield constDeclaration(
          lastNode.id,
          t.memberExpression(rootId, t.identifier('lastChild')),
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
  previousConsecutiveDynamicNodeCount: number,
) => {
  if (previousConsecutiveDynamicNodeCount === 1) {
    return mbxCallExpression('children', [rootId, beforeId]);
  } else if (previousConsecutiveDynamicNodeCount >= 2) {
    return mbxCallExpression('dynamicSection', [
      rootId,
      beforeId,
      t.numericLiteral(previousConsecutiveDynamicNodeCount),
    ]);
  }
  return null;
};

const setterMap = new Map();
function* yieldFieldExpressionsFromNodes(nodes: Node[], rootId) {
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
                    t.stringLiteral(field.key),
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
    t.identifier('null'),
    previousConsecutiveDynamicNodeCount,
  );
  if (dynamicExpression !== null) {
    yield dynamicExpression;
  }
}

function* yieldFieldValuesFromNode(node: Node) {
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
      const objectProperties: any[] = [];
      for (const field of node.fields) {
        switch (field.type) {
          case SPREAD_TYPE:
            objectProperties.push(field.expression);
            break;
          case SUBCOMPONENT_PROPERTY_TYPE:
            objectProperties.push(
              t.objectProperty(t.identifier(field.key), field.expression),
            );
            break;
        }
      }
      if (node.childrenTemplateId) {
        const childArgs: any[] = [node.childrenTemplateId];
        for (const childNode of node.children) {
          childArgs.push(...yieldFieldValuesFromNode(childNode));
        }
        objectProperties.push(
          t.objectProperty(
            t.identifier('children'),
            mbxCallExpression('componentResult', childArgs),
          ),
        );
      }
      // TODO: This whole block of code assumes that it's a SFC and not a string (representing an HTML element)
      yield t.callExpression(t.identifier(node.nameExpression.name), [
        t.objectExpression(objectProperties),
      ]);
  }
}

const nodeHasDom = (node: Node) => node.type === ELEMENT_TYPE || node.type === TEXT_TYPE;

function* yieldTemplateInfoFromRootNodes(nodes: Node[], templateId, scope) {
  const subcomponentNodes: SubcomponentNode[] = nodes.filter(
    node => node.type === SUBCOMPONENT_TYPE,
  ) as SubcomponentNode[];
  for (const subcomponentNode of subcomponentNodes) {
    yield* yieldTemplateInfoFromSubcomponentNode(subcomponentNode, scope);
  }

  const nodesWithDom: (ElementNode | TextNode)[] = nodes.filter(nodeHasDom) as (
    | ElementNode
    | TextNode)[];
  const dynamicElementLength = nodes.filter(
    node =>
      node.type === DYNAMIC_TYPE ||
      node.type === SUBCOMPONENT_TYPE ||
      (node.type === ELEMENT_TYPE && node.id),
  ).length;
  const args = [t.stringLiteral(nodes.map(node => htmlFromNode(node)).join(''))];
  let templateMethod: string;
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
    statements.push(t.returnStatement(t.arrayExpression(fieldExpressions)));
    args.push(t.arrowFunctionExpression([rootParamId], t.blockStatement(statements)));
  }
  yield constDeclaration(templateId, mbxCallExpression(templateMethod, args));
}

function* yieldTemplateInfoFromSubcomponentNode(node: SubcomponentNode, scope) {
  if (node.childrenTemplateId) {
    yield* yieldTemplateInfoFromRootNodes(node.children, node.childrenTemplateId, scope);
  }
}

const replacePathWithDomNodeSyntax = (nodes: Node[], path, outerPath) => {
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
    const componentResultArgs: any[] = [];
    for (const node of nodes) {
      componentResultArgs.push(...yieldFieldValuesFromNode(node));
    }
    if (componentResultArgs.length === 1) {
      path.replaceWith(t.expressionStatement(componentResultArgs[0]));
    } else {
      path.replaceWith(t.expressionStatement(t.arrayExpression(componentResultArgs)));
    }
  } else {
    const componentResultArgs = [templateId];
    for (const node of nodes) {
      componentResultArgs.push(t.arrayExpression([...yieldFieldValuesFromNode(node)]));
    }
    path.replaceWith(
      t.expressionStatement(mbxCallExpression('componentResult', componentResultArgs)),
    );
  }
};

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
    inherits: jsx,
    visitor,
  };
});
