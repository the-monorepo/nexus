import cssColorNames from '../src/css-named-colors';
import { isHexColor } from '../src';
describe('css-named-colors values are hexdecimal', () => {
  Object.keys(cssColorNames)
    .map(key => cssColorNames[key])
    .forEach(value => {
      expect(isHexColor(value)).toBe(true);
    });
});
