import config from '@monorepo/config';
import { packagesSrcCodeStream } from './utils/path.ts';
import { withTypeCheckPipes } from './pipes/withTypeCheckPipes.ts';

export const description = `Runs the TypeScript type checker on the codebase, displaying the output. This will display any
serious errors in the code, such as invalid syntax or the use of incorrect types.`;

const checkTypes = async () => {
  return withTypeCheckPipes(
    packagesSrcCodeStream([
      ...config.buildableSourceCodeGlobs,
      ...config.buildableIgnoreGlobs.map((glob) => `!${glob}`),
    ]),
  );
};
checkTypes.description = description;

export default checkTypes;
