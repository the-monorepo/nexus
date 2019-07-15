import { parse } from '@babel/parser';
import { File, AssignmentExpression, Expression, Statement } from '@babel/types';
import * as t from '@babel/types';
import { AssertionFailureData } from '@fault/types';
import { readFile } from 'mz/fs';

export type LocalizeFaultInput = {
  rootFile: string,
  assertions: AssertionFailureData
}

export const createAstCache = () => {
  const cache = new Map<string, File>();  
  return {
    get: async (filePath: string, force: boolean = true): Promise<File> => {
      if (!force && cache.has(filePath)) {
        return cache.get(filePath)!;
      }

      const code = await readFile(filePath, 'utf8');
      const ast = parse(code);
      cache.set(filePath, ast);
      return ast;
    }
  };
};
type AstCache = ReturnType<typeof createAstCache>;

export const localizeFaults = async function *(
  input: LocalizeFaultInput,
  astCache: AstCache
): AsyncIterableIterator<void> {

}

export async function* mutateFile(filePath: string, astCache: AstCache) {
  const ast = await astCache.get(filePath);
}

export async function* mutateStatements(statement: Statement, astCache: AstCache) {
  if (t.isExpressionStatement(statement)) {
    yield *mutateExpressions([statement.expression]);
  }
}

export async function* mutateExpressions(expressions: Expression[]) {
  for(const expression of expressions) {
    if (t.isAssignmentExpression(expression)) {
      yield* mutateAssignmentExpression(expression);
    }  
  }
}

const operations = new Set(['=', '!=', '&=', '^=', '<<=', '>>=', '-=', '+=', '/=', '*=']);
export function *mutateAssignmentExpression(expression: AssignmentExpression) {
  const mutantOperators = new Set(operations);
  mutantOperators.delete(expression.operator);
  for(const operator of operations) {
    expression.operator = operator;
    yield;
  }
}

export const plugin = {

};