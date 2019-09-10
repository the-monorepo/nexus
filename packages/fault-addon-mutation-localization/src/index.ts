import { parse, ParserOptions } from '@babel/parser';
import { File, AssignmentExpression, Expression, BaseNode, Statement } from '@babel/types';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import * as t from '@babel/types';
import { TesterResults, TestResult, FailingTestData, FinalTesterResults } from '@fault/types';
import { readFile, writeFile, mkdtemp, unlink, rmdir } from 'mz/fs';
import { createCoverageMap } from 'istanbul-lib-coverage';
import { join, resolve, basename } from 'path';
import { tmpdir } from 'os';
import { ExpressionLocation, Coverage } from '@fault/istanbul-util';
import ErrorStackParser from 'error-stack-parser';
import { reportFaults, Fault, ScorelessFault, recordFaults } from '@fault/record-faults';
import generate from '@babel/generator';
import chalk from 'chalk';
import * as micromatch from 'micromatch';
import Heap from '@pshaw/binary-heap';
import traverse from '@babel/traverse';

export const createAstCache = (babelOptions?: ParserOptions) => {
  const cache = new Map<string, File>();
  return {
    get: async (filePath: string, force: boolean = false): Promise<File> => {
      if (!force && cache.has(filePath)) {
        return cache.get(filePath)!;
      }

      const code = await readFile(filePath, 'utf8');
      const ast = parse(code, babelOptions);
      cache.set(filePath, ast);
      return ast;
    },
  };
};
type AstCache = ReturnType<typeof createAstCache>;

type LocationObject = {
  [filePath: string]: ExpressionLocation[]
};

type MutationResults = {
  locations: LocationObject
};

const assignmentOperations = [
  '!=',
  '&=',
  '^=',
  '<<=',
  '>>=',
  '/=',
  '*=',
  '-=',
  '+=',
  '=',
];
const originalPathToCopyPath: Map<string, string> = new Map();
let copyFileId = 0;
let copyTempDir: string = null!;
const resetFile = async (filePath: string) => {
  const copyPath = originalPathToCopyPath.get(filePath)!;
  const fileContents = await readFile(copyPath, 'utf8');
  await writeFile(filePath, fileContents, 'utf8');
};

const createTempCopyOfFileIfItDoesntExist = async (filePath: string) => {
  if (!originalPathToCopyPath.has(filePath)) {
    const fileContents = await readFile(filePath, 'utf8');
    const fileId = copyFileId++;
    const copyPath = resolve(copyTempDir, fileId.toString());
    originalPathToCopyPath.set(filePath, copyPath);
    await writeFile(copyPath, fileContents);
  }
};

const DELETE_STATEMENT = 'delete-statement';
const ASSIGNMENT = 'assignment';

type GenericInstruction = {
  //indirect: IndirectInfo[],
  mutationEvaluations: MutationEvaluation[],
  derivedFromPassingTest: boolean
};


/**
 * From least desirable to be processed to most
 */
const compareInstructions = (a: Instruction, b: Instruction) => {
  // TODO: The most important instructions should be ones that have huge potential to be a fix (E.g. Only improves tests, nothing else)
  if (a.derivedFromPassingTest && !b.derivedFromPassingTest) {
    return -1;
  } else if(!a.derivedFromPassingTest && b.derivedFromPassingTest) {
    return 1;
  } else if(a.type === DELETE_STATEMENT && b.type !== DELETE_STATEMENT) {
    return 1;
  } else if(a.type !== DELETE_STATEMENT && b.type === DELETE_STATEMENT) {
    return -1;
  }
  a.mutationEvaluations.sort(compareMutationEvaluations);
  b.mutationEvaluations.sort(compareMutationEvaluations);
  let aI = a.mutationEvaluations.length - 1;
  let bI = b.mutationEvaluations.length - 1;
  while(aI >= 0 && bI >= 0) {
    const aMutationEvaluation = a.mutationEvaluations[aI];
    const bMutationEvaluation = b.mutationEvaluations[bI];
    const comparison = compareMutationEvaluations(aMutationEvaluation, bMutationEvaluation);
    if (comparison !== 0) {
      return comparison;
    }
    aI--;
    bI--;
  }
  if (a.mutationEvaluations.length < b.mutationEvaluations.length) {
    return 1;
  } else if (a.mutationEvaluations.length > b.mutationEvaluations.length) {
    return -1;
  }
  return 0;
};

type Location = {
  location: ExpressionLocation;
  filePath: string;
}

type GenericMutationSite = {
  type: string;
} & GenericInstruction & Location;

type AssignmentMutationSite = {
  type: typeof ASSIGNMENT;
  operators: string[];
} & GenericMutationSite;

type StatementInformation = {
  index: number,
  location: ExpressionLocation | null
}
type DeleteStatementMutationSite = {
  type: typeof DELETE_STATEMENT,
  statements: StatementInformation[],
} & GenericMutationSite;

type Instruction = AssignmentMutationSite | DeleteStatementMutationSite;

const findNodePathsWithLocation = (ast, location: ExpressionLocation) => {
  let nodePaths: any[] = [];
  traverse(ast, {
    enter(path) {
      const loc1 = location;
      const loc2 = path.node.loc!;
      if (
        loc1.start.column === loc2.start.column &&
        loc1.start.line === loc2.start.line &&
        loc1.end.column === loc2.end.column &&
        loc1.end.line === loc2.end.line
      ) {
        nodePaths.push(path);
      }
    },
  });
  return nodePaths;
};

const getParentScope = (path) => {
  const parentPath = path.parentPath;
  if (parentPath) {
    return path;
  }
  const parentNode = parentPath.node;
  if (t.isFunction(parentNode) || t.isProgram(parentNode)) {
    return path;
  }
  return getParentScope(parentPath);
}

const expressionKey = (filePath: string, node: BaseNode) => `${filePath}:${node.loc!.start.line}:${node.loc!.start.column}:${node.loc!.end.line}:${node.loc!.end.column}:${node.type}`;

const assertFoundNodePaths = (nodePaths: any[]) => {
  if (nodePaths.length <= 0) {
    throw new Error(`Expected to find a node at location ${locationToKey(instruction.filePath, instruction.location)} but didn't`);
  }
};

async function* identifyUnknownInstruction(
  instruction: Location,
  cache: AstCache,
  expressionsSeen: Set<string>,
  derivedFromPassingTest: boolean
): AsyncIterableIterator<Instruction> {
  const ast = await cache.get(instruction.filePath);
  
  const nodePaths = findNodePathsWithLocation(ast, instruction.location);
  //console.log(nodePaths);
  const filePath = instruction.filePath;
  for(const nodePath of nodePaths) {
    const newInstructions: any[] = [];
    const scopedPath = getParentScope(nodePath);


    traverse(scopedPath.node, {
      enter: (path) => {
        const pathNode = path.node;
        
        const location = pathNode.loc;
        if (location === null) {
          return;
        }
        
        const key = expressionKey(filePath, pathNode);
        if (expressionsSeen.has(key)) {
          return;
        }
        expressionsSeen.add(key);
        if (t.isAssignmentExpression(pathNode)) {
          const assignmentInstruction: AssignmentMutationSite = {
            type: ASSIGNMENT,
            operators: [...assignmentOperations].filter(
              operator => operator !== pathNode.operator,
            ),
            derivedFromPassingTest,
            mutationEvaluations: [],
            filePath,
            location,
          };
          newInstructions.push(assignmentInstruction);
        } else if(t.isBlockStatement(pathNode)) {
          const deleteStatements: StatementInformation[] = pathNode.body
            .map((statement, i): StatementInformation => ({
              index: i,
              location: statement.loc
            })) as StatementInformation[];
          const deleteStatementInstruction: DeleteStatementMutationSite = {
            type: DELETE_STATEMENT,
            statements: deleteStatements,
            derivedFromPassingTest,
            mutationEvaluations: [],
            location,
            filePath
          };
          newInstructions.push(deleteStatementInstruction);
        }    
      }
    }, scopedPath.scope);

    yield* newInstructions;
  }
};

const processAssignmentInstruction = async (
  instruction: AssignmentMutationSite,
  cache: AstCache,
  client: Client
) => {
  const ast = await cache.get(instruction.filePath);

  const nodePaths = findNodePathsWithLocation(ast, instruction.location).filter(nodePath => t.isAssignmentExpression(nodePath));
  assertFoundNodePaths(nodePaths);

  const operator = instruction.operators.pop();
  const nodePath = nodePaths[0];
  console.log('changing', nodePath.node.operator, operator);
  nodePath.node.operator = operator;

  if (instruction.operators.length <= 0) {
    return;
  }

  client.addInstruction(instruction);
};

const processBlockInstruction = async (
  instruction: DeleteStatementMutationSite,
  cache: AstCache,
  client: Client
) => {
  const ast = await cache.get(instruction.filePath);
  
  const nodePaths = findNodePathsWithLocation(ast, instruction.location).filter(thePath => t.isBlockStatement(thePath.node));
  assertFoundNodePaths(nodePaths);

  // TODO: Pretty sure you'll only ever get 1 node path but should probably check to make sure
  const nodePath = nodePaths.pop()!;

  for(let s = instruction.statements.length - 1; s >= 0; s--) {
    const statementInformation = instruction.statements[s];
    nodePath.node.body.splice(statementInformation.index, 1);
  }
};

type Client = {
  addInstruction(instruction: Instruction);
}
const processInstruction = async (
  instruction: Instruction,
  cache: AstCache,
  client: Client
) => {
  switch (instruction.type) {
    case ASSIGNMENT:
      return processAssignmentInstruction(instruction, cache, client);
    case DELETE_STATEMENT:
      return processBlockInstruction(instruction, cache, client);
    default:
      throw new Error(`Unknown instruction type: ${(instruction as any).type}`);
  }
};

export type TestEvaluation = {
  // Whether the exception that was thrown in the test has changed
  errorChanged: boolean | null;
  // How much better we're doing in terms of whether the test failed/passed
  endResultImprovement: number;
  previouslyFailing: boolean,
} & StackEvaluation;

type StackEvaluation = {
  stackColumnScore: number | null;
  stackLineScore: number | null;
};

const nothingChangedMutationStackEvaluation = (e: MutationStackEvaluation) => {
  return e.columnDegradationScore === 0 && e.columnImprovementScore === 0 && e.lineDegradationScore === 0 && e.lineImprovementScore === 0;
};

/**
 * From worst evaluation to best evaluation
 */
export const compareMutationEvaluations = (
  result1: MutationEvaluation,
  result2: MutationEvaluation,
) => {
  const testsWorsened = result2.testsWorsened - result1.testsWorsened;
  if (testsWorsened !== 0) {
    return testsWorsened;
  }

  const testsImproved = result1.testsImproved - result2.testsImproved;
  if (testsImproved !== 0) {
    return testsImproved;
  }

  const stackEval1 = result1.stackEvaluation;
  const stackEval2 = result2.stackEvaluation;

  const lineDegradationScore =
  stackEval2.lineDegradationScore - stackEval1.lineDegradationScore;
  if (lineDegradationScore !== 0) {
    return lineDegradationScore;
  }

  const columnDegradationScore =
    stackEval2.columnDegradationScore - stackEval1.columnDegradationScore;
  if (columnDegradationScore !== 0) {
    return columnDegradationScore;
  }

  const lineImprovementScore =
    stackEval1.lineImprovementScore - stackEval2.lineImprovementScore;
  if (lineImprovementScore !== 0) {
    return lineImprovementScore;
  }

  const columnImprovementScore =
    stackEval1.columnImprovementScore - stackEval2.columnImprovementScore;
  if (columnImprovementScore !== 0) {
    return columnImprovementScore;
  }

  const errorsChanged = result1.errorsChanged - result2.errorsChanged;
  if (errorsChanged !== 0) {
    return errorsChanged;
  }

  const lineScoreNulls = stackEval1.lineScoreNulls - stackEval2.lineScoreNulls;
  if (lineScoreNulls !== 0) {
    return lineScoreNulls;
  }

  const columnScoreNulls = stackEval1.columnScoreNulls - stackEval2.columnScoreNulls;
  if (columnScoreNulls !== 0) {
    return columnScoreNulls;
  }

  return 0;
};

export const evaluateStackDifference = (
  originalResult: TestResult,
  newResult: TestResult,
): StackEvaluation => {
  if (newResult.stack == null || originalResult.stack == null) {
    return {
      stackColumnScore: null,
      stackLineScore: null,
    };
  }
  const newStackInfo = ErrorStackParser.parse({ stack: newResult.stack });
  const oldStackInfo = ErrorStackParser.parse({ stack: originalResult.stack });

  const firstNewStackFrame = newStackInfo[0];
  const firstOldStackFrame = oldStackInfo[0];

  if (firstNewStackFrame.fileName !== firstOldStackFrame.fileName) {
    return {
      stackColumnScore: null,
      stackLineScore: null,
    };
  }
  const stackLineScore =
    firstNewStackFrame.lineNumber !== undefined &&
    firstOldStackFrame.lineNumber !== undefined
      ? firstNewStackFrame.lineNumber - firstOldStackFrame.lineNumber
      : null;
  const stackColumnScore =
    firstNewStackFrame.columnNumber !== undefined &&
    firstOldStackFrame.columnNumber !== undefined
      ? firstNewStackFrame.columnNumber - firstOldStackFrame.columnNumber
      : null;

  return { stackColumnScore, stackLineScore };
};

const EndResult = {
  BETTER: 1,
  UNCHANGED: 0,
  WORSE: -1,
};

export const evaluateModifiedTestResult = (
  originalResult: TestResult,
  newResult: TestResult,
): TestEvaluation => {
  const samePassFailResult = originalResult.passed === newResult.passed;
  const endResultImprovement: number = samePassFailResult
    ? EndResult.UNCHANGED
    : newResult.passed
    ? EndResult.BETTER
    : EndResult.WORSE;
  const errorChanged: boolean | null = (() => {
    if (!samePassFailResult) {
      return null;
    }
    if (newResult.passed) {
      return false;
    }
    return newResult.stack !== (originalResult as FailingTestData).stack;
  })();
  const stackEvaluation = evaluateStackDifference(originalResult, newResult);

  return {
    endResultImprovement,
    errorChanged,
    previouslyFailing: !originalResult.passed,
    ...stackEvaluation,
  };
};

type MutationStackEvaluation = {
  lineDegradationScore: number;
  columnDegradationScore: number;
  lineScoreNulls: number;
  columnScoreNulls: number;
  lineImprovementScore: number;
  columnImprovementScore: number;
}
const createMutationStackEvaluation = (): MutationStackEvaluation => ({
  lineDegradationScore: 0,
  columnDegradationScore: 0,
  lineScoreNulls: 0,
  columnScoreNulls: 0,
  lineImprovementScore: 0,
  columnImprovementScore: 0
});

type MutationEvaluation = {
  // TODO: This creates a circular reference. Should seperate the mutation evaluations from the instruction
  instruction: Instruction;
  stackEvaluation: MutationStackEvaluation,
  testsWorsened: number;
  testsImproved: number;
  errorsChanged: number;
};

const evaluateNewMutation = (
  originalResults: TesterResults,
  newResults: TesterResults,
  instruction: Instruction,
): MutationEvaluation => {
  const notSeen = new Set(originalResults.testResults.keys());
  let testsWorsened = 0;
  let testsImproved = 0;
  let stackEvaluation: MutationStackEvaluation = createMutationStackEvaluation();
  let errorsChanged = 0;

  for (const [key, newResult] of newResults.testResults) {
    if (!notSeen.has(key)) {
      // Maybe don't
      continue;
    }
    notSeen.delete(key);
    const oldResult = originalResults.testResults.get(key);
    if (oldResult === undefined) {
      // Maybe don't
      continue;
    }
    const testEvaluation = evaluateModifiedTestResult(oldResult, newResult);

    // End result scores
    if (testEvaluation.endResultImprovement === EndResult.BETTER) {
      testsImproved++;
    } else if (testEvaluation.endResultImprovement === EndResult.WORSE) {
      testsWorsened++;
    } else if (testEvaluation.errorChanged && testEvaluation.stackLineScore === 0 && testEvaluation.stackColumnScore === 0) {
      errorsChanged++;
    }

    if (testEvaluation.stackLineScore === null) {
      stackEvaluation.lineScoreNulls++;
    } else if (testEvaluation.stackLineScore > 0) {
      stackEvaluation.lineImprovementScore += testEvaluation.stackLineScore;
    } else if (testEvaluation.stackLineScore < 0) {
      stackEvaluation.lineDegradationScore -= testEvaluation.stackLineScore;
    } else if (testEvaluation.stackColumnScore === null) {
      stackEvaluation.columnScoreNulls++;
    } else if (testEvaluation.stackColumnScore > 0) {
      stackEvaluation.columnImprovementScore += testEvaluation.stackColumnScore;
    } else if (testEvaluation.stackColumnScore < 0) {
      stackEvaluation.columnDegradationScore -= testEvaluation.stackColumnScore;
    }
  }
  return {
    instruction,
    testsWorsened,
    testsImproved,
    stackEvaluation,
    errorsChanged,
  };
};

const locationToKey = (filePath: string, location: ExpressionLocation) => {
  return `${filePath}:${location.start.line}:${location.start.column}`;
};

export const mutationEvalatuationMapToFaults = (
  evaluations: MutationEvaluation[],
): Fault[] => {
  const sortedEvaluationsLists = evaluations.sort(compareMutationEvaluations).reverse();
  const seen: Set<string> = new Set();
  const faults: ScorelessFault[] = [];
  for (const evaluation of sortedEvaluationsLists) {
    const mutationResults = extractMutationResults(evaluation.instruction);
    for(const [filePath, expressionLocations] of Object.entries(mutationResults.locations)) {
      for(const expressionLocation of expressionLocations) {
        const key = locationToKey(filePath, expressionLocation);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        faults.push({
          sourcePath: filePath,
          location: expressionLocation,
        });
      }
    }
  }

  return faults.map((fault, i) => ({
    ...fault,
    score: faults.length - i
  }));
};

type IsFinishedFunction = (instruction: Instruction, finishData: MiscFinishData) => boolean;
export type PluginOptions = {
  faultFilePath?: string,
  babelOptions?: ParserOptions,
  ignoreGlob?: string[] | string,
  onMutation?: (mutatatedFiles: string[]) => any,
  isFinishedFn?: IsFinishedFunction,
  mapToIstanbul?: boolean
};

type DefaultIsFinishedOptions = {
  mutationThreshold?: number,
  durationThreshold?: number,
  finishOnPassDerviedNonFunctionInstructions?: boolean,
}

type MiscFinishData = {
  mutationCount: number,
  testerResults: TesterResults
}


export const createDefaultIsFinishedFn = ({
  mutationThreshold,
  durationThreshold,
  finishOnPassDerviedNonFunctionInstructions = true
}: DefaultIsFinishedOptions = {}): IsFinishedFunction => {
  const isFinishedFn: IsFinishedFunction = (instruction: Instruction, finishData: MiscFinishData): boolean => {
    if (durationThreshold !== undefined && finishData.testerResults.duration >= durationThreshold) {
      console.log('a');
      return true;
    }

    if(mutationThreshold !== undefined && finishData.mutationCount >= mutationThreshold) {
      console.log('b');
      return true;
    }

    if (finishOnPassDerviedNonFunctionInstructions && instruction.derivedFromPassingTest && instruction.type !== DELETE_STATEMENT) {
      console.log('c');
      return true;
    }

    if (instruction.mutationEvaluations.length > 0 && !instruction.mutationEvaluations.some(evaluation => {
      console.log('d');
      const stackEval = evaluation.stackEvaluation;
      const improved = 
        evaluation.testsImproved > 0 
        || evaluation.errorsChanged > 0 
        || stackEval.lineImprovementScore > 0
        || stackEval.columnImprovementScore > 0;
      const nothingChanged = evaluation.errorsChanged === 0 
        && evaluation.testsImproved === 0
        && evaluation.testsWorsened === 0
        && nothingChangedMutationStackEvaluation(evaluation.stackEvaluation);
      return improved || (nothingChanged && instruction.derivedFromPassingTest);
    })) {
      return true;
    }

    return false;
  };
  return isFinishedFn;
}

export const mapFaultsToIstanbulCoverage = (faults: Fault[], coverage: Coverage): Fault[] => {
  // TODO: Could make this more efficient
  const mappedFaults: Map<string, Fault> = new Map();
  const replace = (fault: Fault, location: ExpressionLocation) => {
    const key = locationToKey(fault.sourcePath, location);
    if (mappedFaults.has(key)) {
      const previousFault = mappedFaults.get(key)!;
      if (previousFault.score! > fault.score!) {
        return;
      }
    }
    mappedFaults.set(key, {
      score: fault.score,
      sourcePath: fault.sourcePath,
      location,
    });
  };

  for (const fault of faults) {
    const fileCoverage = coverage[fault.sourcePath];
    if (fileCoverage === undefined) {
      replace(fault, fault.location);
      continue;
    }
    
    let mostRelevantStatement: ExpressionLocation | null = null;
    const loc = fault.location;
    for(const statement of Object.values(fileCoverage.statementMap)) {
      // If the start of the fault is within the bounds of the statement and the statement is smaller than the previously mapped statement, then map it
      if (statement.start.line >= loc.start.line && statement.end.line <= loc.start.line && statement.end.line >= loc.start.line && statement.end.column >= loc.start.column) {
        if (mostRelevantStatement === null) {
          mostRelevantStatement = statement;
        } else {
          const originalLineLength = statement.end.line - statement.start.line;
          const otherLineLength = loc.end.line - loc.start.line;
          const originalColumnLength = statement.end.column - statement.start.column;
          const otherColumnLength = loc.end.column - loc.start.column;
          if (originalLineLength > otherLineLength || (originalLineLength === otherLineLength && originalColumnLength > otherColumnLength)) {
            mostRelevantStatement = statement;
          }
        }
      }
    }

    if (mostRelevantStatement !== null) {
      replace(fault, mostRelevantStatement);
    }
  }
  return [...mappedFaults.values()];
}

const extractMutationResults = (instruction: Instruction): MutationResults => {
  switch(instruction.type) {
    case DELETE_STATEMENT:
      return {
        locations: {
          [instruction.filePath]: instruction.statements.map(
            ({ location }): ExpressionLocation | null => location
          ).filter(location => location !== null) as ExpressionLocation[]
        }
      };
    case ASSIGNMENT:
      return {
        locations: {
          [instruction.filePath]: [instruction.location]
        }
      };
    default:
      throw new Error(`Unknown instruction type ${(instruction as any).type}`);
  };
};

async function* addNewInstructions(evaluation: MutationEvaluation) {
  switch(evaluation.instruction.type) {
    case DELETE_STATEMENT: {
      if (evaluation.testsImproved > 0 || evaluation.errorsChanged || !nothingChangedMutationStackEvaluation(evaluation.stackEvaluation) && evaluation.instruction.statements.length > 1) {
        const location = evaluation.instruction.location;
        const originalStatements = evaluation.instruction.statements;
        const middle = Math.trunc(evaluation.instruction.statements.length / 2);
        const statements1 = originalStatements.slice(middle);
        const statements2 = originalStatements.slice(0, middle);
        
        const instruction1: DeleteStatementMutationSite = {
          type: DELETE_STATEMENT,
          mutationEvaluations: [],
          statements: statements1, 
          derivedFromPassingTest: evaluation.instruction.derivedFromPassingTest,
          filePath: evaluation.instruction.filePath,
          location
        };
        const instruction2: DeleteStatementMutationSite = {
          type: DELETE_STATEMENT,
          mutationEvaluations: [],
          statements: statements2,
          derivedFromPassingTest: evaluation.instruction.derivedFromPassingTest,
          filePath: evaluation.instruction.filePath,
          location
        };

        yield instruction1;
        yield instruction2;
      }
      break;
    }
  }
}

export const createPlugin = ({
  faultFilePath = './faults/faults.json',
  babelOptions,
  ignoreGlob = [],
  onMutation = () => {},
  isFinishedFn = createDefaultIsFinishedFn(),
  mapToIstanbul = false
}: PluginOptions): PartialTestHookOptions => {
  let previousInstruction: Instruction | null = null;
  const instructionQueue: Heap<Instruction> = new Heap((a, b) => -compareInstructions(a, b));
  let firstRun = true;  
  let firstTesterResults: TesterResults;
  const evaluations: MutationEvaluation[] = [];
  const expressionsSeen: Set<string> = new Set();
  let mutationCount = 0;
  const resolvedIgnoreGlob = (Array.isArray(ignoreGlob) ? ignoreGlob : [ignoreGlob]).map(glob =>
    resolve('.', glob).replace(/\\+/g, '/'),
  );

  const client: Client = {
    addInstruction: (instruction: Instruction) => {
      instructionQueue.push(instruction);
    }
  };
  return {
    on: {
      start: async () => {
        // TODO: Types appear to be broken with mkdtemp
        copyTempDir = await (mkdtemp as any)(join(tmpdir(), 'fault-addon-mutation-localization-'));
      },
      allFilesFinished: async (tester: TesterResults) => {
        console.log('finished all files')
        const cache = createAstCache(babelOptions);
        if (firstRun) {
          firstTesterResults = tester;
          firstRun = false;
          const failedCoverageMap = createCoverageMap({});
          for (const testResult of tester.testResults.values()) {
            // TODO: Maybe don't?
            if (!testResult.passed) {
              failedCoverageMap.merge(testResult.coverage);
            }
          }
          const failedCoverage: Coverage = failedCoverageMap.data;
          for(const [coveragePath, fileCoverage] of Object.entries(failedCoverage)) {
            console.log('failing', coveragePath, micromatch.isMatch(coveragePath, resolvedIgnoreGlob));
            if (micromatch.isMatch(coveragePath, resolvedIgnoreGlob)) {
              continue;
            }
            for(const statementCoverage of Object.values(fileCoverage.statementMap)) {
              for await (const instruction of identifyUnknownInstruction({
                location: statementCoverage,
                filePath: coveragePath,
              }, cache, expressionsSeen, false)) {
                instructionQueue.push(instruction);
              }
            }
          }
        } else if (previousInstruction !== null) {
          const mutationEvaluation = evaluateNewMutation(
            firstTesterResults,
            tester,
            previousInstruction,
          );
          const previousMutationResults = extractMutationResults(previousInstruction);

          // Revert all mutated files
          await Promise.all(Object.keys(previousMutationResults.locations).map(
            filePath => resetFile(filePath)
          ));

          console.log(locationToKey(previousInstruction.filePath, previousInstruction.location), previousInstruction.type, { ...mutationEvaluation, mutations: undefined });

          previousInstruction.mutationEvaluations.push(mutationEvaluation);
          if (instructionQueue.has(previousInstruction)) {
            instructionQueue.update(previousInstruction);
          }

          for await(const newInstruction of addNewInstructions(mutationEvaluation)) {
            instructionQueue.push(newInstruction);
          }
          evaluations.push(mutationEvaluation);
        }


        console.log([...instructionQueue].some(instruction => !instruction.derivedFromPassingTest));

        if (instructionQueue.length <= 0) {
          // Avoids evaluation the same instruction twice if another addon requires a rerun of tests
          previousInstruction = null;
          return;
        }

        const instruction = instructionQueue.pop()!;

        console.log('processing')
        
        await processInstruction(instruction, cache, client);

        if (isFinishedFn(instruction, { mutationCount, testerResults: tester })) {
          // Avoids evaluation the same instruction twice if another addon requires a rerun of tests
          previousInstruction = null;
          return;
        }

        previousInstruction = instruction;
        
        console.log('processed');

        const mutationResults = extractMutationResults(instruction);

        mutationCount++;
        
        const mutatedFilePaths = Object.keys(mutationResults.locations);

        await Promise.all(
          mutatedFilePaths.map(filePath =>
            createTempCopyOfFileIfItDoesntExist(filePath),
          ),
        );

        await Promise.all(
          mutatedFilePaths
            .map(async filePath => {
              const originalCodeText = await readFile(filePath, 'utf8');
              const ast = await cache.get(filePath);
              const { code } = generate(
                ast, 
                { retainFunctionParens: true, retainLines: true, compact: false, filename: basename(filePath) }, 
                originalCodeText
              );
              await writeFile(filePath, code, { encoding: 'utf8' });
            })
        );

        await Promise.resolve(onMutation(mutatedFilePaths));
        
        const testsToBeRerun = [...tester.testResults.values()].map(result => result.file);
        console.log('done')

        return testsToBeRerun;
      },
      complete: async (tester: FinalTesterResults) => {
        console.log('complete');
        Promise.all(
          [...originalPathToCopyPath.values()].map(copyPath => unlink(copyPath)),
        ).then(() => rmdir(copyTempDir));
        
        console.log(JSON.stringify(evaluations, undefined, 2));
        const faults = mutationEvalatuationMapToFaults(evaluations);
        const mappedFaults = mapToIstanbul ? mapFaultsToIstanbulCoverage(faults, tester.coverage) : faults;
        await Promise.all([recordFaults(faultFilePath, mappedFaults), reportFaults(mappedFaults)]);
      },
    },
  };
};

export default createPlugin;
