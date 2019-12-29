import {
  compareMutationEvaluations,
  compareNodeEvaluations,
  MutationEvaluation,
  mutationEvalatuationMapToFaults,
  NodeEvaluation,
  createNodeEvaluation

} from '../src/index';
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
// F  P  LD LI CD CI E
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
describe(compareMutationEvaluations.name, () => {
  for (let i = 0; i < orderedEvaluations.length - 1; i++) {
    const lesser = arrayToMutationEvaluation(orderedEvaluations[i]);
    const lesserNodeEvaluation = arrayToNodeEvaluations(orderedEvaluations[i]);
    it(`${arrToString(orderedEvaluations[i])} same as ${arrToString(
      orderedEvaluations[i],
    )}`, () => {
      expect(compareMutationEvaluations(lesser, lesser)).toBe(0);
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
