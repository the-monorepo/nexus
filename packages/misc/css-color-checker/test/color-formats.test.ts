import {
  isHexColor,
  isRgbColor,
  isRgbaColor,
  isColorName,
  isHslColor,
  isHslaColor,
  isHwbColor,
} from '../src/index.ts';
import { testFunction } from './helpers/test-function.ts';
import { inputs } from './inputs/suites.ts';
testFunction('Hex', isHexColor, inputs.hex);
testFunction('rgb(...)', isRgbColor, inputs.rgb);
testFunction('rgba(...)', isRgbaColor, inputs.rgba);
testFunction('hsl(...)', isHslColor, inputs.hsl);
testFunction('hsla(...)', isHslaColor, inputs.hsla);
testFunction('Named', isColorName, inputs.named);
testFunction('hwb(...)', isHwbColor, inputs.hwb);
