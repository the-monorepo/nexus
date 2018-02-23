export interface TestInputs {
  readonly valid: Set<string>;
  readonly invalid: Set<string>;
}

function testInputs(valid: any[], invalid: any[]): TestInputs {
  return {
    valid: new Set(valid),
    invalid: new Set(invalid)
  }
}

export const inputs: { 
  [key: string]: TestInputs
} = {
  rgb: testInputs(
    [
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
    ], [
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
      "rgb(256,256,256)"
    ]
  ),
  hex: testInputs(
    [
      "#fff",
      "#FFF",
      "#FFFFFF",
      "#FFFFFFFF",
      "#000",
      "#000000",
      "#00000000"
    ], [
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
    ]
  ),
  rgba: testInputs(
    [
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
      'rgba(0,0,0,0  )'
    ], [
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
    ]
  ),
  hsl: testInputs(
    [
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
    ], [
      "hsl(360.0001,100.0001%,100.0001%)",
      "hsl(0,0%,0%",
      "sl(0,0%,0%)",
      "0,0%,0%",
      "rgb(255,255,255)",
      "rgb(0,0%,0%)",
      " hsl(0,0%,0%)",
      "hsl(0%,0%,0%) ",
      "HSL(0,0%,0%)"
    ]
  )
} 