import { iteratorWithNoDuplicates } from '../src/index';
describe('iteratorWithNoDuplicates', () => {
  const arrWithDuplicates = [1,2,3,4,4,3,2,1];
  expect([...iteratorWithNoDuplicates(arrWithDuplicates)]).to.deep.equal([1,2,3,4]);
});