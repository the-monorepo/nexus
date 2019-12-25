import { barinel } from '../src/index';

describe('barinel', () => {
  it('0 fails', () => {
    expect(barinel({ passed: 0, failed: 0 })).toBeNull();
  });
});
