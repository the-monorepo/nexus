import {
  compareMutationEvaluations,
  compareNodeEvaluations,
  compareInstruction,
  MutationEvaluation,
  NodeEvaluation,
  createNodeEvaluation,
  Instruction,
  getAstPath,
  DependencyInfo,
  initialiseEvaluationMaps,
  pathToPrimaryKey
} from '../src/index';
import { parse } from '@babel/parser';
import Heap from '@pshaw/binary-heap';
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

const arrayToNodeEvaluations = (arr: any[]): NodeEvaluation => {
  const nodeEvaluation = createNodeEvaluation(0);
  nodeEvaluation.mutationEvaluations.push(arrayToMutationEvaluation(arr));
  return nodeEvaluation;
}

// Index representations:
// F  P  SD, SI E
const orderedEvaluations = [
  [1, 0, 0, 0, 0],
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
describe('sorting', () => {
  describe(compareMutationEvaluations.name, () => {
    for (let i = 0; i < orderedEvaluations.length - 1; i++) {
      const lesser = arrayToMutationEvaluation(orderedEvaluations[i]);
      const lesserNodeEvaluation = arrayToNodeEvaluations(orderedEvaluations[i]);
      it(`${arrToString(orderedEvaluations[i])} same as ${arrToString(
        orderedEvaluations[i],
      )}`, () => {
        expect(compareMutationEvaluations(lesser, lesser)).toBe(0);
        // TODO: Should have it's own test
        expect(compareNodeEvaluations(lesserNodeEvaluation, lesserNodeEvaluation)).toBe(0);
      });
      for (let j = i + 1; j < orderedEvaluations.length; j++) {
        const greater = arrayToMutationEvaluation(orderedEvaluations[j]);
        const greaterNodeEvaluation = arrayToNodeEvaluations(orderedEvaluations[j]);
        it(`${arrToString(orderedEvaluations[i])} less than ${arrToString(
          orderedEvaluations[j],
        )}`, () => {
          expect(compareMutationEvaluations(lesser, greater)).toBeLessThan(0);
          expect(compareNodeEvaluations(lesserNodeEvaluation, greaterNodeEvaluation)).toBeLessThan(0);
        });
        it(`${arrToString(orderedEvaluations[j])} greater than ${arrToString(
          orderedEvaluations[i],
        )}`, () => {
          expect(compareMutationEvaluations(greater, lesser)).toBeGreaterThan(0);
          expect(compareNodeEvaluations(greaterNodeEvaluation, lesserNodeEvaluation)).toBeGreaterThan(0);
        });
      }
    }
  });

  it(compareInstruction.name, () => {
    const nodeEvaluations: Map<string, NodeEvaluation> = new Map();
    const instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>> = new Map();

    const compareFn = (a, b) => compareInstruction(nodeEvaluations, instructionEvaluations, a, b);
    
    const filePath = '';
    const code = 'console.log("test");';
    const ast = parse(code, { plugins: ['typescript'] });
    const astPath = getAstPath(ast);
    const path1 = astPath;
    const path2 = astPath.get('body')[0];
    const dependencies1: DependencyInfo = {
      reads: [],
      writes: [path1]
    };
    const dependencies2: DependencyInfo = {
      reads: [],
      writes: [path2]
    };
    
    const dependenciesMap1 = new Map([[filePath, dependencies1]]);
    const dependenciesMap2 = new Map([[filePath, dependencies2]]);

    const instruction1 = new Instruction(Symbol('1'), dependenciesMap1, [], []);
    const instruction2 = new Instruction(Symbol('2'), dependenciesMap1, [], []);
    const instruction3 = new Instruction(Symbol('3'), dependenciesMap1, [], []);

    const instruction4 = new Instruction(Symbol('4'), dependenciesMap2, [], []);

    initialiseEvaluationMaps(nodeEvaluations, instructionEvaluations, new Map(), [instruction1, instruction2, instruction3, instruction4]);

    const mE1 = arrayToMutationEvaluation([1, 0, 0, 0, 0]);
    const mE3 = arrayToMutationEvaluation([0, 0, 0, 0, 1]);

    instructionEvaluations.get(instruction1)!.push(mE1);
    instructionEvaluations.get(instruction3)!.push(mE3);
    instructionEvaluations.get(instruction4)!.push(mE1);

    nodeEvaluations.get(pathToPrimaryKey(filePath, path2))!.mutationEvaluations.push(mE3);

    expect(compareFn(instruction2, instruction1)).toBe(1);
    expect(compareFn(instruction2, instruction2)).toBe(0);
    expect(compareFn(instruction2, instruction3)).toBe(-1);

    expect(compareFn(instruction1, instruction4)).toBe(-1);
    expect(compareFn(instruction2, instruction4)).toBe(1);
  });
});
