import broadcaster from '@pipelines/broadcaster';
import callbackConverter, { singleParamCallbackConverter } from '@pipelines/callback-converter';
import map from '@pipelines/map';
export { broadcaster, singleParamCallbackConverter, callbackConverter, map };

export const zip = <T extends any[]>(...iterables: AsyncIterable<T>[]): AsyncIterable<T[]> => {
  const current = new Array(iterables.length);
  const converter = singleParamCallbackConverter<T[]>();
  iterables.forEach(async (iterable, i) => {
    for await(const value of iterable) {
      current[i] = value;
      converter.callback([...current]);
    }
  });
  return converter;
};

export async function* entries<T>(iterable: AsyncIterable<T>) {
  let index = 0;
  for await (const value of iterable) {
    yield { index, value };
  }
}

export async function* filter<T>(iterable: AsyncIterable<T>, filter: (item: T) => boolean) {
  for await (const value of iterable) {
    if (filter(value)) {
      yield value;
    }
  }
};
