import { findSingleType } from 'src/index';
describe('types', () => {
  let callbacks = { 
    boolean: jest.fn(),
    string: jest.fn(),
    func: jest.fn(),
    number: jest.fn(),
    integer: jest.fn(),
    array: jest.fn(),
    object: jest.fn()
  };
  function testSingleTests(name: string, values: any[], expectedCalledKey: string) {
    it(name, () => {
      findSingleType(values, callbacks);
      expect(callbacks.mock.calls.length).toBe(1);
      Object.keys(callbacks)
        .filter(key => key !== expectedCalledKey)
        .forEach(key => expect(callbacks[key].mock.calls.length).toBe(0));
    });
  }
  testSingleTests('boolean', [1, 2, 3], 'boolean')
});