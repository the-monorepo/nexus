import {
  compareMutationEvaluations,
  MutationEvaluation,
  mutationEvalatuationMapToFaults,
} from '../src/index';
const arrToString = (arr: number[]) => `[${arr.join(', ')}]`;

const arrayToMutationEvaluation = (arr: any[]): MutationEvaluation => {
  return {
    instructions: [],
    testsWorsened: arr[0],
    testsImproved: arr[1],
    stackEvaluation: {
      lineDegradationScore: arr[2],
      lineImprovementScore: arr[3],
      lineScoreNulls: 0,
      columnDegradationScore: arr[4],
      columnImprovementScore: arr[5],
      columnScoreNulls: 0,
    },
    errorsChanged: arr[6],
    crashed: false,
  };
};

describe(compareMutationEvaluations.name, () => {
  // Index representations:
  // F  P  LD LI CD CI E
  const orderedEvaluations = [
    [1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 0, 0],
    [1, 1, 0, 1, 0, 0, 0],
    [1, 1, 2, 2, 0, 0, 0],
    [9, 9, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0],
  ];
  for (let i = 0; i < orderedEvaluations.length - 1; i++) {
    const lesser = arrayToMutationEvaluation(orderedEvaluations[i]);
    it(`${arrToString(orderedEvaluations[i])} same as ${arrToString(
      orderedEvaluations[i],
    )}`, () => {
      expect(compareMutationEvaluations(lesser, lesser)).to.be.equal(0);
    });
    for (let j = i + 1; j < orderedEvaluations.length; j++) {
      const greater = arrayToMutationEvaluation(orderedEvaluations[j]);
      it(`${arrToString(orderedEvaluations[i])} less than ${arrToString(
        orderedEvaluations[j],
      )}`, () => {
        expect(compareMutationEvaluations(lesser, greater)).to.be.below(0);
      });
      it(`${arrToString(orderedEvaluations[j])} greater than ${arrToString(
        orderedEvaluations[i],
      )}`, () => {
        expect(compareMutationEvaluations(greater, lesser)).to.be.above(0);
      });
    }
  }
  it('array stays the same when sorted', () => {
    const sorted = [...orderedEvaluations].map(arrayToMutationEvaluation);
    const copy = [...sorted];
    copy.sort(compareMutationEvaluations);
    expect(copy).to.deep.equal(sorted);

    copy.reverse();
    copy.sort(compareMutationEvaluations);
    expect(copy).to.deep.equal(sorted);
  });
});
