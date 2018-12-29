import del from 'del';
import config from '@monorepo/config';

const clean = async () => {
  await del(config.buildArtifactGlobs);
};

export const description = 'Cleans up generated files';

export default clean;
