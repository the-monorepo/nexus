import { ochiai } from '../src/index';
describe('ochiai', () => {
  it('0 faults', () => {
    expect(ochiai({ passed: 0, failed: 0 }, { passed: 10, failed: 111 })).to.be.null;
  });
})
