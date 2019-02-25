/* eslint-disable @typescript-eslint/camelcase */
import { readCodeBlock } from '../../src';
import { safeLoad } from 'js-yaml';

jest
  .mock('mz/fs', () => ({
    readFile: async () => 'test',
  }))
  .mock('js-yaml', () => ({
    safeLoad: jest.fn(),
  }));

describe('readCodeBlock', () => {
  it('typescript', async () => {
    safeLoad.mockReturnValue({
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
    expect(await readCodeBlock('something.ts')).toBe('```typescript\ntest\n```\n');

    expect(await readCodeBlock('something.tsx')).toBe('```typescript\ntest\n```\n');

    expect(await readCodeBlock('something.js')).toBe('```\ntest\n```\n');

    expect(await readCodeBlock('something')).toBe('```\ntest\n```\n');
  });
});
