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
      const testFn = memoize((_) => new Set());

      const testValue = testFn();
      expect(testValue).toBe(testFn());
      expect(testValue).not.toBe(testFn('irrelevant'));
    });

    it('multiple args', () => {
      const testFn = memoize((_, __) => []);

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
    const fn = async (a, b?, c?) => `${a}_${b}_${c}`;
    const memoizedFn = memoize(fn);

    expect(fn('a')).resolves.toBe(memoizedFn('a'));
    expect(fn('a', 'b')).resolves.toBe(memoizedFn('a', 'b'));
    expect(fn('a', 'b', 'c')).resolves.toBe(memoizedFn('a', 'b', 'c'));

    expect(fn(1, 2, 3)).resolves.toBe(memoizedFn(1, 2, 3));
  });

  it('thrown errors are also memoized', () => {
    const memoizeDoThrow = memoize((value: any) => {
      throw value;
    });

    const catchError = (fn) => {
      try {
        fn();
        throw new Error('Expected to throw');
      } catch (err) {
        return err;
      }
    };

    const ref = {};
    expect(catchError(() => memoizeDoThrow(1))).toBe(catchError(() => memoizeDoThrow(1)));
    expect(catchError(() => memoizeDoThrow(1))).not.toBe(
      catchError(() => memoizeDoThrow(2)),
    );
    expect(catchError(() => memoizeDoThrow(ref))).toBe(
      catchError(() => memoizeDoThrow(ref)),
    );
  });
});
