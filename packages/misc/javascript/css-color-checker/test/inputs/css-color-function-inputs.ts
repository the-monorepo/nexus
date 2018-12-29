import { TestInputs } from './test-inputs.ts';
export type Bound = {
  value: number;
  inclusive: boolean;
};

export type ParameterFormat = {
  percentages: boolean;
  min: Bound;
  max: Bound;
  noLetters: boolean;
};

export function generateCssColorFunctionInputs(
  functionName,
  ...parameters: ParameterFormat[]
): TestInputs {
  const valid: Set<any> = new Set();
  const invalid: Set<any> = new Set();
  const parameterCount: number = parameters.length;
  function generateInput(
    hasName: boolean,
    hasLeftBracket: boolean,
    hasRightBracket: boolean,
    spaceIndex = -1,
    parameterStrings: string[],
  ): string {
    const spaceGap = '  ';
    let input: string = hasName ? functionName : '';
    input += spaceIndex === 0 ? spaceGap : '';
    input += hasLeftBracket ? '(' : '';
    const formatedParameterStrings: string[] = [];
    for (let parameterIndex = 0; parameterIndex < parameterCount; parameterIndex++) {
      let formatedParameterString = '';
      formatedParameterString += spaceIndex === 1 + parameterIndex * 2 ? spaceGap : '';
      formatedParameterString += parameterStrings[parameterIndex];
      formatedParameterString += spaceIndex === 2 + parameterIndex * 2 ? spaceGap : '';
      formatedParameterStrings.push(formatedParameterString);
    }
    input += formatedParameterStrings.join(',');
    input += hasRightBracket ? ')' : '';
    return input;
  }

  function parameterValue(
    parameter: ParameterFormat,
    min: boolean,
    offsetDelta: number,
    hasCorrectSuffix: boolean,
    decimal: 'leading' | 'short',
    noLetter: boolean,
  ) {
    const correctSuffix: string = parameter.percentages ? '%' : '';
    const incorrectSuffix: string = parameter.percentages ? '' : '%';
    const suffix: string = hasCorrectSuffix ? correctSuffix : incorrectSuffix;
    let decimalString: string | undefined = undefined;
    if (noLetter) {
      const bound: Bound = min ? parameter.min : parameter.max;
      const correctDeltaSign: number = min ? 1 : -1;
      const incorrectDeltaSign: number = min ? -1 : 1;
      const deltaSign: number = offsetDelta >= 0 ? correctDeltaSign : incorrectDeltaSign;
      const delta: number = deltaSign * Math.abs(offsetDelta);
      const value: number = bound.value + delta;
      const valueString = value.toString();
      decimalString =
        decimal === 'leading' ? valueString : valueString.replace(/^0+\./, '.');
    } else {
      decimalString = 'e';
    }
    return `${decimalString}${suffix}`;
  }

  function validValue(parameter: ParameterFormat, min: boolean) {
    return parameterValue(parameter, min, 0, true, 'leading', parameter.noLetters);
  }

  function validMinValues() {
    return parameters.map((p) => validValue(p, true));
  }

  function validMaxValues() {
    return parameters.map((p) => validValue(p, false));
  }

  valid.add(generateInput(true, true, true, undefined, validMinValues()));
  valid.add(generateInput(true, true, true, undefined, validMaxValues()));
  valid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) => parameterValue(p, true, 0.001, true, 'short', p.noLetters)),
    ),
  );
  valid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) => parameterValue(p, true, 0.001, true, 'leading', p.noLetters)),
    ),
  );
  valid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) => parameterValue(p, false, 0.001, true, 'short', p.noLetters)),
    ),
  );
  valid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) =>
        parameterValue(p, false, 0.001, true, 'leading', p.noLetters),
      ),
    ),
  );
  valid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) => parameterValue(p, true, 1, true, 'leading', p.noLetters)),
    ),
  );

  invalid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) =>
        parameterValue(p, true, -0.001, true, 'leading', p.noLetters),
      ),
    ),
  );
  invalid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) =>
        parameterValue(p, false, -0.001, true, 'leading', p.noLetters),
      ),
    ),
  );
  if (parameters.filter((p) => p.min.value < 0).length > 0) {
    invalid.add(
      generateInput(
        true,
        true,
        true,
        undefined,
        parameters.map(
          (p) =>
            `${p.min.value > 0 ? '-' : ''}${parameterValue(
              p,
              true,
              0.001,
              true,
              'leading',
              p.noLetters,
            )}`,
        ),
      ),
    );
  }
  invalid.add(
    generateInput(
      true,
      true,
      true,
      undefined,
      parameters.map((p) => parameterValue(p, true, 1, true, 'leading', false)),
    ),
  );
  invalid.add(generateInput(true, false, false, undefined, validMinValues()));
  invalid.add(generateInput(false, true, true, undefined, validMaxValues()));

  for (let spaceIndex = 1; spaceIndex < parameterCount * 2 + 1; spaceIndex++) {
    valid.add(generateInput(true, true, true, spaceIndex, validMinValues()));
    valid.add(generateInput(true, true, true, spaceIndex, validMaxValues()));
  }

  invalid.add(generateInput(false, true, true, undefined, validMinValues()));
  invalid.add(generateInput(true, false, true, undefined, validMaxValues()));
  invalid.add(generateInput(true, true, false, undefined, validMinValues()));
  invalid.add(` ${generateInput(true, true, true, undefined, validMaxValues())}`);
  invalid.add(`${generateInput(true, true, true, undefined, validMinValues())} `);
  invalid.add(generateInput(true, true, true, undefined, validMinValues()).toUpperCase());
  return {
    valid,
    invalid,
  };
}
