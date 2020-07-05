import { createSchema } from '@byexample/openapi';
import { knobified } from '@byexample/storybook-knobified';
import { extractTypeInfo } from '@byexample/types';
export type ExpectOutputFunction<T> = (expectedOutput: any, options?: any) => T;
export type Tester<T> = ExpectOutputFunction<T> & {
  toThrowError(error?: Error): T;
};

type Testers<T> = { [K in keyof T]: Tester<Testers<T>> };

function mapToTestersObject<T>(conversionFnsObject: T): Testers<T> {
  const testers: any = {};
  const tester = (name: string, conversionFn: (options: any) => any) => {
    const aTester: any = (expectedOutput, options) => {
      it(name, () => {
        const output = conversionFn(options);
        expect(output).toEqual(expectedOutput);
      });

      return testers;
    };

    aTester.toThrowError = (error, options) => {
      it(name, () => {
        expect(() => conversionFn(options)).toThrowError(error);
      });

      return testers;
    };

    return aTester;
  };

  for (const [key, conversionFn] of Object.entries(conversionFnsObject)) {
    testers[key] = tester(key, conversionFn);
  }

  return testers;
}

export const examples = (examples: any[]) => {
  const typeInfo = extractTypeInfo(examples);
  return {
    typeInfo: (expectedTypeInfo) => {
      it('typeInfo', () => {
        expect(typeInfo).toEqual(expectedTypeInfo);
      });

      const testers = mapToTestersObject({
        openapi: (options) => createSchema(expectedTypeInfo, options),
        storybook: (options) => {
          const shallowCopy = examples.map((example) => ({ ...example }));
          knobified(examples, expectedTypeInfo, options);
          return shallowCopy;
        },
      });

      return testers;
    },
  };
};
