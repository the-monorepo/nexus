import { readFile } from 'fs/promises';

import globby from 'globby';

export type PipelinesIterable<T> = Iterable<T> | AsyncIterable<T>;

export type ReferencelessPipelinesObject<T> = {
  ref: URL | undefined;
  contents: Promise<T>;
};

export type PipelinesObject<T> = {
  ref: URL;
  contents: Promise<T>;
};

export type FileSystemObject<T> = PipelinesObject<T> & {
  isFile: Promise<boolean>;
  isDirectory: Promise<boolean>;
};

/*
export class ReadableStreamFsObject<T> implements PipelinesObject<ReadableStream<T>> {
  #contentStream: Promise<ReadableStream<T>>;

  constructor(
    readonly ref: URL,
    stream: ReadableStream<T>
  ) {
    this.#contentStream = Promise.resolve(stream);
  }

  async contents() {
    return this.#contentStream;
  }
}

const convertToReadableStream = (stream: any): ReadableStream<T> => {
  return stream;
};*/

export abstract class FileObject<T> implements FileSystemObject<T> {
  abstract ref: URL;
  abstract contents: Promise<T>;
  readonly isFile = Promise.resolve(true);
  readonly isDirectory = Promise.resolve(false);
}

export class ReadFileObject extends FileObject<string> {
  #contentsPromise: Promise<string> | null = null;

  constructor(readonly ref: URL) {
    super();
  }

  get contents(): Promise<string> {
    return (async () => {
      if (this.#contentsPromise !== null) {
        return await this.#contentsPromise;
      }

      return await readFile(url.fileURLToPath(this.ref), 'utf8');
    })();
  }
}

export async function* readFrom(baseDir: '.', globs: string[] | string) {
  // TODO: Directories as well
  const files = await globby(globs, { onlyFiles: true, expandDirectories: false });
  yield* files.map((file) => new ReadFileObject(url.pathToFileURL(file)));
}

/*export async function* writeTo(
  iterable: PipelinesIterable<ReadFileObject>,
  baseDir: '.',
) {}*/
