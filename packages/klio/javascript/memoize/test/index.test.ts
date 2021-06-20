import memoize from '../src/index.ts';

describe(memoize.name, () => {
  describe('memoization works properly', () => {
    it('no args', () => {
      const testFn = memoize(() => ({}));

      const testValue = testFn();
      expect(testValue).toBe(testFn());
      expect(testValue).toEqual({});

      expect(testValue).not.toBe(testFn(1));
    });

    it('single arg', () => {
      const testFn = memoize((_) => (new Set()));

      const testValue = testFn();
      expect(testValue).toBe(testFn());
      expect(testValue).not.toBe(testFn('irrelevant'));
    });

    it('multiple args', () => {
      const testFn = memoize((_, __) => ([]));

      const testValue = testFn();
      expect(testValue).toBe(testFn());

      const ref1 = {};
      const ref2 = {};
      expect(testFn(ref1)).toBe(testFn(ref1));
      expect(testFn(ref2)).toBe(testFn(ref2));
      expect(testFn(ref2)).not.toBe(testFn(ref1));

      expect(testFn(ref1, ref2)).toBe(testFn(ref1, ref2));

      expect(testFn(ref1, ref2)).not.toBe(testFn(ref1));
      expect(testFn(ref1, ref2)).not.toBe(testFn(ref2));

      expect(testFn(ref1, ref2)).not.toBe(testFn(ref2, ref1));
    });
  });

  it('the memoized function behaves similar (enough) to the original function', () => {
    const fn = (a, b, c) => `${a}_${b}_${c}`;
    const memoizedFn = memoize(fn);

    expect(fn(1, 2, 3)).toBe(memoizedFn(1, 2, 3));
  });
});
