import { parse } from '@babel/parser';
import * as t from '@babel/types';

import {
  deleteStatementSequence,
  getAstPath,
  executeInstructions,
  getTraverseKeys,
  mutationWrapperToInstruction,
} from '../src/index.ts';
describe('sequences', () => {
  it('delete statement', () => {
    const filePath = '';

    const ast = parse('const fn = () => { const a = 0; const b = 0; };');
    const astPath = getAstPath(ast);

    const astMap = new Map([[filePath, ast]]);

    const blockPath = astPath
      .get('body')[0]
      .get('declarations')[0]
      .get('init')
      .get('body');
    expect(blockPath.isBlockStatement()).toBe(true);
    const blockNode: t.BlockStatement = blockPath.node;

    const sequence = deleteStatementSequence({ index: 0 });

    const instruction = mutationWrapperToInstruction(
      Symbol('delete-statement'),
      filePath,
      sequence,
      blockPath,
      getTraverseKeys(blockPath),
      undefined,
    );

    executeInstructions(astMap, [instruction]);
    expect(blockNode.body.length).toBe(1);
    const variableDecalaration = blockNode.body[0] as t.VariableDeclaration;
    const identifier = variableDecalaration.declarations[0].id as t.Identifier;
    expect(identifier.name).toBe('b');
  });
});
