import { isHexColor } from 'src/index';
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
  "#FFF",
  "#FFFFFF",
  "#FFFFFFFF",
  "#000",
  "#000000",
  "#00000000"
]);
const invalidHexValues = new Set([
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

const validRgbValues = [
  "rgb(0,0,0)",
  "rgb(0.1,0.1,0.1)",
  "rgb(.2,.2,.2)",
  "rgb(255,255,255)",
  "rgb(256,256,256)",
  "rgb(0,0,0)",
  "rgb  (0,0,0)",
  "rgb(  0,0,0)",
  "rgb(0  ,0,0)",
  "rgb(0,  0,0)",
  "rgb(0,0  ,0)",
  "rgb(0,0,  0)",
  "rgb(0,0,0  )"
];
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
  " rgb(0,0,0)"
]);
const validRgbaValues = [
  "rgba(0,0,0,0)",
  "rgba(255,255,255,1)",
  "rgba(.1,.1,.1,.1)",
];
const invalidRgbaValues = [
  "rgba(256,256,256,1)",
  "rgba(255,255,255,1.1)",
  "rgba(256,256,256,1.1)",
  "rgba(255,255,255,1",
  "255,255,255,1",
  "(255,255,255,1)",
  "rgba(255,255,255,1) ",
  " rgba(255,255,255,1)",
  "rgba(-1,-1,-1,-1)"
]
describe('Hex', () => {
  testFunction(isHexColor, validHexValues, invalidHexValues);
});