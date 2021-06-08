import { readFile } from 'fs/promises';
import { extname } from 'path';

import languagesObject from './languages.js';
/**
 * Map from extensions to language info
 */
const extMap = new Map();
for (const language of Object.values(languagesObject)) {
  if (language.extensions !== undefined) {
    for (const ext of language.extensions) {
      if (!extMap.has(ext)) {
        extMap.set(ext, language);
      }
    }
  }
}

async function extToCodeBlockTag(ext: string) {
  const languageInfo = extMap.get(ext);
  const tag = languageInfo ? languageInfo.ace_mode : null;
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
