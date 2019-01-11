import { readFile } from 'mz/fs';

/**
 * Reads a file and outputs it as a code block in markdown
 */
export async function readCodeBlock(path: string): string {
  const block = await readFile(path, 'utf8');
  const blockNoTrailingLines = block.replace(/[\s\n]+$/, '');
  return `\`\`\`\n${blockNoTrailingLines}\n\`\`\`\n`;
}
