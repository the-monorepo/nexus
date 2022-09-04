import barinel from '../src/index.ts';

describe('barinel', () => {
  it('0 fails', () => {
    expect(barinel({ passed: 0, failed: 0 })).toBeNull();
  });
});
