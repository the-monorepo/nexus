import {
  isValidAlphaValue,
  isValidHue,
  isValidPercentageString,
  isValidRgbVal,
} from '../src/value-checks';
import { isHwbColor } from '../src/index';
import * as suites from './inputs/suites';
import jest from 'jest-mock';
const floatParsingFunctions = [
  isValidAlphaValue,
  isValidHue,
  isValidPercentageString,
  isValidRgbVal,
];
describe('handles parseFloat errors', () => {
  beforeEach(() => {
    global.Number.parseFloat = jest.fn().mockImplementation(() => {
      throw new Error('test');
    });
  });
  floatParsingFunctions.forEach(valCheckFunction => {
    it(`${valCheckFunction.name} returns false`, () => {
      expect(valCheckFunction('')).toBe(false);
    });
  });
  it(`${isHwbColor.name} returns false`, () => {
    expect(isHwbColor(suites.inputs.hwb.valid.values().next().value)).toBe(false);
  });
});
