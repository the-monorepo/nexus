import { resolve, relative, isAbsolute } from 'path';
const projectDir = resolve('.');

const isSubDir = (projectDir: string, dir: string) => {
  const relativePath = relative(projectDir, dir);
  return relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath);
};

require('@babel/register')({
  ignore: [
    /node_modules/,
    (filePath: string) => {
      const result = !isSubDir(projectDir, filePath);
      return result;
    },
  ],
  configFile: resolve(__dirname, 'babel.config.js'),
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});
