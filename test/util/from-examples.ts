import { extractTypeInfo } from '../../packages/types';
import { createSchema } from '../../packages/openapi';
import { knobify } from '../../packages/storybook-addon-knobify';
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
