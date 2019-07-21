import { join } from 'path';
require('@babel/register')({
  ignore: [/node_modules/],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  cwd: join(__dirname, '../../..')
});
