import { spawn } from 'child_process';
import chalk from 'chalk';
import { simplePipeLogger } from '../utils/simplePipeLogger';

import logger from '../utils/logger';

import * as through2 from 'through2';

const runBiome = (
  filePath: string,
  content: string,
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'yarn',
      ['run', 'biome', 'check', '--write', '--stdin-file-path', filePath],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.stdin.write(content);
    child.stdin.end();
  });
};

const biomePipes = async (stream) => {
  const l = logger.child(chalk.magentaBright('biome'));

  return stream.pipe(simplePipeLogger(l)).pipe(
    through2.obj(async (file, enc, callback) => {
      try {
        const { stdout, stderr, exitCode } = await runBiome(
          file.path,
          file.contents.toString(),
        );

        if (stderr) {
          process.stderr.write(stderr);
        }

        // Only use the output if biome succeeded or partially succeeded (exit code 0 or 1)
        // Exit code 1 means there were lint warnings/errors but formatting still happened
        // Higher exit codes indicate failures (e.g., binary not found, invalid config)
        if (exitCode !== null && exitCode <= 1 && stdout) {
          file.contents = Buffer.from(stdout, 'utf8');
        } else if (exitCode !== null && exitCode > 1) {
          l.warn(
            `Biome exited with code ${exitCode} for ${file.path}, skipping formatting`,
          );
          if (stdout) {
            process.stderr.write(stdout);
          }
        }

        callback(undefined, file);
      } catch (error: unknown) {
        l.error(`Failed to format ${file.path}:`, error);
        callback(undefined, file);
      }
    }),
  );
};

export const formatPipes = async (stream) => {
  return await biomePipes(stream);
};
