import jest from 'jest-mock';

import {
  types,
  keys,
  error,
  success,
  exception,
  isError,
  isException,
  isFailure,
  isSuccess,
  handle,
} from '../src/index';

const testInfoSet = {
  success: {
    type: types.SUCCESS,
    key: keys.SUCCESS as typeof keys.SUCCESS,
    value: Symbol('success'),
    handleValue: Symbol('handled-success'),
    create: success,
    isSuccess: true,
    isError: false,
    isException: false,
    isFailure: false,
  },
  error: {
    type: types.ERROR,
    key: keys.ERROR as typeof keys.ERROR,
    value: Symbol('error'),
    handleValue: Symbol('handled-error'),
    create: error,
    isSuccess: false,
    isError: true,
    isException: false,
    isFailure: true,
  },
  exception: {
    type: types.EXCEPTION,
    key: keys.EXCEPTION as typeof keys.EXCEPTION,
    value: Symbol('exception'),
    handleValue: Symbol('handled-exception'),
    create: exception,
    isSuccess: false,
    isError: false,
    isException: true,
    isFailure: true,
  },
};

describe('resultful', () => {
  for (const [payloadType, testInfo] of Object.entries(testInfoSet)) {
    it(`${payloadType} works`, () => {
      const otherKeys = new Set(Object.values(keys));
      otherKeys.delete(testInfo.key);

      const payload = (testInfo.create as any)(testInfo.value);
      expect(payload.type).toBe(testInfo.type);
      for (const otherKey of otherKeys) {
        expect(payload[otherKey]).toBeUndefined();
      }
      expect(payload[testInfo.key]).toBe(testInfo.value);
      expect(isError(payload)).toBe(testInfo.isError);
      expect(isException(payload)).toBe(testInfo.isException);
      expect(isSuccess(payload)).toBe(testInfo.isSuccess);
      expect(isFailure(payload)).toBe(testInfo.isFailure);

      const handlers = {
        payload: jest.fn().mockReturnValue(testInfoSet.success.handleValue),
        error: jest.fn().mockReturnValue(testInfoSet.error.handleValue),
        exception: jest.fn().mockReturnValue(testInfoSet.exception.handleValue),
      };

      const value = handle(payload, handlers);
      expect(value).toBe(testInfo.handleValue);

      expect(handlers[testInfo.key]).toHaveBeenCalledTimes(1);
      for (const otherKey of otherKeys) {
        expect(handlers[otherKey]).not.toHaveBeenCalled();
      }
    });
  }
});
