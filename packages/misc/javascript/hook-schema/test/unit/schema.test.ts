import { fromSchema } from '../../src/index.ts';
describe('schema', () => {
  const testSchema = {
    a: null,
    b: null,
    nested1: {
      c: null,
      d: () => async (context) => context.a + 1,
    },
    nested2: {
      e: null,
      f: () => async () => 2,
    },
  };

  const hookUtil = fromSchema(testSchema);
  it('undefined', async () => {
    const hooks = hookUtil.withNoops();
    await hooks.before.a({});
    await hooks.before.b({});
    await hooks.before.nested1.c({});
    await expect(hooks.before.nested1.d({ a: 2 })).resolves.toBe(3);
    await hooks.before.nested2.e({});
    await expect(hooks.before.nested2.f()).resolves.toBe(2);
  });

  it("doesn't replace when hook callback already exists", async () => {
    const hooks = hookUtil.withNoops({
      before: {
        a: async () => 33,
      },
      after: {
        b: async () => 22,
      },
    });
    await expect(hooks.before.a({})).resolves.toBe(33);
    await expect(hooks.after.a({})).resolves.toBeUndefined();
    await expect(hooks.before.b({})).resolves.toBeUndefined();
    await expect(hooks.after.b({})).resolves.toBe(22);
  });
});
