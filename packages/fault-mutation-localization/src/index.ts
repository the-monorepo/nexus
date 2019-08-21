import { parse } from '@babel/parser';
import { File, AssignmentExpression, Expression, Statement } from '@babel/types';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import * as t from '@babel/types';
import { TesterResults } from '@fault/types';
import { readFile, writeFile, mkdtemp, unlink } from 'mz/fs';
import { createCoverageMap } from 'istanbul-lib-coverage'
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { ExpressionLocation, Coverage } from '@fault/istanbul-util';

import traverse from "@babel/traverse";


export const createAstCache = () => {
  const cache = new Map<string, File>();
  return {
    get: async (filePath: string, force: boolean = true): Promise<File> => {
      if (!force && cache.has(filePath)) {
        return cache.get(filePath)!;
      }

      const code = await readFile(filePath, 'utf8');
      const ast = parse(code);
      cache.set(filePath, ast);
      return ast;
    },
  };
};
type AstCache = ReturnType<typeof createAstCache>;

type Mutation = { 
  filePath: string,
  //ast: File
};

type MutationResults = {
  mutations: Mutation[]
};

const assignmentOperations = ['=', '!=', '&=', '^=', '<<=', '>>=', '-=', '+=', '/=', '*='];
const originalPathToCopyPath: Map<string, string> = new Map();
let copyFileId = 0;
let copyTempDir: string = null!;
const resetFile = async (filePath: string) => {
  const copyPath = originalPathToCopyPath.get(filePath)!;
  const fileContents = await readFile(copyPath, 'utf8');
  await writeFile(filePath, fileContents, 'utf8');
}

const createTempCopyOfFileIfItDoesntExist = async (filePath: string) => {
  if (!originalPathToCopyPath.has(filePath)) {
    const fileContents = await readFile(filePath, 'utf8');
    const fileId = copyFileId++;
    const copyPath = resolve(copyTempDir, fileId.toString());
    originalPathToCopyPath.set(filePath, copyPath);
    await writeFile(copyPath, fileContents);  
  }
};

const ASSIGNMENT = 'assignment';
const UNKNOWN = 'unknown';
type GenericMutationSite = {
  type: string,
  location: ExpressionLocation
}
interface UnknownMutationSite extends GenericMutationSite {
  type: typeof UNKNOWN,
  filePath: string,
  location: ExpressionLocation
}

interface AssignmentMutationSite extends GenericMutationSite {
  type: typeof ASSIGNMENT,
  operators: string[],
  filePath: string,
  location: ExpressionLocation
}

type Instruction = UnknownMutationSite | AssignmentMutationSite;

const findNodePathsWithLocation = (ast, location: ExpressionLocation) => {
  let nodePaths: any[] = [];
  traverse(ast, {
    enter(path) {
      const loc1 = location;
      const loc2 = path.node.location;
      if (
        loc1.start.column === loc2.start.column && loc1.start.line === loc2.start.line
          && loc1.end.column === loc2.end.column && loc1.end.line === loc2.end.line) {
            nodePaths.push(path);
          }
    }
  });
  return nodePaths;
}

const identifyUnknownInstruction = async (instruction: UnknownMutationSite, cache: AstCache): Promise<Instruction[]> => {
  const ast = await cache.get(instruction.filePath);
  const nodePaths = findNodePathsWithLocation(ast, instruction.location);
  const assignmentInstructions = nodePaths
    .filter(nodePath => t.isAssignmentExpression(nodePath.node))
    .map((nodePath): Instruction => ({
      type: ASSIGNMENT,
      operators: [...assignmentOperations].filter(operator => operator !== nodePath.node.operator),
      filePath: instruction.filePath,
      location: nodePath.node.loc
    }));

  return assignmentInstructions;
}

const processAssignmentInstruction = async (instruction: AssignmentMutationSite, cache: AstCache): Promise<MutationResults | null> => {
  const ast = await cache.get(instruction.filePath);
  
  const nodePaths = findNodePathsWithLocation(ast, instruction.location);
  if (nodePaths.length <= 0) {
    return null;
  }
  if (instruction.operators.length <= 0) {
    return null;
  }
  const operators = instruction.operators.pop();
  const nodePath =nodePaths[0];
  nodePath.node.operator = operators;
  return {
    mutations: [
      {
        filePath: instruction.filePath,
      }
    ]
  }
};

const processInstruction = async (instruction: Instruction, cache: AstCache): Promise<MutationResults | null> => {
  switch(instruction.type) {
    case ASSIGNMENT:
      return processAssignmentInstruction(instruction, cache);
    default:
      throw new Error(`Unknown instruction type: ${instruction.type}`);
  }
}

export const createPlugin = (): PartialTestHookOptions => {
  let previousMutationResults: MutationResults | null = null;
  const instructionQueue: Instruction[] = [];
  let firstRun = true;
  
  return {
    on: {
      start: async () => {
        // TODO: Types appear to be broken with mkdtemp
        copyTempDir = await (mkdtemp as any)(join(tmpdir(), copyTempDir));
      },
      allFilesFinished: async (tester: TesterResults) => {
        const cache = createAstCache();
        if (firstRun) {
          firstRun = false;
          const totalCoverage = createCoverageMap({});
          for (const testResult of tester.testResults.values()) {
            totalCoverage.merge(testResult.coverage);
          }

          for(const [coveragePath, fileCoverage] of Object.entries(totalCoverage as Coverage)) {
            for(const [key, statementCoverage] of Object.entries(fileCoverage.statementMap)) {
              instructionQueue.push({
                type: UNKNOWN,
                location: statementCoverage,
                filePath: coveragePath
              });
            }
          }
        }

        if (previousMutationResults !== null) {
          for(const mutation of previousMutationResults.mutations) {
            await resetFile(mutation.filePath);
          }
        }
        
        if (instructionQueue.length <= 0) {
          return;
        }
        
        let currentInstruction: Instruction = instructionQueue.pop();
        while (currentInstruction.type === UNKNOWN) {
          const identifiedInstructions = await identifyUnknownInstruction(currentInstruction, cache);
          instructionQueue.push(...identifiedInstructions);
          currentInstruction = instructionQueue.pop();
        }
        const instruction = instructionQueue.pop()!;
        const mutationResults = await processInstruction(instruction, cache);
        if (mutationResults !== null) {
          await Promise.all(mutationResults.mutations.map(
            mutation => createTempCopyOfFileIfItDoesntExist(mutation.filePath)
          ));  
        }
        previousMutationResults = mutationResults;
        return [...tester.testResults.values()];
      },
      complete: async () => {
        await Promise.all([...originalPathToCopyPath.values()].map(copyPath => unlink(copyPath)));
        await unlink(copyTempDir);
      }
    },
  }
};
