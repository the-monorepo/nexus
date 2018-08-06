import { extractTypeInfo } from '../../packages/types';
import { createSchema } from '../../packages/openapi';
import { knobify } from '../../packages/storybook-addon-knobify';
jest.mock('@storybook/addon-actions');
export function examples(examples: any[]) {
  const typeInfo = extractTypeInfo(examples);
  return {
    typeInfo: expectedTypeInfo => {
      it('typeInfo', () => {
        expect(typeInfo).toEqual(expectedTypeInfo);
      });
      const that = {
        use: (testName, conversionFunction, expectedOutput) => {
          it(testName, () => {
            const output = conversionFunction(typeInfo);
            expect(output).toEqual(expectedOutput);
          });
          return that;
        },
        openapi: (expectedOutput, options = {}) => {
          return that.use(
            'openapi',
            () => createSchema(typeInfo, options),
            expectedOutput,
          );
        },
        storybook: (expectedOutput, options = {}) => {
          return that.use(
            'storybook',
            () => {
              // Note that the storybook module directly modifies the examples
              const shallowClonedExamples = examples.map(example => ({
                ...example,
              }));
              knobify(shallowClonedExamples, typeInfo, undefined, options);
              return shallowClonedExamples;
            },
            expectedOutput,
          );
        },
      };
      return that;
    },
  };
}
