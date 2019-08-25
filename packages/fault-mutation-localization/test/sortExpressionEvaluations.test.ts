import { sortExpressionEvaluations, EvaluationResult } from '../src/index';
describe(sortExpressionEvaluations.name, () =>{
  it('1', () => {
    const e1: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: null,
      stackColumnScore: null,
      errorChanged: false,
    }

    const e2: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: null,
      stackColumnScore: null,
      errorChanged: true,
    }

    const e3: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 0,
      stackColumnScore: null,
      errorChanged: false,
    }

    const e4: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 0,
      stackColumnScore: null,
      errorChanged: true,
    }


    const e5: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 0,
      stackColumnScore: 0,
      errorChanged: false,
    }

    const e6: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 0,
      stackColumnScore: 0,
      errorChanged: true,
    }


    const e7: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 0,
      stackColumnScore: 1,
      errorChanged: false,
    }

    const e8: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 0,
      stackColumnScore: 1,
      errorChanged: true,
    }

    const e9: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 1,
      stackColumnScore: null,
      errorChanged: false,
    }

    const e10: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 1,
      stackColumnScore: null,
      errorChanged: true,
    }


    const e11: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 1,
      stackColumnScore: 0,
      errorChanged: false,
    }

    const e12: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 1,
      stackColumnScore: 0,
      errorChanged: true,
    }


    const e13: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 1,
      stackColumnScore: 1,
      errorChanged: false,
    }

    const e14: EvaluationResult = {
      endResultImprovement: 0,
      stackLineScore: 1,
      stackColumnScore: 1,
      errorChanged: true,
    }

    const e15: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: null,
      stackColumnScore: null,
      errorChanged: false,
    }

    const e16: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: null,
      stackColumnScore: null,
      errorChanged: true,
    }



    const e17: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 0,
      stackColumnScore: null,
      errorChanged: false,
    }

    const e18: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 0,
      stackColumnScore: null,
      errorChanged: true,
    }


    const e19: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 0,
      stackColumnScore: 0,
      errorChanged: false,
    }

    const e20: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 0,
      stackColumnScore: 0,
      errorChanged: true,
    }


    const e21: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 0,
      stackColumnScore: 1,
      errorChanged: false,
    }

    const e22: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 0,
      stackColumnScore: 1,
      errorChanged: true,
    }




    const e23: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 1,
      stackColumnScore: null,
      errorChanged: false,
    }

    const e24: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 1,
      stackColumnScore: null,
      errorChanged: true,
    }


    const e25: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 1,
      stackColumnScore: 0,
      errorChanged: false,
    }

    const e26: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 1,
      stackColumnScore: 0,
      errorChanged: true,
    }


    const e27: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 1,
      stackColumnScore: 1,
      errorChanged: false,
    }

    const e28: EvaluationResult = {
      endResultImprovement: 1,
      stackLineScore: 1,
      stackColumnScore: 1,
      errorChanged: true,
    }

    const unsorted = [e5,e4,e3,e2,e1,e6,e7,e8,e10,e9,e11,e15,e14,e13,e12,e20,e19,e18,e17,e16,e28,e27,e26,e25,e22,e21,e24,e23];
    const sorted = [e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12,e13,e14,e15,e16,e17,e18,e19,e20,e21,e22,e23,e24,e25,e26,e27,e28];
    sortExpressionEvaluations(unsorted);
    expect(unsorted).to.deep.equal(sorted);
  })
});