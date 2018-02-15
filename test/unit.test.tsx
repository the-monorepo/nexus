import { isHexColor } from '/src/index';
it('Hex', () => {
  expect(isHexColor('#FFF')).toBe(true);
});