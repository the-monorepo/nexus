/* eslint-disable @typescript-eslint/camelcase */
import { readCodeBlock } from '../../src';

jest.mock('js-yaml', () => {
  return {
    safeLoad: jest.fn(),
  };
});
jest.mock('mz/fs', () => {
  return {
    readFile: jest.fn(),
  };
});

describe('readCodeBlock', () => {
  it('typescript', async () => {
    const fs = require('mz/fs');
    fs.readFile.mockReturnValue(Promise.resolve('test'));
    const jsYaml = require('js-yaml');
    jsYaml.safeLoad.mockReturnValue({
      TypeScript: {
        type: 'programming',
        color: '#2b7489',
        aliases: ['ts'],
        interpreters: ['node'],
        extensions: ['.ts', '.tsx'],
        tm_scope: 'source.ts',
        ace_mode: 'typescript',
        codemirror_mode: 'javascript',
        codemirror_mime_type: 'application/typescript',
        language_id: 378,
      },
    });

    await expect(readCodeBlock('something.ts')).resolves.toBe(
      '```typescript\ntest\n```\n',
    );
  });
});
