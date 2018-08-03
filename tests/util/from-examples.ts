import { extractTypeInfo } from '@by-example/types';
import { createSchema } from '@by-example/openapi';
import { knobify } from '@by-example/storybook-addon-knobify';
export function examples(examples: any[]) {
  const typeInfo = extractTypeInfo(examples);
  return {
    typeInfo: expectedTypeInfo => {
      expect(typeInfo).toEqual(expectedTypeInfo);
      const that = {
        use: (conversionFunction, expectedOutput) => {
          const output = conversionFunction(typeInfo);
          expect(output).toEqual(expectedOutput);
          return that;
        },
        openapi: (expectedOutput, options = {}) => {
          return that.use(() => createSchema(typeInfo, options), expectedOutput);
        },
      };
      return that;
    },
  };
}
