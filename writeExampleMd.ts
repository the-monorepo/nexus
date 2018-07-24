import { TestInputs } from './tests/inputs/test-inputs';
import {
  isHexColor,
  isRgbColor,
  isRgbaColor,
  isHslColor,
  isHslaColor,
  isColorName,
  isHwbColor,
  isCssColor,
} from './src/index';
import { inputs } from './tests/inputs/suites';
import fs from 'fs';

function example(isColorFunction, input: string) {
  return `${isColorFunction.name}("${input}");`;
}

function examples(isColorFunction, inputs: Set<string>, isValidSet: boolean) {
  let md = '';
  md += '```js\n';
  for (const input of inputs) {
    md += example(isColorFunction, input) + ` // ${isValidSet}\n`;
  }
  md += '```\n';
  return md;
}

function colorMatcherExamples(title, isColorFunction, inputSuite: TestInputs) {
  let md = `## ${title} colors\n`;
  md += '\n';
  md += '### Inputs that return true\n';
  md += examples(isColorFunction, inputSuite.invalid, true);
  md += '\n';
  md += '### Inputs that return true\n';
  md += examples(isColorFunction, inputSuite.valid, false);
  md += '\n';
  return md;
}
function genExampleMdString() {
  let md = '# Examples\n';
  md += '\n';
  md += `## ${isCssColor.name}`;
  md += '\n';
  md +=
    '`isCssColor` will return true for any input that returns true in the functions below.\n';
  md +=
    "E.g. `isCssColor('#FFFFFF')` and `isCssColor('rgb(255,255,255)')` will both return true\n";
  md += '\n';
  // TODO: Pretty much copy pasted from tests. Should refactor for better code reuse.
  md += colorMatcherExamples('Hex', isHexColor, inputs.hex);
  md += colorMatcherExamples('rgb(...)', isRgbColor, inputs.rgb);
  md += colorMatcherExamples('rgba(...)', isRgbaColor, inputs.rgba);
  md += colorMatcherExamples('hsl(...)', isHslColor, inputs.hsl);
  md += colorMatcherExamples('hsla(...)', isHslaColor, inputs.hsla);
  md += colorMatcherExamples('hwb(...)', isHwbColor, inputs.hwb);
  md += colorMatcherExamples('Named', isColorName, inputs.named);
  return md;
}

fs.writeFileSync('EXAMPLES.md', genExampleMdString(), 'utf8');
