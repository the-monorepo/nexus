import globby from 'globby';
import { fork } from 'child_process';
import { resolve } from 'path';
import { cpus } from 'os';

const runInSeperateProcesses = async (directories, processCount, absoluteImportPaths) => {
  await new Promise((resolve, reject) => {
    let processesStillRunning = processCount;
    for(let i = 0; i < processCount; i++) {

    }
    const forkForTest = (testPath) => {
      return fork(
        require.resolve('fl-addon-core'), 
        [
          'fl-addon-mocha',
          JSON.stringify([testPath]),
          JSON.stringify(absoluteImportPaths)
        ], 
        {
          env: {
            ...process.env,
            NODE_ENV: 'test',
          },
        }
      );
    }

    const runNextTest = () => {
      if (directories.length <= 0) {
        processesStillRunning--;
        if (processesStillRunning <= 0) {
          resolve();
        }
        return;
      }
      const testPath = directories.pop() as string;
      const testFork = forkForTest(testPath);

      testFork.on('exit', () => {
        runNextTest();
      });
    }

    for(let i = 0; i < processCount && directories.length > 0; i++) {
      runNextTest();
    }
  });
}

const runAndRecycleProcesses = async (directories, processCount, absoluteImportPaths) =>{
  const testsPerWorkerWithoutRemainder = Math.floor(directories.length / processCount);
  const remainders = directories.length % processCount;
  let i = 0;
  const forkForTest = (testPaths) => {
    const forkTest = fork(
      require.resolve('fl-addon-core'), 
      [
        'fl-addon-mocha',
        JSON.stringify(testPaths),
        JSON.stringify(absoluteImportPaths)
      ], 
      {
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      }
    );

    return new Promise((resolve, reject) => {
      forkTest.on('exit', () => {
        resolve();
      })
    });
  }

  let forkPromises: any[] = [];
  while(i < remainders) {
    const testPaths = directories.splice(0, testsPerWorkerWithoutRemainder + 1);
    forkPromises[i] = forkForTest(testPaths);
    i++;
  }
  if (testsPerWorkerWithoutRemainder > 0) {
    while(i < processCount) {
      const testPaths = directories.splice(0, testsPerWorkerWithoutRemainder);
      forkPromises[i] = forkForTest(testPaths);  
      i++;
    }   
  }

  await Promise.all(forkPromises);
}

export const run = async () => {
  const directories = await globby(
    [
      './{packages,build-packages,test}/**/*.test.{js,jsx,ts,tsx}',
      '!./**/node_modules/**',
      '!./coverage',
      '!./{packages,build-packages}/*/{dist,lib,esm}/**/*',
    ],
    { onlyFiles: true },
  );
  directories.reverse();
  
  const processIsolation = false;
  const importPaths = ['./test/require/babel.js', './test/helpers/globals.js'];
  const absoluteImportPaths = importPaths.map((path) => resolve(path));

  const processCount = cpus().length;

  if(processIsolation) {
    await runInSeperateProcesses(directories, processCount, absoluteImportPaths);
  } else {
    await runAndRecycleProcesses(directories, processCount, absoluteImportPaths);
  }
};

export default run;
run();
