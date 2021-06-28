import { readFile, writeFile } from 'fs/promises';

type ParseParams = Parameters<typeof JSON.parse>;
type StringifyParams = Parameters<typeof JSON.stringify>;
type WriteFileParams = Parameters<typeof writeFile>;
type ReadFileParams = Parameters<typeof readFile>;

export const readJson = async (
  filePath: ReadFileParams[0],
  reviver?: ParseParams[1],
  options?: Omit<ReadFileParams[1], 'encoding'>,
) => {
  const text = await readFile(filePath, {
    ...options,
    encoding: 'utf8',
  });

  const json = JSON.parse(text, reviver);

  return json;
};

export const writeJson = async (
  filePath: WriteFileParams[0],
  json: StringifyParams[0],
  replacer?: StringifyParams[1],
  space?: StringifyParams[2],
  fsOptions?: Omit<WriteFileParams[1], 'encoding'>,
) => {
  const text = JSON.stringify(json, replacer, space);
  return await writeFile(filePath, text, { ...fsOptions, encoding: 'utf8' });
};
