import { isHexColor, isRgbColor, isRgbaColor, isColorName, isHslColor, isHslaColor } from 'src/index';
import { inputs } from './inputs/suites';
import { testFunction } from './helpers/test-function';
testFunction('Hex', isHexColor, inputs.hex);
testFunction('rgb(...)', isRgbColor, inputs.rgb);
testFunction('rgba(...)', isRgbaColor, inputs.rgba);
testFunction('hsl(...)', isHslColor, inputs.hsl);
testFunction('hsla(...)', isHslaColor, inputs.hsla);
testFunction('Named', isColorName, inputs.named);