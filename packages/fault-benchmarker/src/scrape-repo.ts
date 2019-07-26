/**
 * This is a little utility tool for finding relevant pull requests faster.
 */
import 'source-map-support/register';
import fetch from 'node-fetch';
import logger from '@pshaw/logger';
import { consoleTransport } from 'build-pshaw-logger';
import { readFile } from 'mz/fs';
import { resolve } from 'path';
import chalk from 'chalk';

const log = logger().add(consoleTransport());

type FileNode = {
  path: string;
  additions: number;
  deletions: number;
}

type PullRequestEdge = {
  node: {
    title: string;
    url: string;
    mergeCommit: {
      commitUrl: string
    },
    additions: number,
    deletions: number,
    files: {
      totalCount: number,
      nodes: FileNode[]
    }
  }
}

type QueryPayload = {
  data: {
    repository: {
      pullRequests: {
        pageInfo: {
          hasNextPage: boolean,
          endCursor: string
        },
        edges: PullRequestEdge[]
      }
    }
  }
}

type CuratedPullRequest = {
  title: string;
  url: string;
  commitUrl: string | null
}

const run = async () => {
  if (process.argv.length <= 3) {
    log.error('Was expecting arguments of the format <owner> <repo-name>');
    return;
  }
  const token = await readFile('./scrape-repo.auth', 'utf8');
  const graphqlQuery = await readFile(resolve(__dirname, 'retrieve-merged-requests.graphql'), 'utf8');

  const owner = process.argv[2];
  const repoName = process.argv[3];

  const retrivePrs = async (after?): Promise<QueryPayload> => {
    const response = await fetch('https://api.github.com/graphql', {
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          owner,
          repoName,
          after
        }
      }),
      headers: {
        Authorization: `token ${token}`,
      },
      method: 'POST'
    });
    return await response.json();
  }


  // Much spice, such wow (it's just the list of PRs we might be interested in)
  const spicyPullRequests: CuratedPullRequest[] = [];
  let after: string | undefined = undefined;
  let data: QueryPayload = undefined as any;
  let prCount = 0;
  do {
    data = await retrivePrs(after);

    for(const pullRequest of data.data.repository.pullRequests.edges) {
      const logSkipMessage = (reason: string) => {
        log.info(`Skipping ${chalk.cyan(pullRequest.node.title)}. ${reason}`);
      }
      if (!pullRequest.node.title.match(/fix|bug/i)) {
        logSkipMessage("Title does not infer it's a bug fixing PR.");
        continue;
      }
      if (pullRequest.node.title.match(/\bdep(endenc(ie|y))?s?\b/i)) {
        logSkipMessage('PR appears to involve changing dependencies');
        continue;
      }
      const fileThreshold = 20;
      if (pullRequest.node.files.totalCount > fileThreshold) {
        logSkipMessage(`More than ${fileThreshold} files changed (${pullRequest.node.files.totalCount})`);
        continue;
      }
  
      const changeThreshold = 1000;
      const changeAmount = Math.abs(pullRequest.node.additions + pullRequest.node.deletions);
      if (changeAmount > changeThreshold) {
        logSkipMessage(`Additions - deletions was > 2000 (${changeAmount})`);
        continue;
      }
    
      const nonTestFiles = pullRequest.node.files.nodes.filter(file => !!file.path.match(/test.*\.([tj]sx?|flow)/i))
      const hasTests = nonTestFiles.length - pullRequest.node.files.nodes.length;
      if (!hasTests) {
        logSkipMessage('Could not find any tests changed in the PR');
        continue;
      }
  
      spicyPullRequests.push({
        title: pullRequest.node.title,
        url: pullRequest.node.url,
        commitUrl: pullRequest.node.mergeCommit ? pullRequest.node.mergeCommit.commitUrl : null
      });
      prCount++;
    }  
    after = data.data.repository.pullRequests.pageInfo.endCursor;
  } while(data.data.repository.pullRequests.pageInfo.hasNextPage)

  for(const pullRequestData of spicyPullRequests) {
    console.log(chalk.cyan(pullRequestData.title));
    console.log(chalk.greenBright(pullRequestData.url))
    console.log();
  }
  log.info(`Searched ${prCount} PRs`);
}

run().catch(console.error);