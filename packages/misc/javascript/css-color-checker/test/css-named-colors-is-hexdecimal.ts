import * as cssColorNames from 'named-css-colors';

import { isHexColor } from '../src/index.ts';
describe('css-named-colors values are hexdecimal', () => {
  Object.keys(cssColorNames)
    .map((key) => cssColorNames[key])
    .forEach((value) => {
      expect(isHexColor(value)).toBe(true);
    });
});
