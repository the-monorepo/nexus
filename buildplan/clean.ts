import del from 'del';
import config from '@monorepo/config';

const clean = async () => {
  await del(config.buildArtifactGlobs);
};

export default clean;
