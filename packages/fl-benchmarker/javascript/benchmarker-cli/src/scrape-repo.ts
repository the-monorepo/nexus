// TODO: Maybe disable this rule for this package
/* eslint-disable no-console */

/**
 * This is a little utility tool for finding relevant pull requests faster.
 */
import 'source-map-support/register.js';
import fs from 'fs';
import { resolve } from 'path';

import chalk from 'chalk';
import spawn from 'cross-spawn';
import del from 'del';
import * as git from 'isomorphic-git';

import createLogger from '@pshaw/logger';

const { writeFile, appendFile, stat, readFile } = fs.promises;

git.plugins.set('fs', fs);

const log = createLogger();

type FileNode = {
  path: string;
  additions: number;
  deletions: number;
};

type PullRequestEdge = {
  node: {
    number: number;
    title: string;
    url: string;
    mergeCommit: {
      oid: string;
    };
    additions: number;
    deletions: number;
    files: {
      totalCount: number;
      nodes: FileNode[];
    };
  };
};

type QueryPayload = {
  data: {
    repository: {
      url: string;
      pullRequests: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string;
        };
        edges: PullRequestEdge[];
      };
    };
  };
};

type CuratedPullRequest = {
  number: number;
  title: string;
  url: string;
  oid: string | null;
};

const run = async () => {
  if (process.argv.length <= 3) {
    log.error('Was expecting arguments of the format <owner> <repo-name>');
    return;
  }
  const token = await readFile('./scrape-repo.auth', 'utf8');
  const graphqlQuery = await readFile(
    resolve(__dirname, 'retrieve-merged-requests.graphql'),
    'utf8',
  );

  const owner = process.argv[2];
  const repoName = process.argv[3];

  const retrievePrs = async (after?): Promise<QueryPayload> => {
    let data: any = null;
    do {
      const response = await fetch('https://api.github.com/graphql', {
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            owner,
            repoName,
            after,
          },
        }),
        headers: {
          Authorization: `token ${token}`,
        },
        method: 'POST',
      });

      data = await response.json();

      if (data.data != null) {
        return data;
      } else {
        log.warn(`Requesting PRs after ${after} responded with strange results...`);
        console.log(data);
      }
    } while (data !== null && data.data != null);
  };

  // Much spice, such wow (it's just the list of PRs we might be interested in)
  const spicyPullRequests: CuratedPullRequest[] = [];
  let after: string | undefined = undefined;
  let data: QueryPayload = undefined as any;
  let prCount = 0;
  do {
    data = await retrievePrs(after);
    console.log(data);

    for (const pullRequest of data.data.repository.pullRequests.edges) {
      prCount++;
      const logSkipMessage = (reason: string) => {
        log.info(`Skipping ${chalk.cyanBright(pullRequest.node.title)}. ${reason}`);
      };
      if (!pullRequest.node.title.match(/fix|bug/i)) {
        logSkipMessage("Title does not infer it's a bug fixing PR.");
        continue;
      }
      if (pullRequest.node.title.match(/\bdep(endenc(ie|y))?s?\b/i)) {
        logSkipMessage('PR appears to involve changing dependencies');
        continue;
      }
      if (pullRequest.node.title.match(/\b(typos?|spelling)\b/i)) {
        logSkipMessage('The PR appears to just fix typos');
        continue;
      }
      if (pullRequest.node.title.match(/\breadme\b/i)) {
        logSkipMessage('The PR appears to just fix documentation');
        continue;
      }
      const fileThreshold = 20;
      if (pullRequest.node.files.totalCount > fileThreshold) {
        logSkipMessage(
          `More than ${fileThreshold} files changed (${pullRequest.node.files.totalCount})`,
        );
        continue;
      }

      const testFiles = pullRequest.node.files.nodes.filter(
        (file) => !!file.path.match(/((\btest\b.*\.([tj]sx?|flow))|\binput\b|\bout\b)$/i),
      );
      if (testFiles.length <= 0) {
        logSkipMessage('Could not find any tests changed in the PR');
        continue;
      }

      const nonTestSourceFiles = pullRequest.node.files.nodes.filter(
        (file) =>
          !testFiles.some((testFile) => testFile.path === file.path) &&
          !!file.path.match(/\.([tj]sx?|flow)$/i),
      );
      if (nonTestSourceFiles.length <= 0) {
        logSkipMessage(
          'No non-test source code files appear to have changed in this PR.',
        );
        continue;
      }

      const sourceFileData = nonTestSourceFiles.reduce(
        (currentData, file) => {
          currentData.additions += file.additions;
          currentData.deletions += file.deletions;
          return currentData;
        },
        { additions: 0, deletions: 0 },
      );

      const additionsThreshold = 5;
      const deletionsThreshold = 5;
      if (sourceFileData.additions > additionsThreshold) {
        logSkipMessage(
          `Source code had ${sourceFileData.additions} (>${additionsThreshold}) additions`,
        );
        continue;
      }
      if (sourceFileData.deletions > deletionsThreshold) {
        logSkipMessage(
          `Source code had ${sourceFileData.deletions} (>${deletionsThreshold}) deletions`,
        );
        continue;
      }
      spicyPullRequests.push({
        number: pullRequest.node.number,
        title: pullRequest.node.title,
        url: pullRequest.node.url,
        oid: pullRequest.node.mergeCommit ? pullRequest.node.mergeCommit.oid : null,
      });
    }
    after = data.data.repository.pullRequests.pageInfo.endCursor;
  } while (data.data.repository.pullRequests.pageInfo.hasNextPage);

  const outputFilePath = `./scrape-repo/scrape-repo.${owner}.${repoName}.output`;
  await writeFile(outputFilePath, '', 'utf8');
  for (const pullRequestData of spicyPullRequests) {
    await appendFile(
      outputFilePath,
      `${pullRequestData.title}\n${pullRequestData.url}\n\n`,
    );
    console.log(chalk.cyanBright(pullRequestData.title));
    console.log(chalk.greenBright(pullRequestData.url));
    console.log();
  }
  log.info(`Searched ${prCount} PRs - ${spicyPullRequests.length} have potential`);

  const cloneablePrs = spicyPullRequests.filter((pr) => pr.oid != null);
  log.info(
    `${cloneablePrs.length} clonable out of ${spicyPullRequests.length} viable PRs (they couldn't be checked out)`,
  );
  for (const pr of cloneablePrs) {
    const cloneDir = resolve('./projects', `${repoName}-${pr.number}`);
    const alreadyExists = await (async () => {
      try {
        const pathStat = await stat(cloneDir);
        return pathStat.isDirectory();
      } catch (err) {
        return false;
      }
    })();
    if (alreadyExists) {
      log.info(`Skipping PR ${pr.number} since it already exists`);
      continue;
    }
    try {
      log.info(`Cloning PR ${pr.number}`);
      await git.clone({
        url: data.data.repository.url,
        dir: cloneDir,
        ref: pr.oid!,
      });
      const isYarn = await (async () => {
        try {
          const pathStat = await stat(resolve(cloneDir, 'yarn.lock'));
          return pathStat.isFile();
        } catch (err) {
          return false;
        }
      })();
      log.info(`Installing packages for PR ${pr.number}`);
      await new Promise((resolve, reject) => {
        const npmInstallProcess = spawn(isYarn ? 'yarn' : 'npm', ['install'], {
          cwd: cloneDir,
          stdio: 'inherit',
        });
        npmInstallProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error('Failed to install'));
          } else {
            resolve();
          }
        });
      });
      await del(resolve(cloneDir, '.git'));
    } catch (err) {
      log.error(`Failed to install for PR ${pr.number}`);
      log.error(err);
      await del(cloneDir);
    }
  }
};

run().catch(console.error);
