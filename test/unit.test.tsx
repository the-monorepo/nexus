import { isHexColor, isRgbColor, isRgbaColor, isHslColor, isHslaColor } from 'src/index';
import { expandInputs } from './inputs/expand';
import { inputs, TestInputs } from './inputs/suites';
function testFunction(description: string, isColorFunction, ...validTestInputs: TestInputs[]) {
  describe(description, () => {
    const testInputs = expandInputs(...validTestInputs);
    const invalidTypes = [
      ["Function", () => undefined],
      ["Integer", 1],
      ["Floating point", 0.1],
      ["Class object", new class {}],
      ["Object", {}],
      ["Array", []],
      ["null", null]
    ];
    invalidTypes.forEach(([testName, value]) => {
      it(testName, () => {
        try {
          expect(isColorFunction).not.toBe(true);
        } catch(err) {
  
        }
      });
    });
    it("undefined", () => {
      try {
        expect(isColorFunction(undefined)).not.toBe(true);
      } catch(err) {
  
      }
    });
    it("no parameters", () => {
      try {
        expect(isColorFunction()).not.toBe(true);
      } catch(err) {
  
      }
    })
    for(const testInput of testInputs.valid) {
      it(testInput, () => {
        expect(isColorFunction(testInput)).toBe(true);
      });
    }
    for(const testInput of testInputs.invalid) {
      it(testInput, () => {
        expect(isColorFunction(testInput)).toBe(false);
      });    
    }  
  })
}
testFunction('Hex', isHexColor, inputs.hex);
testFunction('rgb(...)', isRgbColor, inputs.rgb);
testFunction('rgba(...)', isRgbaColor, inputs.rgba);
testFunction('hsl(...)', isHslColor, inputs.hsl);
testFunction('hsla(...)', isHslaColor, inputs.hsla)