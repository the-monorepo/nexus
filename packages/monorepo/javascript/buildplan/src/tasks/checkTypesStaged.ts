import { packagesSrcCodeStagedStream } from './utils/path.ts';
import { withTypeCheckPipes } from './pipes/withTypeCheckPipes.ts';

const checkTypesStaged = async () => {
  return withTypeCheckPipes(await packagesSrcCodeStagedStream());
};

export default checkTypesStaged;
