import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';

import { Instruction, initialiseEvaluationMaps, pathToPrimaryKey } from '../src/index.ts';
const code = 'let a = 0; 1 + 2; () => {}';
const ast = parse(code);
const filePath = 'test';

const createInstruction = (): Instruction<any> =>
  new Instruction(
    Symbol(),
    new Map([
      [
        filePath,
        {
          reads: [],
          writes: [],
        },
      ],
    ]),
    [],
    undefined,
  );

it('initialiseEvaluationMaps', () => {
  it('empty instruction', () => {
    const nodeEvaluations = new Map();
    const instructionEvaluations = new Map();
    const nodeToInstructions = new Map();
    // Note: This technically should never happen cause instructions always modify some part of the tree
    const instruction = createInstruction([]);
    const instructions = [instruction];
    initialiseEvaluationMaps(
      nodeEvaluations,
      instructionEvaluations,
      nodeToInstructions,
      instructions,
    );
    expect(instructionEvaluations.get(instruction)).toBeDefined();
    expect(nodeEvaluations.size).toBe(0);
    expect(nodeToInstructions.size).toBe(0);
  });
  it('instruction with dependencies', () => {
    const nodeEvaluations = new Map();
    const instructionEvaluations = new Map();
    const nodeToInstructions = new Map();
    const allPaths: NodePath[] = [];
    traverse(ast, {
      enter: (path) => allPaths.push(path),
    });
    const instruction = createInstruction(allPaths);
    const instructions = [instruction];
    initialiseEvaluationMaps(
      nodeEvaluations,
      instructionEvaluations,
      nodeToInstructions,
      instructions,
    );
    for (const path of allPaths) {
      expect(nodeEvaluations.get(pathToPrimaryKey(filePath, path))).toBeDefined();
      expect(nodeToInstructions.get(pathToPrimaryKey(filePath, path))).toEqual([
        path.node,
      ]);
    }
    expect(instructionEvaluations.get(instruction)).toBeDefined();
  });
});
