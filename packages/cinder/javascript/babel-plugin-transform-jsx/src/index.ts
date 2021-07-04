import * as core from '@babel/core';
import helper from '@babel/helper-builder-react-jsx';
import { declare } from '@babel/helper-plugin-utils';
import jsx from '@babel/plugin-syntax-jsx';
import * as tr from '@babel/traverse';
import type { JSXElement, JSXText, JSXExpressionContainer } from '@babel/types';
import * as t from '@babel/types';

import PRAGMA from './DefaultPragma.ts';

const cinderMemberExpression = (field: string) => {
  return t.memberExpression(t.identifier(PRAGMA), t.identifier(field));
};

const cinderCallExpression = (
  functionName: string,
  args: Parameters<typeof t.callExpression>[1],
) => {
  return t.callExpression(cinderMemberExpression(functionName), args);
};

const attributeLiteralToHTMLAttributeString = (field: LiteralAttributeField) => {
  const { key: name, expression: literalPath } = field;
  // TODO: Refactor
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
const ASYNC_ITERATOR_TYPE = 'asyncIterator';

type JSXChildrenNode =
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment;

type PropertyField = {
  type: typeof PROPERTY_TYPE;
  key: string;
  expression: tr.NodePath<
    Exclude<
      t.JSXAttribute['value'] | t.JSXExpressionContainer['expression'],
      t.JSXExpressionContainer
    >
  >;
  setterId: any;
};

type SpreadField = {
  type: typeof SPREAD_TYPE;
  expression: tr.NodePath<t.JSXSpreadAttribute['argument']>;
};

type EventField = {
  type: typeof EVENT_TYPE;
  key: string;
  expression: tr.NodePath<
    Exclude<
      t.JSXAttribute['value'] | t.JSXExpressionContainer['expression'],
      t.JSXExpressionContainer
    >
  >;
};

type DynamicAttributeField = {
  type: typeof ATTRIBUTE_TYPE;
  key: string;
  expression: tr.NodePath<
    Exclude<
      t.JSXAttribute['value'] | t.JSXExpressionContainer['expression'],
      t.JSXExpressionContainer
    >
  >;
};

type LiteralAttributeField = {
  type: typeof ATTRIBUTE_TYPE;
  key: string;
  expression: tr.NodePath<Exclude<t.Literal, t.JSXAttribute['value']>>;
};

type AttributeField = DynamicAttributeField | LiteralAttributeField;

type InnerField = AttributeField | PropertyField | EventField | SpreadField;
type AsyncField = {
  type: typeof ASYNC_ITERATOR_TYPE;
  innerField: InnerField;
};

type ElementField =
  | AttributeField
  | PropertyField
  | EventField
  | SpreadField
  | AsyncField; // TODO: SpreadType

/**
 * We have no idea how many node will be in this section.
 * Could be 0, could be 100
 */
type DynamicSection = {
  type: typeof DYNAMIC_TYPE;
  expression: tr.NodePath;
};
/**
 * Just a typical HTML/XML element
 */
type ElementNode = {
  type: typeof ELEMENT_TYPE;
  tag: string;
  children: Node[];
  fields: ElementField[];
  id: t.Identifier | null;
};

const SUBCOMPONENT_PROPERTY_TYPE = 'subcomponent_property';
type SubcomponentPropertyField = {
  type: typeof SUBCOMPONENT_PROPERTY_TYPE;
  key: string;
  expression: tr.NodePath<t.Expression | null>;
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
  nameExpression: tr.NodePath<t.JSXOpeningElement['name']>; // TODO
  children: Node[];
  childrenTemplateId: t.Identifier | null;
  fields: SubcomponentField[];
};

/**
 * Just a text node
 */
type TextNode = {
  type: typeof TEXT_TYPE;
  text: string;
  id: t.Identifier | null;
};

type Node = DynamicSection | ElementNode | TextNode | SubcomponentNode;

const jsxIdentifierOrNamespaceToNonJsxSyntax = (
  identifier: tr.NodePath<t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName>,
): t.MemberExpression | t.Identifier => {
  if (identifier.isJSXIdentifier()) {
    return t.identifier(identifier.node.name);
  } else if (identifier.isJSXMemberExpression()) {
    return t.memberExpression(
      jsxIdentifierOrNamespaceToNonJsxSyntax(identifier.get('object')),
      jsxIdentifierOrNamespaceToNonJsxSyntax(identifier.get('property')),
    );
  } else {
    throw new Error('TODO');
  }
};

export default declare((api, options) => {
  api.assertVersion(7);

  function domNodeFromJSXText(
    path: tr.NodePath<JSXText>,
    previousIsDynamic: boolean,
    scope,
  ) {
    return domNodeFromString(path.node.value, previousIsDynamic, scope);
  }

  const isElementTag = (tag: string) => {
    return tag[0].toLowerCase() === tag[0];
  };

  const isLiteral = (value: tr.NodePath<any>): boolean => {
    return (
      value.node === undefined ||
      value.node === null ||
      (value.isLiteral() &&
        (!value.isTemplateLiteral() || value.node.expressions.length <= 0))
    );
  };

  const fieldType = (name: string) => {
    if (/^watch_/.test(name)) {
      return ASYNC_ITERATOR_TYPE;
    } else if (/^\$\$/.test(name)) {
      return EVENT_TYPE;
    } else if (/^\$/.test(name)) {
      return PROPERTY_TYPE;
    } else {
      return ATTRIBUTE_TYPE;
    }
  };

  const isRootJSXNode = (path: tr.NodePath) => {
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

  const cleanFieldName = (name: string) => name.replace(/^\$?\$?/, '');

  const valueExpressionFromJsxAttributeValue = (
    valuePath: tr.NodePath<t.JSXAttribute['value']>,
  ): tr.NodePath<
    | t.JSXAttribute['value']
    | Exclude<t.JSXExpressionContainer['expression'], t.JSXExpressionContainer>
  > => {
    let current: tr.NodePath<
      t.JSXAttribute['value'] | t.JSXExpressionContainer['expression']
    > = valuePath;
    while (current.isJSXExpressionContainer()) {
      current = valuePath.get('expression');
    }
    return current as any;
  };

  const domNodesFromJSXChildren = (
    jsxChildrenPaths: tr.NodePath<JSXChildrenNode>[],
    scope: tr.Scope,
    outerPath: tr.NodePath,
  ) => {
    const children: Node[] = [];
    let previousNode: Node | null = null;
    for (const childPath of jsxChildrenPaths) {
      for (const node of yieldDomNodeFromNodeSimplified(
        childPath,
        previousNode !== null && isDynamicDomlessNode(previousNode),
        scope,
        outerPath,
      )) {
        previousNode = node;
        children.push(node);
      }
    }
    return children;
  };

  const hasDynamicNodes = (children: Node[]) => {
    return children.some(
      (childNode) =>
        childNode.type === DYNAMIC_TYPE ||
        (childNode.type === ELEMENT_TYPE && childNode.id) ||
        SUBCOMPONENT_TYPE,
    );
  };

  // TODO: Need a better name for this function
  const fieldFromNodes = (nodePathName: string, outerPath, valuePath) => {
    const type = fieldType(nodePathName);
    switch (type) {
      case ASYNC_ITERATOR_TYPE:
        return {
          type,
          innerField: fieldFromNodes(
            nodePathName.replace(/^watch_/, ''),
            outerPath,
            valuePath,
          ),
        };
      case PROPERTY_TYPE: {
        const key = cleanFieldName(nodePathName);
        const setterId = (() => {
          if (setterMap.has(key)) {
            return setterMap.get(key)!;
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
          expression: valueExpressionFromJsxAttributeValue(valuePath),
          key,
        };
      }
      default:
        return {
          type,
          key: cleanFieldName(nodePathName),
          expression: valueExpressionFromJsxAttributeValue(valuePath),
        } as ElementField;
    }
  };

  const domNodeFromJSXElement = (
    path: tr.NodePath<JSXElement>,
    previousIsDynamic: boolean,
    scope: tr.Scope,
    outerPath: tr.NodePath,
  ): SubcomponentNode | ElementNode => {
    const jsxOpeningElementPath = path.get('openingElement');
    const jsxAttributePathsOrPath = jsxOpeningElementPath.get('attributes');
    const jsxAttributePaths = Array.isArray(jsxAttributePathsOrPath)
      ? jsxAttributePathsOrPath
      : [jsxAttributePathsOrPath];
    const jsxOpeningElementNamePath = jsxOpeningElementPath.get('name');
    if (
      jsxOpeningElementNamePath.isJSXIdentifier() &&
      isElementTag(jsxOpeningElementNamePath.node.name)
    ) {
      const tag = jsxOpeningElementNamePath.node.name;
      const potentialId = scope.generateUidIdentifier(`${tag}$`);
      const fields: ElementField[] = jsxAttributePaths.map(
        (jsxAttributePath): ElementField => {
          if (jsxAttributePath.isJSXSpreadAttribute()) {
            const argumentPath = jsxAttributePath.get('argument');
            const spreadExpressionPath =
              valueExpressionFromJsxAttributeValue(argumentPath);
            return {
              type: SPREAD_TYPE,
              expression: spreadExpressionPath,
            };
          } else if (jsxAttributePath.isJSXAttribute()) {
            const namePath = jsxAttributePath.get('name');
            const valuePath = jsxAttributePath.get('value');
            if (namePath.isJSXNamespacedName()) {
              throw new Error('Not supported');
            } else if (namePath.isJSXIdentifier()) {
              return fieldFromNodes(namePath.node.name, outerPath, valuePath);
            }
          }
          throw new Error('Not supported');
        },
      );
      const children = domNodesFromJSXChildren(path.get('children'), scope, outerPath);
      const childrenAreDynamic = hasDynamicNodes(children);
      const nonStaticAttributeFields = fields.filter(
        (field) => !(field.type === ATTRIBUTE_TYPE && isLiteral(field.expression)),
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
      const fields: SubcomponentField[] = jsxAttributePaths.map(
        (jsxAttributePath): SubcomponentField => {
          if (jsxAttributePath.isJSXSpreadAttribute()) {
            const result: SpreadField = {
              type: SPREAD_TYPE,
              expression: jsxAttributePath.get('argument'), // TODO: Check this is right
            };
            return result;
          } else if (jsxAttributePath.isJSXAttribute()) {
            const namePath = jsxAttributePath.get('name');
            if (namePath.isJSXNamespacedName()) {
              throw new Error('JSX namespaces not supported');
            } else if (namePath.isJSXIdentifier()) {
              const result: SubcomponentPropertyField = {
                type: SUBCOMPONENT_PROPERTY_TYPE,
                key: namePath.node.name,
                expression: valueExpressionFromJsxAttributeValue(
                  jsxAttributePath.get('value'),
                ),
              };
              return result;
            }
          }
          throw new Error(`Not supported: ${jsxAttributePath.node.type}`);
        },
      );
      const children = domNodesFromJSXChildren(path.get('children'), scope, outerPath);

      const resultNode: SubcomponentNode = {
        type: SUBCOMPONENT_TYPE,
        nameExpression: jsxOpeningElementPath.get('name'),
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
    scope: tr.Scope,
  ): TextNode | null => {
    const html = aString.replace(/^\s*\n\s*|\s*\n\s*$/g, '');
    if (html === '') {
      return null;
    }
    return {
      type: TEXT_TYPE,
      text: html,
      // TODO: We could probably do id assignment post DOM node tree collection
      id: previousIsDynamic ? scope.generateUidIdentifier('text') : null,
    };
  };

  const isDynamicDomlessNode = (node: Node) => {
    return node.type === DYNAMIC_TYPE || node.type === SUBCOMPONENT_TYPE;
  };

  function* yieldDomNodeFromJSXFragment(
    path: tr.NodePath<t.JSXFragment>,
    previousIsDynamic: boolean,
    scope,
    outerPath,
  ) {
    for (const childPath of path.get('children')) {
      for (const node of yieldDomNodeFromNodeSimplified(
        childPath,
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
    path: tr.NodePath<JSXExpressionContainer>,
    previousIsDynamic: boolean,
    scope,
    outerPath,
  ): IterableIterator<Node> {
    const expressionPath = path.get('expression');
    if (expressionPath.isJSXEmptyExpression()) {
      return;
    }
    // TODO: Function and array literals
    if (expressionPath.isJSXElement() || expressionPath.isJSXFragment()) {
      yield* yieldDomNodeFromNodeSimplified(
        expressionPath,
        previousIsDynamic,
        scope,
        outerPath,
      );
    } else if (expressionPath.isStringLiteral()) {
      // TODO: Two contained literals next to each other would lead to incorrect state length
      const textNode = domNodeFromString(
        expressionPath.node.value,
        previousIsDynamic,
        scope,
      );
      if (textNode) {
        yield textNode;
      }
    } else if (expressionPath.isNumericLiteral() || expressionPath.isBooleanLiteral()) {
      const textNode = domNodeFromString(
        expressionPath.node.value.toString(),
        previousIsDynamic,
        scope,
      );
      if (textNode) {
        yield textNode;
      }
    } else {
      yield {
        type: DYNAMIC_TYPE,
        expression: expressionPath,
      };
    }
  }

  function* yieldDomNodeFromNodeNonSimplified(
    path: tr.NodePath<JSXElement['children'][0]>,
    previousIsDynamic,
    scope,
    outerPath,
  ): IterableIterator<Node> {
    if (path.isJSXElement()) {
      yield domNodeFromJSXElement(path, previousIsDynamic, scope, outerPath);
    } else if (path.isJSXExpressionContainer()) {
      yield* yieldDomNodeFromJSXExpressionContainerNode(
        path,
        previousIsDynamic,
        scope,
        outerPath,
      );
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

  function* yieldDomNodeFromNodeSimplified(
    path: tr.NodePath<JSXChildrenNode>,
    previousIsDynamic: boolean,
    scope,
    outerPath,
  ): IterableIterator<Node> {
    const domNodeIterator = yieldDomNodeFromNodeNonSimplified(
      path,
      previousIsDynamic,
      scope,
      outerPath,
    );
    const firstIteration = domNodeIterator.next();
    if (firstIteration.done) {
      return;
    }
    let previous: Node = firstIteration.value;
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

  const htmlFromNode = (node: Node): string => {
    switch (node.type) {
      case ELEMENT_TYPE: {
        const tag: string = node.tag;
        const attributeString: string = (
          node.fields.filter(
            (field) => field.type === ATTRIBUTE_TYPE && isLiteral(field.expression),
          ) as AttributeField[]
        )
          .map((field) => attributeLiteralToHTMLAttributeString(field))
          .join(' ');
        const childrenString: string = node.children
          .map((field) => {
            return htmlFromNode(field);
          })
          .join('');
        return `<${tag}${
          attributeString !== '' ? ` ${attributeString}` : ''
        }>${childrenString}</${tag}>`;
      }
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
    scope: tr.Scope,
  ) {
    const childrenWithDomNodesAssociatedWithThem: (ElementNode | TextNode)[] =
      nodes.filter(
        (child) => child.type === ELEMENT_TYPE || child.type === TEXT_TYPE,
      ) as (ElementNode | TextNode)[];
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
          yield constDeclaration(
            firstNode.id,
            t.memberExpression(rootId, t.identifier('firstChild')),
          );
        }
        if (firstNode.type === ELEMENT_TYPE) {
          yield* yieldDeclarationStatementsFromRootNodes(
            firstNode.children,
            firstNode.id,
            false,
            scope,
          );
        }
      }
      for (let c = 1; c < childrenWithDomNodesAssociatedWithThem.length - 1; c++) {
        const childNode = childrenWithDomNodesAssociatedWithThem[c];
        if (childNode.id) {
          const previousNode = childrenWithDomNodesAssociatedWithThem[c - 1];
          if (previousNode.type === TEXT_TYPE && childNode.type === TEXT_TYPE) {
            yield t.expressionStatement(
              t.callExpression(
                t.memberExpression(previousNode.id!, t.identifier('splitText')),
                [t.numericLiteral(previousNode.text.length)],
              ),
            );
          }
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
          if (childNode.type === ELEMENT_TYPE) {
            yield* yieldDeclarationStatementsFromRootNodes(
              childNode.children,
              childNode.id,
              false,
              scope,
            );
          }
        }
      }
      // TODO: Could do previousSibling if the last node uses lastChild
      if (childrenWithDomNodesAssociatedWithThem.length >= 2) {
        const lastNode =
          childrenWithDomNodesAssociatedWithThem[
            childrenWithDomNodesAssociatedWithThem.length - 1
          ];
        if (lastNode.id) {
          const previousNode =
            childrenWithDomNodesAssociatedWithThem[
              childrenWithDomNodesAssociatedWithThem.length - 2
            ];
          if (previousNode.type === TEXT_TYPE && lastNode.type === TEXT_TYPE) {
            const previousId =
              childrenWithDomNodesAssociatedWithThem.length === 2
                ? t.identifier('firstChild')
                : previousNode.id!;
            yield t.expressionStatement(
              t.callExpression(
                t.memberExpression(previousId, t.identifier('splitText')),
                [t.numericLiteral(previousNode.text.length)],
              ),
            );
          }
          yield constDeclaration(
            lastNode.id,
            t.memberExpression(rootId, t.identifier('lastChild')),
          );
          if (lastNode.type === ELEMENT_TYPE) {
            yield* yieldDeclarationStatementsFromRootNodes(
              lastNode.children,
              lastNode.id,
              false,
              scope,
            );
          }
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
      return cinderCallExpression('children', [rootId, beforeId]);
    } else if (previousConsecutiveDynamicNodeCount >= 2) {
      return cinderCallExpression('dynamicSection', [
        rootId,
        beforeId,
        t.numericLiteral(previousConsecutiveDynamicNodeCount),
      ]);
    }
    return null;
  };

  const fieldExpressionFromFieldData = (nodeId, field: ElementField) => {
    switch (field.type) {
      case EVENT_TYPE:
      case ATTRIBUTE_TYPE:
        if (!isLiteral(field.expression)) {
          if (nodeId === null) {
            throw new Error('Null attribute id not supported');
          }

          return cinderCallExpression(field.type, [nodeId, t.stringLiteral(field.key)]);
        }
        return null;
      case ASYNC_ITERATOR_TYPE:
        return cinderCallExpression(field.type, [
          fieldExpressionFromFieldData(nodeId, field.innerField),
        ]);
      case PROPERTY_TYPE:
        return cinderCallExpression(field.type, [nodeId, field.setterId]);
      case SPREAD_TYPE:
        return cinderCallExpression(field.type, [nodeId]);
      default:
        throw new Error(`Field not supported: ${field}`);
    }
  };

  function* yieldFieldExpressionsFromNodes(nodes: Node[], rootId: t.Identifier) {
    let previousConsecutiveDynamicNodeCount = 0;
    for (const node of nodes) {
      switch (node.type) {
        case TEXT_TYPE:
        case ELEMENT_TYPE: {
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
              const expression = fieldExpressionFromFieldData(node.id, field);
              if (expression === null) {
                continue;
              }

              yield expression;
            }
            if (node.id !== null) {
              yield* yieldFieldExpressionsFromNodes(node.children, node.id);
            }
          }
          break;
        }
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

  const fieldValueFromElementFieldData = (field: ElementField) => {
    switch (field.type) {
      case ATTRIBUTE_TYPE:
        if (!isLiteral(field.expression)) {
          return field.expression.node;
        }
        break;
      case ASYNC_ITERATOR_TYPE:
        return fieldValueFromElementFieldData(field.innerField);
      default:
        return field.expression.node;
    }

    return null;
  };

  function* yieldFieldValuesFromNode(node: Node): Generator<t.Node | null> {
    switch (node.type) {
      case ELEMENT_TYPE: {
        for (const field of node.fields) {
          const value = fieldValueFromElementFieldData(field);
          if (value === null) {
            continue;
          }
          yield value;
        }
        for (const childNode of node.children) {
          yield* yieldFieldValuesFromNode(childNode);
        }
        break;
      }
      case DYNAMIC_TYPE: {
        yield node.expression.node;
        break;
      }
      case SUBCOMPONENT_TYPE: {
        const objectProperties: any[] = [];
        for (const field of node.fields) {
          switch (field.type) {
            case SPREAD_TYPE:
              objectProperties.push(t.spreadElement(field.expression.node));
              break;
            case SUBCOMPONENT_PROPERTY_TYPE:
              objectProperties.push(
                t.objectProperty(
                  t.identifier(field.key),
                  field.expression.node === null
                    ? t.booleanLiteral(true)
                    : field.expression.node,
                ),
              );
              break;
          }
        }
        if (node.childrenTemplateId) {
          const fieldValues: Parameters<typeof t.callExpression>[1] = [];
          for (const childNode of node.children) {
            fieldValues.push(...yieldFieldValuesFromNode(childNode));
          }
          const domChildren = node.children.filter(nodeHasDom);
          if (domChildren.length > 0) {
            objectProperties.push(
              t.objectProperty(
                t.identifier('children'),
                cinderCallExpression('componentResult', [
                  node.childrenTemplateId,
                  t.arrayExpression([...fieldValues]),
                ]),
              ),
            );
          } else if (fieldValues.length > 0) {
            objectProperties.push(
              t.objectProperty(
                t.identifier('children'),
                fieldValues.length === 1
                  ? fieldValues[0]
                  : t.arrayExpression([...fieldValues]),
              ),
            );
          }
        }
        // TODO: This whole block of code assumes that it's a SFC and not a string (representing an HTML element)
        yield cinderCallExpression('validateComponent', [
          jsxIdentifierOrNamespaceToNonJsxSyntax(node.nameExpression),
          t.objectExpression(objectProperties),
        ]);
      }
    }
  }

  const nodeHasDom = (node: Node) =>
    node.type === ELEMENT_TYPE || node.type === TEXT_TYPE;

  function* yieldTemplateInfoFromRootNodes(nodes: Node[], templateId, scope) {
    const nodeStack: Node[] = [...nodes];
    while (nodeStack.length > 0) {
      const node = nodeStack.pop()!;
      switch (node.type) {
        case SUBCOMPONENT_TYPE:
          if (node.childrenTemplateId !== null) {
            yield* yieldTemplateInfoFromRootNodes(
              node.children,
              node.childrenTemplateId,
              scope,
            );
          } else {
            nodeStack.push(...[...node.children].reverse());
          }
          break;
        case ELEMENT_TYPE:
          nodeStack.push(...[...node.children].reverse());
          break;
      }
    }

    const nodesWithDom: (ElementNode | TextNode)[] = nodes.filter(nodeHasDom) as (
      | ElementNode
      | TextNode
    )[];
    const isDynamicChildren = hasDynamicNodes(nodes);
    const args: Parameters<typeof t.callExpression>[1] = [
      t.stringLiteral(nodes.map((node) => htmlFromNode(node)).join('')),
    ];
    let templateMethod: string;
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
      const statements = [
        ...yieldDeclarationStatementsFromRootNodes(nodes, rootParamId, true, scope),
      ];
      const fieldExpressions = [...yieldFieldExpressionsFromNodes(nodes, rootParamId)];
      statements.push(t.returnStatement(t.arrayExpression(fieldExpressions)));

      const blockStatement = t.blockStatement(statements);
      const arrowFunction = t.arrowFunctionExpression([rootParamId], blockStatement);
      args.push(arrowFunction);
    }
    yield constDeclaration(templateId, cinderCallExpression(templateMethod, args));
  }

  const replacePathWithDomNodeSyntax = (
    nodes: Node[],
    path: tr.NodePath,
    outerPath: tr.NodePath,
  ) => {
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
      path.replaceWith(
        t.expressionStatement(
          componentResultArgs.length === 1
            ? componentResultArgs[0]
            : t.arrayExpression(componentResultArgs),
        ),
      );
    } else {
      const fieldValues: Parameters<typeof t.callExpression>[1] = [];
      for (const node of nodes) {
        const nodeFieldValues = yieldFieldValuesFromNode(node);
        fieldValues.push(...nodeFieldValues);
      }
      path.replaceWith(
        t.expressionStatement(
          cinderCallExpression('componentResult', [
            templateId,
            t.arrayExpression(fieldValues),
          ]),
        ),
      );
    }
  };

  const THROW_IF_NAMESPACE =
    options.throwIfNamespace === undefined ? true : !!options.throwIfNamespace;

  const PRAGMA_DEFAULT = options.pragma || 'cinder.createElement';
  const PRAGMA_FRAG_DEFAULT = options.pragmaFrag || 'cinder.Fragment';

  const JSX_ANNOTATION_REGEX = /\*?\s*@jsx\s+([^\s]+)/;
  const JSX_FRAG_ANNOTATION_REGEX = /\*?\s*@jsxFrag\s+([^\s]+)/;

  // returns a closure that returns an identifier or memberExpression node
  // based on the given id
  const createIdentifierParser = (id: string) => () => {
    const identifiers = id.split('.').map((name) => t.identifier(name));
    let cur: t.Identifier | t.MemberExpression = identifiers[0];
    for (let i = 1; i < identifiers.length; i++) {
      cur = t.memberExpression(cur, identifiers[i]);
    }
    return cur;
  };

  // TODO: Type it properly
  let setterMap: Map<string, any>;
  const visitor = helper({
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

    throwIfNamespace: THROW_IF_NAMESPACE,
  });

  visitor.Program = {
    enter(path, state) {
      setterMap = new Map();
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

  visitor.JSXFragment = function (path: tr.NodePath<t.JSXFragment>) {
    if (isRootJSXNode(path)) {
      const outerPath = path.findParent(
        (parentPath) => parentPath === undefined || parentPath.parentPath.isProgram(),
      );
      const domNodes = [
        ...yieldDomNodeFromJSXFragment(path, false, path.scope, outerPath),
      ];
      replacePathWithDomNodeSyntax(domNodes, path, outerPath);
    }
  };

  visitor.JSXElement = {
    exit(path) {
      if (isRootJSXNode(path)) {
        const outerPath = path.findParent(
          (parentPath) => parentPath === undefined || parentPath.parentPath.isProgram(),
        );
        const domNode = domNodeFromJSXElement(path, false, path.scope, outerPath);
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
