import { fn } from 'jest-mock';
import { replaceFunctions, RecursionOptions } from 'replace-functions';
export const mockFunctions = <T>(
  value: T,
  recursive: RecursionOptions = false,
  onMockFunction: (mockedFn, originalFn) => any = () => {},
) => {
  return replaceFunctions(
    value,
    (originalFn) => {
      const mockedFn = fn();
      onMockFunction(mockedFn, originalFn);
      return mockedFn;
    },
    recursive,
  );
};

export default mockFunctions;
