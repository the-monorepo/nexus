let baseWithTypeCheckPipes = async (stream) => {
  const gulpTypescript = await import('gulp-typescript');

  const tsProjectPromise = (async () => {
    const typescript = await import('typescript');
    const tsProject = await gulpTypescript.createProject('tsconfig.json', {
      typescript,
    });

    return tsProject;
  })();

  baseWithTypeCheckPipes = async (stream) => {
    const tsProject = await tsProjectPromise;
    return stream.pipe(tsProject(gulpTypescript.reporter.defaultReporter()));
  };

  return baseWithTypeCheckPipes(stream);
};

export const withTypeCheckPipes = (stream) => baseWithTypeCheckPipes(stream);
