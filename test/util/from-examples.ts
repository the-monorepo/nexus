import { extractTypeInfo } from '../../packages/types';
import { createSchema } from '../../packages/openapi';
import { knobify } from '../../packages/storybook-addon-knobify';
jest.mock('@storybook/addon-actions');
jest.mock('@storybook/addon-knobs');
export type ExpectOutputFunction<T> = (expectedOutput: any, options?: any) => T;
export type Tester<T> = ExpectOutputFunction<T> & {
  toThrowError(error?: Error): T;
};

type Testers<T> = { [K in keyof T]: Tester<Testers<T>> };

function mapToTestersObject<T>(conversionFunctionsObject: T): Testers<T> {
  const testers = {};
  function tester(name: string, conversionFunction: (options: any) => any) {
    const aTester: any = (expectedOutput, options) => {
      it(name, () => {
        const output = conversionFunction(options);
        expect(output).toEqual(expectedOutput);
      });
      return testers;
    };
    aTester.toThrowError = (error, options) => {
      it(name, () => {
        expect(() => conversionFunction(options)).toThrowError(error);
      });
      return testers;
    };
    return aTester;
  }
  return Object.keys(conversionFunctionsObject).reduce((prev, cur) => {
    prev[cur] = tester(cur, conversionFunctionsObject[cur]);
    return prev;
  }, testers) as Testers<T>;
}

export function examples(examples: any[]) {
  const typeInfo = extractTypeInfo(examples);
  return {
    typeInfo: expectedTypeInfo => {
      it('typeInfo', () => {
        expect(typeInfo).toEqual(expectedTypeInfo);
      });
      const testers = mapToTestersObject({
        openapi: options => createSchema(expectedTypeInfo, options),
        storybook: options => {
          const shallowCopy = examples.map(example => ({ ...example }));
          knobify(examples, expectedTypeInfo, undefined, options);
          return shallowCopy;
        },
      });
      return testers;
    },
  };
}
