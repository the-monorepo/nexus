import { dStar } from '../src/index';

describe('dstar', () => {
  it('0 fails', () => {
    expect(dStar({ passed: 0, failed: 0 }, { passed: 10, failed: 10})).to.be.null;
  })
})