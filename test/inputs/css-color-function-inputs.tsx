import { TestInputs } from './test-inputs';
export interface Bound {
  value: number;
  inclusive: boolean;
}

export interface ParameterFormat {
  percentages: boolean;
  min: Bound,
  max: Bound
}

export function generateCssColorFunctionInputs(functionName, ...parameters: ParameterFormat[]): TestInputs {
  const valid: Set<any> = new Set();
  const invalid: Set<any> = new Set();
  const parameterCount: number = parameters.length;
  function generateInput(
    hasName: boolean, 
    hasLeftBracket: boolean, 
    hasRightBracket: boolean, 
    spaceIndex: number = -1,
    parameterStrings: string[]
  ): string {
    const spaceGap = '  ';
    let input: string = hasName ? functionName : '';
    input += spaceIndex === 0 ? spaceGap : '';
    input += hasLeftBracket ? '(' : '';
    const formatedParameterStrings: string[] = [];
    for (let parameterIndex = 0; parameterIndex < parameterCount; parameterIndex++) {
      let formatedParameterString: string = "";
      formatedParameterString += spaceIndex === 1 + parameterIndex * 2 ? spaceGap : '';
      formatedParameterString += parameterStrings[parameterIndex];
      formatedParameterString += spaceIndex === 2 + parameterIndex * 2 ? spaceGap : '';
      formatedParameterStrings.push(formatedParameterString);
    }
    input += formatedParameterStrings.join(",");
    input += hasRightBracket ? ')' : '';
    return input;
  }
  function parameterValue(parameter: ParameterFormat, min: boolean, inRange: boolean, hasCorrectSuffix: boolean, decimal: 'leading' | 'short') {
    const bound: Bound = min ? parameter.min : parameter.max;
    const deltaSign: number = min ? -1 : 1;
    const correctDelta = bound.inclusive ? 0 : 0.0001;
    const incorrectDelta = bound.inclusive ? 0.0001 : 0;
    const delta = deltaSign * (inRange ? correctDelta : incorrectDelta);    
    const value = bound.value + delta;
    const correctSuffix = parameter.percentages ? '%' : '';
    const incorrectSuffix = parameter.percentages ? '' : '%';
    const suffix = hasCorrectSuffix ? correctSuffix : incorrectSuffix;
    return `${value}${suffix}`;
  }
  
  function validValue(parameter: ParameterFormat, min: boolean) {
    return parameterValue(parameter, min, true, true, 'leading');
  }
  
  function validMinValues() {
    return parameters.map(p => validValue(p, true));
  } 

  function validMaxValues() {
    return parameters.map(p => validValue(p, false));
  }

  valid.add(generateInput(true, true, true, undefined, validMinValues()));
  valid.add(generateInput(true, true, true, undefined, validMaxValues()));
  valid.add(generateInput(true, true, true, undefined, parameters.map(p => parameterValue(p, true, true, true, 'short'))));
  invalid.add(generateInput(true, true, true, undefined, parameters.map(p => parameterValue(p, true, false, true, 'leading'))));
  invalid.add(generateInput(true, true, true, undefined, parameters.map(p => parameterValue(p, false, false, true, 'leading'))));
  invalid.add(generateInput(true, true, true, undefined, parameters.map(p => parameterValue(p, true, true, false, 'leading'))));
  if (parameters.filter(p => p.min.value < 0).length > 0) {
    invalid.add(generateInput(true, true, true, undefined, parameters.map(p => `${p.min.value > 0 ? '-' : ''}${parameterValue(p, true, true, true, 'leading')}`)));
  }
  invalid.add(generateInput(true,false,false, undefined, validMinValues()));
  invalid.add(generateInput(false, true, true, undefined, validMaxValues()));
  // x1(2)
  // x1(2x3)
  // x1(2x3,4x5)
  // x1(2x3,4x5,6x7)
  for (let spaceIndex = 1; spaceIndex < parameterCount * 2 + 1; spaceIndex++) {
    valid.add(generateInput(true, true, true, spaceIndex, validMinValues()));
    valid.add(generateInput(true, true, true, spaceIndex, validMaxValues()));
  }

  invalid.add(generateInput(false, true, true, undefined, validMinValues()));
  invalid.add(generateInput(true, false, true, undefined, validMaxValues()));
  invalid.add(generateInput(true, true, false, undefined, validMinValues()));
  invalid.add(' ' + generateInput(true, true, true, undefined, validMaxValues()));
  invalid.add(generateInput(true, true, true, undefined, validMinValues()) + ' ');
  invalid.add(generateInput(true, true, true, undefined, validMinValues()).toUpperCase());
  return {
    valid,
    invalid
  };
}