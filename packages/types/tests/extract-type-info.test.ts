import { extractTypeInfo } from '../src/index';
describe('extract-type-info', () => {
  it('integers', () => {
    expect(extractTypeInfo([1, 2, 3]));
  });
});
