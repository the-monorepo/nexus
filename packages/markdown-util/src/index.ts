import { readFile } from 'mz/fs';
import { extname, join } from 'path';
import { safeLoad } from 'js-yaml';
/**
 * Map from extensions to language info
 */
let extMap = () => {
  const readLanguages = async () => {
    const languagesContents = await readFile(join(__dirname, 'languages.yml'));
    const languagesObject = safeLoad(languagesContents);
    // Create a map from an extension to an ace_mode
    return Object.keys(languagesObject).reduce((map, key) => {
      const language = languagesObject[key];
      if (language.extensions) {
        for (const ext of language.extensions) {
          if (!map.has(ext)) {
            map.set(ext, language);
          }
        }
      }
      return map;
    }, new Map());
  };
  const languagesPromise = readLanguages();
  extMap = () => languagesPromise;
  return languagesPromise;
};

async function extToCodeBlockTag(ext: string) {
  const map = await extMap();
  const tag = map.get(ext).ace_mode;
  return tag ? tag : '';
}

/**
 * Reads a file and outputs it as a code block in markdown
 */
export async function readCodeBlock(path: string): Promise<string> {
  const block = await readFile(path, 'utf8');
  const ext = extname(path);
  const blockNoTrailingLines = block.replace(/[\s\n]+$/, '');
  const tag = await extToCodeBlockTag(ext);
  return `\`\`\`${tag}\n${blockNoTrailingLines}\n\`\`\`\n`;
}
