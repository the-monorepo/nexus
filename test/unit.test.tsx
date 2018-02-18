import { isHexColor, isRgbColor, isRgbaColor, isHslColor } from 'src/index';
function testFunction(isColorFunction, trueCases: Set<any>, falseCases: Set<any>) {
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
  for(const testInput of trueCases.values()) {
    it(testInput, () => {
      expect(isColorFunction(testInput)).toBe(true);
    });
  }
  for(const testInput of falseCases.values()) {
    it(testInput, () => {
      expect(isColorFunction(testInput)).toBe(false);
    });    
  }
}
const validHexValues = new Set([
  "#fff",
  "#FFF",
  "#FFFFFF",
  "#FFFFFFFF",
  "#000",
  "#000000",
  "#00000000"
]);
const invalidHexValues = new Set([
  "#f",
  "#F",
  "#FF",
  "#FFFF",
  "#FFFFF",
  "#0000000",
  "#0",
  "#00",
  "#0000",
  "#00000",
  "#0000000",
  "#GGG",
  "#GGGGGG",
  "F",
  "G",
  "0",
  " #FFFFFF",
  "#FFFFFF "
]);

const validRgbValues = new Set([
  "rgb(0,0,0)",
  "rgb(0.1,0.1,0.1)",
  "rgb(.2,.2,.2)",
  "rgb(255,255,255)",
  "rgb(0,0,0)",
  "rgb  (0,0,0)",
  "rgb(  0,0,0)",
  "rgb(0  ,0,0)",
  "rgb(0,  0,0)",
  "rgb(0,0  ,0)",
  "rgb(0,0,  0)",
  "rgb(0,0,0  )",
  "rgb(254.9999,254.9999,254.9999)"
]);
const invalidRgbValues = new Set([
  "gb(0,0,0)",
  "rb(0,0,0)",
  "b(0,0,0)",
  "rgb(-1,-1,-1)",
  "rgb1,1,1",
  "rgb(0",
  "rgb(0,0,0",
  "rgb(0,0,0))",
  "rgb(0,0,0) ",
  "RGB(0,0,0)",
  " rgb(0,0,0)",
  "rgb(255.0001,255.0001,255.0001)",
  "rgb(256,256,256)",
]);
const validRgbaValues = new Set([
  "rgba(0,0,0,0)",
  "rgba(255,255,255,1)",
  "rgba(.1,.1,.1,.1)",
  'rgba  (0,0,0,0)',
  "rgba(  0,0,0,0)",
  'rgba(0  ,0,0,0)',
  'rgba(0,  0,0,0)',
  'rgba(0,0  ,0,0)',
  'rgba(0,0,  0,0)',
  'rgba(0,0,0  ,0)',
  'rgba(0,0,0,  0)',
  'rgba(0,0,0,0  )',

]);
const invalidRgbaValues = new Set([
  "RGBA(0,0,0)",
  "rgba(256,256,256,1)",
  "rgba(255,255,255,1.1)",
  "rgba(256,256,256,1.1)",
  "rgba(255,255,255,1",
  "255,255,255,1",
  "(255,255,255,1)",
  "rgba(255,255,255,1) ",
  " rgba(255,255,255,1)",
  "rgba(-1,-1,-1,-1)"
]);
const validHslValues = new Set([
  "hsl(360,100%,100%)",
  "hsl(0,0%,0%)",
  "hsl  (0,0%,0%)",
  "hsl(  0,0%,0%)",
  "hsl(0  ,0%,0%)",
  "hsl(0,  0%,0%)",
  "hsl(0,0%  ,0%)",
  "hsl(0,0%,  0%)",
  "hsl(0,0%,0%  )",
  "hsl(0.1,0.1%,0.1%)",
  "hsl(359.9999,99.9999%,99.99999%)",
  "hsl(.1,.1%,.1%)"
]);
const invalidHslValues = new Set([
  "hsl(360.0001,100.0001%,100.0001%)",
  "hsl(0,0%,0%",
  "sl(0,0%,0%)",
  "0,0%,0%",
  "rgb(255,255,255)",
  "rgb(0,0%,0%)",
  " hsl(0,0%,0%)",
  "hsl(0%,0%,0%) ",
  "HSL(0,0%,0%)"
])
describe('Hex', () => {
  testFunction(isHexColor, validHexValues, invalidHexValues);
});
describe('rgb(...)', () => {
  testFunction(isRgbColor, validRgbValues, invalidRgbValues);
});
describe('rgba(...)', () => {
  testFunction(isRgbaColor, validRgbaValues, invalidRgbaValues);
});
describe('hsl(...)', () => {
  testFunction(isHslColor, validHslValues, invalidHslValues);
})