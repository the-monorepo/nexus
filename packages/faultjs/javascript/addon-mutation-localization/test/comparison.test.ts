import { parse } from '@babel/parser';

import {
  compareMutationEvaluations,
  compareInstruction,
  MutationEvaluation,
  InstructionEvaluation,
  Instruction,
  getAstPath,
  DependencyInfo,
  initialiseEvaluationMaps,
  pathToPrimaryKey,
  createInstructionQueue,
  createInstructionBlocks,
  NodeInformation,
} from '../src/index.ts';
const arrToString = (arr: number[]) => `[${arr.join(', ')}]`;

const arrayToMutationEvaluation = (arr: any[]): MutationEvaluation => {
  return {
    instructions: [],
    testsWorsened: arr[0],
    testsImproved: arr[1],
    stackEvaluation: {
      nulls: 0,
      degradation: arr[2],
      improvement: arr[3],
    },
    errorsChanged: arr[4],
    crashed: false,
  };
};

// Index representations:
// F  P  SD, SI E
const orderedEvaluations = [
  [0, 0, 0, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 1, 0, 1, 0],
  [1, 1, 2, 2, 0],
  [9, 9, 1, 0, 0],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0],
];
describe.skip('sorting', () => {
  describe(compareMutationEvaluations.name, () => {
    for (let i = 0; i < orderedEvaluations.length - 1; i++) {
      const lesser = arrayToMutationEvaluation(orderedEvaluations[i]);
      it(`${arrToString(orderedEvaluations[i])} same as ${arrToString(
        orderedEvaluations[i],
      )}`, () => {
        expect(compareMutationEvaluations(lesser, lesser)).toBe(0);
      });
      for (let j = i + 1; j < orderedEvaluations.length; j++) {
        const greater = arrayToMutationEvaluation(orderedEvaluations[j]);
        it(`${arrToString(orderedEvaluations[i])} less than ${arrToString(
          orderedEvaluations[j],
        )}`, () => {
          expect(compareMutationEvaluations(lesser, greater)).toBeLessThan(0);
        });
        it(`${arrToString(orderedEvaluations[j])} greater than ${arrToString(
          orderedEvaluations[i],
        )}`, () => {
          expect(compareMutationEvaluations(greater, lesser)).toBeGreaterThan(0);
        });
      }
    }
  });

  it(compareInstruction.name, () => {
    const nodeEvaluations: Map<string, NodeInformation> = new Map();
    const instructionEvaluations: Map<
      Instruction<any>,
      InstructionEvaluation
    > = new Map();

    const compareFn = (a, b) =>
      compareInstruction(nodeEvaluations, instructionEvaluations, a, b);

    const filePath = '';
    const code = 'console.log("test");';
    const ast = parse(code, { plugins: ['typescript'] });
    const astPath = getAstPath(ast);
    const path1 = astPath;
    const path2 = astPath.get('body')[0];
    const dependencies1: DependencyInfo = {
      reads: [],
      writes: [path1],
    };
    const dependencies2: DependencyInfo = {
      reads: [],
      writes: [path2],
    };

    const dependenciesMap1 = new Map([[filePath, dependencies1]]);
    const dependenciesMap2 = new Map([[filePath, dependencies2]]);

    const instruction1 = new Instruction<any>(Symbol('1'), dependenciesMap1, [], []);
    const instruction2 = new Instruction<any>(Symbol('2'), dependenciesMap1, [], []);
    const instruction3 = new Instruction<any>(Symbol('3'), dependenciesMap1, [], []);

    const instruction4 = new Instruction<any>(Symbol('4'), dependenciesMap2, [], []);

    const instructions = [instruction1, instruction2, instruction3, instruction4];

    initialiseEvaluationMaps(
      nodeEvaluations,
      instructionEvaluations,
      new Map([
        [
          filePath,
          new Map([
            [
              'shouldnotmatter',
              {
                instructions: new Set(instructions),
                originalLocation: {
                  filePath,
                  start: {
                    line: 0,
                    column: 0,
                  },
                  end: {
                    line: Number.POSITIVE_INFINITY,
                    column: Number.POSITIVE_INFINITY,
                  },
                },
                path: astPath,
                pathKey: 'alsoshouldnotmatter',
                testStats: {
                  passed: 0,
                  failed: 0,
                },
              },
            ],
          ]),
        ],
      ]),
      instructions,
    );

    const mE1 = arrayToMutationEvaluation([1, 0, 0, 0, 0]);
    const mE3 = arrayToMutationEvaluation([0, 0, 0, 0, 1]);

    instructionEvaluations.get(instruction1)!.mutationEvaluations.push(mE1);
    instructionEvaluations.get(instruction3)!.mutationEvaluations.push(mE3);
    instructionEvaluations.get(instruction4)!.mutationEvaluations.push(mE1);

    nodeEvaluations.get(pathToPrimaryKey(filePath, path2))!.evaluations.push(mE3);

    expect(compareFn(instruction2, instruction1)).toBe(1);
    expect(compareFn(instruction2, instruction2)).toBe(0);
    expect(compareFn(instruction2, instruction3)).toBe(-1);

    expect(compareFn(instruction1, instruction4)).toBe(-1);
    expect(compareFn(instruction2, instruction4)).toBe(1);

    const instructionQueue = createInstructionQueue(
      nodeEvaluations,
      instructionEvaluations,
    );
    instructionQueue.push(
      ...createInstructionBlocks(
        nodeEvaluations,
        instructionEvaluations,
        instructions.map((instruction) => [instruction]),
      ),
    );

    const popped = instructionQueue.pop()!;
    expect(popped.peek().type).toBe(instruction3.type);
    expect(popped.length).toBe(1);
    expect(instructionQueue.pop()!.peek().type).toBe(instruction2.type);
    expect(instructionQueue.pop()!.peek().type).toBe(instruction4.type);
    expect(instructionQueue.pop()!.peek().type).toBe(instruction1.type);
  });
});
