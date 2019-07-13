import { parse } from '@babel/parser';
import { File, AssignmentExpression, Statement } from '@babel/types';
import { AssertionFailureData } from '@fault/messages';
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

export const mutateFile = async function *(filePath: string, astCache: AstCache) {
  const ast = await astCache.get(filePath);
  ast.program.body;
}

export const mutateStatements = async function *(statement: Statement, astCache: AstCache) {

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