import { parse } from '@babel/parser';
import type { File } from '@babel/types';

import { FileObject, FileSystemObject, PipelinesIterable } from '@pipelines/core';

class BabelParserFileObject extends FileObject<File> {
  readonly contents: Promise<File>;

  constructor(readonly ref: URL, contents: File) {
    super();
    this.contents = Promise.resolve(contents);
  }
}

async function* pipelinesBabelParse(
  fileContents: PipelinesIterable<FileSystemObject<string>>,
): AsyncGenerator<BabelParserFileObject> {
  for await (const file of fileContents) {
    const ast = parse(url.urlToFilePath(file.ref));
    yield new BabelParserFileObject(file.ref, ast);
  }
}

export default pipelinesBabelParse;
