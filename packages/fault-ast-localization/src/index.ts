import { AssertionFailureData } from '@fault/messages';
import babelParser from '@babel/parser';
import { readFile } from 'mz/fs';
import {
  Statement,
  BlockStatement,
  EmptyStatement,
  VariableDeclaration,
  VariableDeclarator,
  isIdentifier,
  Declarator,
} from '@babel/types';

const localizeDeclarator = async (
  declarator: Declarator,
  dependencies: Map<string, Set<string>>,
  assertion: AssertionFailureData,
) => {
  declarator.expression;
};

const localizeVariableDeclarator = async (
  variableDeclarator: VariableDeclarator,
  dependencies: Map<string, Set<string>>,
  assertion: AssertionFailureData,
) => {
  const id = variableDeclarator.id;
  if (isIdentifier(id)) {
    dependencies.set(id.name, new Set());
    if (id.decorators !== null) {
      for (const declarator of id.decorators) {
        await localizeVariableDeclarator(declarator, dependencies, assertion);
      }
    }
  }
};

const localizeVariableDeclaration = async (
  variableDeclaration: VariableDeclaration,
  dependencies: Map<string, Set<string>>,
  assertion: AssertionFailureData,
) => {
  for (const declarator of variableDeclaration.declarations) {
    await localizeVariableDeclarator(declarator);
  }
};

const localizeBlockStatement = async (
  blockStatement: BlockStatement,
  assertion: AssertionFailureData,
) => {
  for (const statement of blockStatement.body) {
    await localizeStatement(statement, assertion);
  }
};

const localizeEmptyStatement = async (
  statement: EmptyStatement,
  assertion: AssertionFailureData,
) => {};

const localizeStatement = async (
  statement: Statement,
  dependencies: Map<string, string[]>,
  assertion: AssertionFailureData,
) => {};

const localizeStatements = async (
  statements: Statement[],
  dependencies: Map<string, Set<string>>,
  assertion: AssertionFailureData,
) => {
  const reversedStatements = statements.slice().reverse();
  for (const statement of reversedStatements) {
    await localizeStatement(statement, dependencies, assertion);
  }
};

export const localize = async (
  rootFile: string,
  assertions: AssertionFailureData[], // Assertions for the file
) => {
  const fileAsts: Map<string, any> = new Map();
  const code: string = await readFile(rootFile, 'utf8');
  const ast = babelParser.parse(code, { sourceType: 'unambiguous' });
  fileAsts.set(rootFile, ast.program.body);
  const faults = localizeTree(ast);
  console.log(faults);
};
