import * as jest from 'jest-mock';

import schema, { mergeHookOptions } from '../../src/index.ts';
describe('mergeHookOptions', () => {
  it('calls all associated hooks', async () => {
    const testSchema = {
      test1: null,
      nested: {
        test2: null,
        nested: {
          test3: () => async () => {},
        },
      },
    };

    const options1 = {};
    const options2 = {
      before: {
        test1: jest.fn().mockResolvedValue(null),
      },
    };
    const options3 = {
      after: {
        nested: {
          test2: jest.fn().mockResolvedValue(null),
          nested: {
            test3: jest.fn().mockRejectedValue(null),
          },
        },
      },
    };
    const merged = mergeHookOptions([options1, options2, options3], testSchema);
    await merged.before.test1();
    expect(options2.before.test1).toHaveBeenCalledTimes(1);
    expect(options3.after.nested.test2).not.toHaveBeenCalled();

    await merged.after.nested.test2();
    expect(options3.after.nested.test2).toHaveBeenCalledTimes(1);

    // TODO: This seems to break Jest in some way?
    // await merged.after.nested.nested.test3();

    // Call the rest of the hooks we haven't called yet just for good measure
    await merged.before.nested.test2();
    await merged.after.test1();
    await merged.before.nested.nested.test3();
  });

  it('works with "on" hooks', async () => {
    const beforeAfterSchema = {
      a: null,
    };
    const onSchema = {
      b: null,
    };
    const hookUtil = schema(beforeAfterSchema, onSchema);

    const hooks1 = hookUtil.withNoops({
      before: {
        a: jest.fn(),
      },
      on: {
        b: jest.fn(),
      },
    });
    const hooks2 = {
      before: {
        a: jest.fn(),
      },
      on: {
        b: jest.fn(),
      },
    };

    const mergedHooks = hookUtil.merge([hooks1, hooks2, undefined]);

    await mergedHooks.on.b();
    expect(hooks1.on.b).toHaveBeenCalled();
    expect(hooks2.on.b).toHaveBeenCalled();

    await mergedHooks.before.a();
    expect(hooks1.before.a).toHaveBeenCalled();
    expect(hooks2.before.a).toHaveBeenCalled();
  });
});
