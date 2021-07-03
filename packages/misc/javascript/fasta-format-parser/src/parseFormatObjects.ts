import { valueOf } from 'resultful';
import { parseFormatObject } from './parseFormatObject.ts';

export async function* parseFormatObjects(reader: AsyncIterableIterator<string>) {
  let current = await reader.next();
  while (!current.done) {
    while (!current.done && current.value !== '>') {
      current = await reader.next();
    }

    const result = await parseFormatObject(reader);
    const value = valueOf(result);
    if (value.currentReaderResult === null) {
      yield result;
      break;
    }

    current = value.currentReaderResult;
    yield result;
  }
}
