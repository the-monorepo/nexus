/* eslint-disable @typescript-eslint/camelcase */
import { mock, stub } from 'sinon';
import { readCodeBlock } from '../../src';
import { safeLoad } from 'js-yaml';

mock({
  readFile: async () => 'test'
}, 'mz/fs');
mock({
  safeLoad: stub()
}, 'js-yaml');

describe('readCodeBlock', () => {
  it('typescript', async () => {
    safeLoad.returns({
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
    expect(await readCodeBlock('something.ts')).to.be('```typescript\ntest\n```\n');

    expect(await readCodeBlock('something.tsx')).to.be('```typescript\ntest\n```\n');

    expect(await readCodeBlock('something.js')).to.be('```\ntest\n```\n');

    expect(await readCodeBlock('something')).to.be('```\ntest\n```\n');
  });
});
