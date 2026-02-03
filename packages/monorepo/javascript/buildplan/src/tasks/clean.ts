import config from '@monorepo/config';
import del from 'del';

const clean = async () => {
  await del(config.buildArtifactGlobs);
};

export const description = 'Cleans up generated files';

export default clean;
