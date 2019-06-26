import schema, { mergeHookOptions } from '../../src';
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
        test1: stub().mockResolvedValue(null),
      },
    };
    const options3 = {
      after: {
        nested: {
          test2: stub().mockResolvedValue(null),
          nested: {
            test3: stub().mockRejectedValue(null),
          },
        },
      },
    };
    const merged = mergeHookOptions([options1, options2, options3], testSchema);
    await merged.before.test1();
    expect(options2.before.test1).to.have.callCount(1);
    expect(options3.after.nested.test2).not.to.have.been.called();

    await merged.after.nested.test2();
    expect(options3.after.nested.test2).to.have.callCount(1);

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

    const hooks1 = hookUtil.withHooks({
      before: {
        a: stub(),
      },
      on: {
        b: stub(),
      },
    });
    const hooks2 = {
      before: {
        a: stub(),
      },
      on: {
        b: stub(),
      },
    };

    const mergedHooks = hookUtil.mergeHookOptions([hooks1, hooks2, undefined]);

    await mergedHooks.on.b();
    expect(hooks1.on.b).to.have.been.called();
    expect(hooks2.on.b).to.have.been.called();

    await mergedHooks.before.a();
    expect(hooks1.before.a).to.have.been.called();
    expect(hooks2.before.a).to.have.been.called();
  });
});
