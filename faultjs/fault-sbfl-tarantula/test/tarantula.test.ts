import { tarantula } from '../src/index';
describe('tarantula', () => {
  it('0 faults', () => {
    expect(tarantula({ passed: 0, failed: 0 }, { passed: 10, failed: 111 })).to.equal(0);
  });
});
