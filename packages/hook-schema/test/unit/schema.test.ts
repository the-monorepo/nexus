import { fromSchema } from '../../src';
describe('schema', () => {
  const testSchema = {
    a: null,
    b: null,
    nested1: {
      c: null,
      d: () => async context => context.a + 1,
    },
    nested2: {
      e: null,
      f: () => async () => 2,
    },
  };

  const hookUtil = fromSchema(testSchema);
  it('undefined', async () => {
    const hooks = hookUtil.withHooks();
    await hooks.before.a({});
    await hooks.before.b({});
    await hooks.before.nested1.c({});
    await expect(hooks.before.nested1.d({ a: 2 })).resolves.to.be(3);
    await hooks.before.nested2.e({});
    await expect(hooks.before.nested2.f()).resolves.to.be(2);
  });

  it("doesn't replace when hook callback already exists", async () => {
    const hooks = hookUtil.withHooks({
      before: {
        a: async () => 33,
      },
      after: {
        b: async () => 22,
      },
    });
    await expect(hooks.before.a({})).resolves.to.be(33);
    await expect(hooks.after.a({})).resolves.to.beUndefined();
    await expect(hooks.before.b({})).resolves.to.beUndefined();
    await expect(hooks.after.b({})).resolves.to.be(22);
  });
});
