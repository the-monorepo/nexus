import { withTypeCheckPipes } from './pipes/withTypeCheckPipes.ts';
import { packagesSrcCodeStagedStream } from './utils/path.ts';

const checkTypesStaged = async () => {
  return withTypeCheckPipes(await packagesSrcCodeStagedStream());
};

export default checkTypesStaged;
