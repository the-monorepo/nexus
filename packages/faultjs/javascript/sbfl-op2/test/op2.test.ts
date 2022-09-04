import op2 from '../src/index.ts';

describe('op2', () => {
  it('0 fails', () => {
    expect(op2({ passed: 0, failed: 0 }, { passed: 10, failed: 10 })).toBe(0);
  });
});
