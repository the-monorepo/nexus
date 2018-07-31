import { isCssColor } from '../src/index';
describe('isCssColor', () => {
  it('rgb(0,0,0) returns true', () => {
    expect(isCssColor('rgb(0,0,0)')).toBe(true);
  });
  it('rgba(0,0,0,e) returns false', () => {
    expect(isCssColor('rgba(0,0,0,e)')).toBe(false);
  });
});
