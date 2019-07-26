/**
 * This is a little utility tool for finding relevant pull requests faster.
 */
import 'source-map-support/register';
import fetch from 'node-fetch';
import logger from '@pshaw/logger';
import { consoleTransport } from 'build-pshaw-logger';
import { readFile } from 'mz/fs';
import { resolve } from 'path';

const log = logger().add(consoleTransport());

type FileNode = {
  path: string;
  additions: number;
  deletions: number;
}

type PullRequestEdge = {
  cursor: string;
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
      nodes: FileNode
    }
  }
}

type QueryPayload = {
  data: {
    repository: {
      pullRequests: {
        edges: PullRequestEdge[]
      }
    }
  }
}

type CuratedPullRequest = {
  title: string;
  url: string;
  commitUrl: string
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

  const retrivePrs = async (): Promise<QueryPayload> => {
    const response = await fetch('https://api.github.com/graphql', {
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          owner,
          repoName,
        }
      }),
      headers: {
        Authorization: `token ${token}`,
      },
      method: 'POST'
    });
    return await response.json();
  }

  const data = retrivePrs();

  // Much spice, such wow (it's just the list of PRs we might be interested in)
  const spicyPullRequests: CuratedPullRequest[] = [];
}

run().catch(console.error);