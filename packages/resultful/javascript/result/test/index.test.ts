import jest from 'jest-mock';

import { failure, ok, isFailure, isOk, map, OK, FAILURE } from '../src/index.ts';

const successPayload = {
  type: OK,
  key: 'ok' as const,
  value: Symbol('ok'),
  mapValue: Symbol('map-ok'),
  create: ok,
  isOk: true,
  isFailure: false,
};

const testInfoSet = {
  ok: successPayload,
  failure: {
    type: FAILURE,
    key: 'failure' as const,
    value: Symbol('failure'),
    mapValue: Symbol('map-failure'),
    create: failure,
    isOk: false,
    isFailure: true,
  },
};

describe('resultful', () => {
  for (const [payloadType, testInfo] of Object.entries(testInfoSet)) {
    it(`${payloadType} works`, () => {
      const otherKeys = new Set(['ok', 'failure']);
      otherKeys.delete(testInfo.key);

      const payload = (testInfo.create as any)(testInfo.value);
      expect(payload.type).toBe(testInfo.type);
      for (const otherKey of otherKeys) {
        expect(payload[otherKey]).toBeUndefined();
      }
      expect(payload[testInfo.key]).toBe(testInfo.value);
      expect(isOk(payload)).toBe(testInfo.isOk);
      expect(isFailure(payload)).toBe(testInfo.isFailure);

      const mappers = {
        ok: jest.fn().mockReturnValue(testInfoSet.ok.mapValue),
        failure: jest.fn().mockReturnValue(testInfoSet.failure.mapValue),
      };

      const value = map(payload, mappers);
      expect(value).toBe(testInfo.mapValue);

      expect(mappers[testInfo.key]).toHaveBeenCalledTimes(1);
      for (const otherKey of otherKeys) {
        expect(mappers[otherKey]).not.toHaveBeenCalled();
      }
    });
  }
  /*
  it ('maps with no option available', () => {
    expect(map(ok('test'))).toBe(undefined);
  });*/
});
