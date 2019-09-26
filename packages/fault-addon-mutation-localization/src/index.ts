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
import { NodePath } from '@babel/traverse';
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

const totalMutations = (mutationResults: MutationResults) => {
  let count = 0;
  for(const location of Object.values(mutationResults.locations)) {
    count += location.length;
  }
  return count;
}

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

/**
 * From least desirable to be processed to most
 */
const compareInstructions = (a: InstructionHolder<any>, b: InstructionHolder<any>) => {
  // TODO: The most important instructions should be ones that have huge potential to be a fix (E.g. Only improves tests, nothing else)
  if (a.data.derivedFromPassingTest && !b.data.derivedFromPassingTest) {
    return -1;
  } else if(!a.data.derivedFromPassingTest && b.data.derivedFromPassingTest) {
    return 1;
  }
  a.data.mutationEvaluations.sort(compareMutationEvaluations);
  b.data.mutationEvaluations.sort(compareMutationEvaluations);
  let aI = a.data.mutationEvaluations.length - 1;
  let bI = b.data.mutationEvaluations.length - 1;
  while(aI >= 0 && bI >= 0) {
    const aMutationEvaluation = a.data.mutationEvaluations[aI];
    const bMutationEvaluation = b.data.mutationEvaluations[bI];
    const comparison = compareMutationEvaluations(aMutationEvaluation, bMutationEvaluation);
    if (comparison !== 0) {
      return comparison;
    }
    aI--;
    bI--;
  }
  if (a.data.mutationEvaluations.length < b.data.mutationEvaluations.length) {
    return 1;
  } else if (a.data.mutationEvaluations.length > b.data.mutationEvaluations.length) {
    return -1;
  }
  return 0;
};

type Location = {
  filePath: string;
} & ExpressionLocation;

type StatementInformation = {
  index: any,
  filePath: string,
  location: ExpressionLocation | null,
  instructionHolders: InstructionHolder[]
}

type InstructionData = {
  mutationEvaluations: MutationEvaluation[],
  derivedFromPassingTest: boolean,
};

type Instruction = {
  type: Symbol;
  isRemovable: (data: InstructionData) => boolean,
  mutationResults: MutationResults,
  mutationCount: number,
  process: (data: InstructionData, cache: AstCache) => Promise<any>,
  mutationsLeft: number,
  onEvaluation: (evaluation: MutationEvaluation, data: InstructionData, cache: AstCache) => AsyncIterableIterator<InstructionHolder<any>>
}

type InstructionHolder<T extends Instruction = Instruction> = {
  data: InstructionData,
  instruction: T,
};


type InstructionFactory<T extends Instruction = Instruction> = {
  createInstructions(nodePath: NodePath<unknown>, filePath: string, derivedFromPassingTest: boolean): IterableIterator<InstructionHolder<T>>;
};


const createInstructionHolder = <T extends Instruction>(
  instruction: T,
  derivedFromPassingTest: boolean
): InstructionHolder<T> => {
  return {
    data: {
      mutationEvaluations: [],
      derivedFromPassingTest,
    },
    instruction,
  }
}

const findNodePathsWithLocation = (ast, location: ExpressionLocation) => {
  let nodePaths: any[] = [];
  traverse(ast, {
    enter(path) {
      const loc1 = location;
      const loc2 = path.node.loc;
      if (
        loc2 &&
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
  if (t.isBlock(parentNode)) {
    return path;
  }
  return getParentScope(parentPath);
}

const expressionKey = (filePath: string, node: BaseNode) => `${filePath}:${node.loc!.start.line}:${node.loc!.start.column}:${node.loc!.end.line}:${node.loc!.end.column}:${node.type}`;

const assertFoundNodePaths = (nodePaths: any[], location: Location) => {
  if (nodePaths.length <= 0) {
    throw new Error(`Expected to find a node at location ${locationToKey(location.filePath, location)} but didn't`);
  }
};

const ASSIGNMENT = Symbol('assignment');
class AssignmentInstruction implements Instruction {
  public readonly type: Symbol = ASSIGNMENT;
  public readonly mutationResults: MutationResults;
  public readonly mutationCount: number = 1;
  constructor(
    private readonly location: Location,
    private readonly operators: string[],
  ) {
    this.mutationResults = {
      locations: {
        [this.location.filePath]: [this.location]        
      }
    }
  }

  isRemovable() {
    return this.operators.length <= 0;    
  }

  get mutationsLeft() {
    return this.operators.length;
  }

  async process(data: InstructionData, cache: AstCache) {
    const ast = await cache.get(this.location.filePath);

    const nodePaths = findNodePathsWithLocation(ast, this.location).filter(nodePath => t.isAssignmentExpression(nodePath));
    assertFoundNodePaths(nodePaths, this.location);
  
    const operator = this.operators.pop();
    const nodePath = nodePaths[0];

    nodePath.node.operator = operator;  
  }

  async *onEvaluation() {}
}

const evaluationDidSomethingGoodOrCrashed = (evaluation: MutationEvaluation) => {
  return evaluation.crashed || (evaluation.testsImproved > 0 || evaluation.errorsChanged > 0 || !nothingChangedMutationStackEvaluation(evaluation.stackEvaluation));
}

const DELETE_STATEMENT = Symbol('delete-statement');
class DeleteStatementInstruction implements Instruction {
  public readonly type = DELETE_STATEMENT;
  public readonly mutationResults: MutationResults;
  public mutationsLeft: number;
  public readonly mutationCount: number;
  constructor(
    private readonly statements: StatementInformation[],
    private readonly currentRetries: number,
    private readonly maxRetries: number,
  ) {
    const locationsObj: LocationObject = {};
    const locationsAdded: Set<string> = new Set();
    for(const statement of this.statements) {
      const key = locationToKey(statement.filePath, statement.location!);
      if (locationsAdded.has(key)) {
        continue;
      }
      if(locationsObj[statement.filePath] === undefined) {
        locationsObj[statement.filePath] = [];
      }
      locationsObj[statement.filePath].push(statement.location!);
      locationsAdded.add(key);
      for(const instruction of statement.instructionHolders) {
        if (instruction.instruction.type !== DELETE_STATEMENT) {
          continue;
        }
        const mutationResult = instruction.instruction.mutationResults;
        for(const [filePath, locations] of Object.entries(mutationResult.locations)) {
          if (locationsObj[filePath] === undefined) {
            locationsObj[filePath] = locations;
          } else {
            for(const location of locations) {
              const nestedKey = locationToKey(filePath, location);
              if (locationsAdded.has(nestedKey)) {
                continue;
              }
              locationsObj[filePath].push(location);
              locationsAdded.add(nestedKey);
            }
          }
        }
      }
    }
    this.mutationResults = {
      locations: locationsObj
    };
    this.mutationCount = totalMutations(this.mutationResults);
    
    let count = this.statements.length * 2 - 1;
    for(const statement of this.statements) {
      for(const instructionHolder of statement.instructionHolders) {
        count += instructionHolder.instruction.mutationsLeft;
      }
    }
    this.mutationsLeft = count;
  }

  isRemovable() {
    return true;
  }

  async process(data: InstructionData, cache: AstCache) {  
    for(let s = this.statements.length - 1; s >= 0; s--) {
      const statement = this.statements[s];
      console.log('deleting', locationToKey(statement.filePath, statement.location), statement.index);
      const ast = await cache.get(statement.filePath);
      const nodePaths = findNodePathsWithLocation(ast, statement.location!);
      assertFoundNodePaths(nodePaths, { ...statement.location!, filePath: statement.filePath });
      const filteredNodePaths = nodePaths.filter(path => path.parentPath && path.parentPath.node.body);
      assertFoundNodePaths(filteredNodePaths, { ...statement.location!, filePath: statement.filePath });
      // TODO: Pretty sure you'll only ever get 1 node path but should probably check to make sure
      const parentPath = filteredNodePaths.pop()!.parentPath;
      const parentNode = parentPath!.node;
      if(Array.isArray(parentNode.body)) {
        parentNode.body.splice(statement.index, 1);
      } else {
        parentNode.body = t.blockStatement([]);
      }
    }
  }

  public *yieldSplitDeleteStatements(data: InstructionData, currentRetries: number) {
    const originalStatements = this.statements;
    const middle = Math.trunc(this.statements.length / 2);
    const statements1 = originalStatements.slice(middle);
    const statements2 = originalStatements.slice(0, middle);
    
    yield createInstructionHolder(new DeleteStatementInstruction(statements1, currentRetries, this.maxRetries), data.derivedFromPassingTest);
    yield createInstructionHolder(new DeleteStatementInstruction(statements2, currentRetries, this.maxRetries), data.derivedFromPassingTest);
  }

  async *onEvaluation(evaluation: MutationEvaluation, data: InstructionData): AsyncIterableIterator<InstructionHolder> {
    if (this.statements.length <= 0) {
      throw new Error(`There were ${this.statements.length} statements`);
    }
 
    const deletingStatementsDidSomethingGoodOrCrashed = evaluationDidSomethingGoodOrCrashed(evaluation);
    if (deletingStatementsDidSomethingGoodOrCrashed) {
      if (this.statements.length <= 1) {
        const statement = this.statements[0];
        yield* statement.instructionHolders;
      } else if (!evaluation.crashed){
        yield* this.yieldSplitDeleteStatements(data, this.maxRetries);
      } else {
        yield* this.yieldSplitDeleteStatements(data, this.currentRetries);
      }
    } else if(this.statements.length > 1 && this.currentRetries > 0) {
      yield* this.yieldSplitDeleteStatements(data, this.currentRetries - 1);
    }
  }
}

class AssignmentFactory implements InstructionFactory<AssignmentInstruction>{
  constructor(private readonly operations: string[]) {}
  
  *createInstructions(path, filePath, derivedFromPassingTest) {
    const node = path.node;
    if(t.isAssignmentExpression(node) && node.loc) {
      const operators = [...this.operations].filter(
        operator => operator !== node.operator,
      );
      if (operators.length > 0) {
        yield createInstructionHolder(new AssignmentInstruction({ filePath, ...node.loc }, operators), derivedFromPassingTest);
      }
    }
  }
}

const arithmeticOperations = [
  '/=',
  '*=',
  '-=',
  '+=',
];
const bitOperations = [
  '!=',
  '&=',
  '^=',
  '|=',
  '<<=',
  '>>=',
]
const instructionFactories: InstructionFactory<any>[] = [
  new AssignmentFactory(arithmeticOperations),
  new AssignmentFactory(bitOperations),
  new AssignmentFactory(['='])
];
const RETRIES = 1;

async function* identifyUnknownInstruction(
  location: Location,
  cache: AstCache,
  expressionsSeen: Set<string>,
  derivedFromPassingTest: boolean
): AsyncIterableIterator<StatementInformation> {
  const ast = await cache.get(location.filePath);
  
  const nodePaths = findNodePathsWithLocation(ast, location);
  //console.log(nodePaths);
  const filePath = location.filePath;
  for(const nodePath of nodePaths) {
    const scopedPath = getParentScope(nodePath);
    const statements: StatementInformation[] = [];
    const currentStatementStack: StatementInformation[][] = [];
    const expressionSeenThisTimeRound: Set<string> = new Set();
    traverse(scopedPath.node, {
      enter: (path) => {
        const node = path.node;
        const parentPath = path.parentPath;
        const key = expressionKey(filePath, node);
        if (expressionsSeen.has(key)) {
          return;
        }
        expressionsSeen.add(key);
        expressionSeenThisTimeRound.add(key);
        if (parentPath && parentPath.node.body && currentStatementStack.length > 0 && node.loc) {
          currentStatementStack[currentStatementStack.length - 1].push({
            index: path.key,
            filePath,
            instructionHolders: [],
            location: node.loc,
          })
        }
        if (node.body) {
          currentStatementStack.push([]);
        }
        if(currentStatementStack.length > 0) {
          const statementStack = currentStatementStack[currentStatementStack.length - 1];
          if (statementStack.length > 0) {
            const statement = statementStack[statementStack.length - 1];
            for(const factory of instructionFactories) {
              statement.instructionHolders.push(...factory.createInstructions(path, filePath, derivedFromPassingTest));
            }  
          }
        }
      },
      exit: (path) => {
        const node = path.node;
        const key = expressionKey(filePath, node);
        if (!expressionSeenThisTimeRound.has(key)) {
          return
        }
        if (node.body) {
          const poppedStatementInfo = currentStatementStack.pop()!;
          
          if (currentStatementStack.length <= 0) {
            statements.push(...poppedStatementInfo);
          } else {
            const newTopStackStatementInfo = currentStatementStack[currentStatementStack.length - 1];
            const lastStatement = newTopStackStatementInfo[newTopStackStatementInfo.length - 1];
            lastStatement.instructionHolders.push(
              createInstructionHolder(new DeleteStatementInstruction(poppedStatementInfo, RETRIES, RETRIES), derivedFromPassingTest)
            );
          }
        }
      }
    }, scopedPath.scope, undefined, scopedPath.parentPath);
    yield * statements;
  }
};

export type TestEvaluation = {
  // Whether the exception that was thrown in the test has changed
  errorChanged: boolean | null;
  // How much better we're doing in terms of whether the test failed/passed
  endResultChange: number;
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
  r1: MutationEvaluation,
  r2: MutationEvaluation,
) => {
  const partialComparison = r2.partial - r1.partial;
  if (partialComparison !== 0) {
    return partialComparison;
  }
  if (r1.crashed && r2.crashed) {
    return 0;
  } else if (r1.crashed && !r2.crashed) {
    return -1
  } else if (!r1.crashed && r2.crashed) {
    return 1;
  }
  // TODO: TypeScript should have inferred that this would be the case..
  const result1 = r1 as NormalMutationEvaluation;
  const result2 = r2 as NormalMutationEvaluation;

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
  const endResultChange: number = samePassFailResult
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

  const evaluation = {
    ...stackEvaluation,
    endResultChange,
    errorChanged,
    previouslyFailing: !originalResult.passed,
  };
  return evaluation;
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

type CommonMutationEvaluation = {
  type: Symbol,
  mutationCount: number,
  partial: boolean,
};
type CrashedMutationEvaluation = {
  stackEvaluation: null,
  testsWorsened: null;
  testsImproved: null;
  errorsChanged: null;
  crashed: true;
} & CommonMutationEvaluation;
type NormalMutationEvaluation = {
  stackEvaluation: MutationStackEvaluation,
  testsWorsened: number;
  testsImproved: number;
  errorsChanged: number;
  crashed: false;
} & CommonMutationEvaluation;

type MutationEvaluation = CrashedMutationEvaluation | NormalMutationEvaluation;

const evaluateNewMutation = (
  originalResults: TesterResults,
  newResults: TesterResults,
  instruction: InstructionHolder,
  partial: boolean,
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
    if (testEvaluation.endResultChange === EndResult.BETTER) {
      testsImproved++;
    } else if (testEvaluation.endResultChange === EndResult.WORSE) {
      testsWorsened++;
    } else if (testEvaluation.errorChanged && (testEvaluation.stackLineScore === 0 || testEvaluation.stackColumnScore === null) && (testEvaluation.stackColumnScore === 0 || testEvaluation.stackColumnScore === null)) {
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
    type: instruction.instruction.type,
    mutationCount: instruction.instruction.mutationCount,
    testsWorsened,
    testsImproved,
    stackEvaluation,
    errorsChanged,
    crashed: false,
    partial
  };
};

const locationToKey = (filePath: string, location: ExpressionLocation) => {
  return `${filePath}:${location.start.line}:${location.start.column}`;
};

const compareMutationEvaluationsWithLargeMutationCountsFirst = (a: MutationEvaluation, b: MutationEvaluation) => {
  if (a.mutationCount > b.mutationCount) {
    return -1;
  } else if (a.mutationCount < b.mutationCount) {
    return 1;
  }
  return compareMutationEvaluations(a, b);
}

const compareLocationEvaluations = (aL: LocationEvaluation, bL: LocationEvaluation) => {
  const a = aL.evaluations;
  const b = bL.evaluations;
  const aHasSingleMutation = a.some(e => e.mutationCount === 1);
  const bHasSingleMutation = b.some(e => e.mutationCount === 1);
  if (aHasSingleMutation && !bHasSingleMutation) {
    // TODO: This bit only works because non delete statements only appear if the delete statements had good enough evaluations
    return 1;
  } else if (!aHasSingleMutation && bHasSingleMutation) {
    // TODO: This bit only works because non delete statements only appear if the delete statements had good enough evaluations
    return -1;
  } else if (!aHasSingleMutation && !bHasSingleMutation) {
    // TODO: This bit only works because non delete statements only appear if the delete statements had good enough evaluations
    // Justification: a has more room to experiment with if it wasn't evaluated as much.
    // TODO: Replace with instructions left
    return b.length - a.length;
  } else {
    const aSingleMutationsOnly = a.sort(compareMutationEvaluationsWithLargeMutationCountsFirst).reverse();
    const bSingleMutationsOnly = b.sort(compareMutationEvaluationsWithLargeMutationCountsFirst).reverse();
    let aI = 0;
    let bI = 0;
    // Assumption: All arrays are at least .length > 0
    do {
      const comparison = compareMutationEvaluations(aSingleMutationsOnly[aI], bSingleMutationsOnly[bI]);
      if (comparison !== 0) {
        return comparison;
      }
      aI++;
      bI++;
    } while(aI < aSingleMutationsOnly.length && bI < bSingleMutationsOnly.length)
    // Justification: a has more room to experiment with if it wasn't evaluated as much.
    // TODO: Replace with instructions left
    return b.length - a.length;
  }
}

type LocationEvaluation = {
  evaluations: MutationEvaluation[],
  location: Location
}
export const mutationEvalatuationMapToFaults = (
  locationEvaluations: Map<string, LocationEvaluation>,
): Fault[] => {
  const locationEvaluationsList: LocationEvaluation[] = [...locationEvaluations.values()];
  locationEvaluationsList.sort(compareLocationEvaluations);
  console.log(locationEvaluationsList.map(e => e.evaluations))
  const faults = locationEvaluationsList.map((lE, i): Fault => {
    return {
      score: i,
      sourcePath: lE.location.filePath,
      location: {
        start: lE.location.start,
        end: lE.location.end,
      }
    };
  });
  return faults;
};

type IsFinishedFunction = (instruction: InstructionHolder<any>, finishData: MiscFinishData) => boolean;
export type PluginOptions = {
  faultFilePath?: string,
  babelOptions?: ParserOptions,
  ignoreGlob?: string[] | string,
  onMutation?: (mutatatedFiles: string[]) => any,
  isFinishedFn?: IsFinishedFunction,
  mapToIstanbul?: boolean,
  allowPartialTestRuns?: boolean
};

type DefaultIsFinishedOptions = {
  mutationThreshold?: number,
  durationThreshold?: number,
  finishOnPassDerviedNonFunctionInstructions?: boolean,
}

type MiscFinishData = {
  mutationCount: number,
  testerResults: TesterResults,
}


export const createDefaultIsFinishedFn = ({
  mutationThreshold,
  durationThreshold,
  finishOnPassDerviedNonFunctionInstructions = true
}: DefaultIsFinishedOptions = {}): IsFinishedFunction => {
  const isFinishedFn: IsFinishedFunction = ({ data, instruction }: InstructionHolder<any>, finishData: MiscFinishData): boolean => {
    if (durationThreshold !== undefined && finishData.testerResults.duration >= durationThreshold) {
      console.log('a');
      return true;
    }

    if(mutationThreshold !== undefined && finishData.mutationCount >= mutationThreshold) {
      console.log('b');
      return true;
    }

    // TODO: Should just never add them to the queue in the first place
    if (finishOnPassDerviedNonFunctionInstructions && data.derivedFromPassingTest) {
      console.log('c');
      return true;
    }

    if (data.mutationEvaluations.length > 0) {
      const onlyContainsDeleteStatementCrashes = data.mutationEvaluations.filter(evaluation => evaluation.crashed && evaluation.type === DELETE_STATEMENT).length === data.mutationEvaluations.length;
      if (!onlyContainsDeleteStatementCrashes) {
        const containsUsefulMutations = data.mutationEvaluations.some(evaluation => {
          const improved = 
            !evaluation.crashed && (
            evaluation.testsImproved > 0 
            || evaluation.errorsChanged > 0 
            || evaluation.stackEvaluation.lineImprovementScore > 0
            || evaluation.stackEvaluation.columnImprovementScore > 0);
          const nothingChangedInNonDeleteStatement = !evaluation.crashed && (evaluation.errorsChanged === 0 
            && evaluation.testsImproved === 0
            && evaluation.testsWorsened === 0
            && nothingChangedMutationStackEvaluation(evaluation.stackEvaluation)
            && evaluation.type !== DELETE_STATEMENT
          );
          return improved || nothingChangedInNonDeleteStatement;
        })
        if (!containsUsefulMutations) {
          console.log('d');
          return true;
        }
      }
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

const resetMutationsInInstruction = async (instruction: InstructionHolder) => {
  const previousMutationResults = instruction.instruction.mutationResults;

  // Revert all mutated files
  await Promise.all(Object.keys(previousMutationResults.locations).map(
    filePath => resetFile(filePath)
  ));
}

type LocationKey = string;
const heapComparisonFn = (a, b) => -compareInstructions(a, b);
export const createPlugin = ({
  faultFilePath = './faults/faults.json',
  babelOptions,
  ignoreGlob = [],
  onMutation = () => {},
  isFinishedFn = createDefaultIsFinishedFn(),
  mapToIstanbul = false,
  allowPartialTestRuns = true
}: PluginOptions): PartialTestHookOptions => {
  let previousInstruction: InstructionHolder = null!;
  let finished = false;
  const instructionQueue: Heap<InstructionHolder> = new Heap(heapComparisonFn);
  let firstRun = true;  
  let firstTesterResults: TesterResults;
  const failingTestFiles: Set<string> = new Set();
  let previousRunWasPartial = false;

  const locationEvaluations: Map<LocationKey, LocationEvaluation> = new Map();
  let mutationCount = 0;
  const resolvedIgnoreGlob = (Array.isArray(ignoreGlob) ? ignoreGlob : [ignoreGlob]).map(glob =>
    resolve('.', glob).replace(/\\+/g, '/'),
  );
  const analyzeEvaluation = async (mutationEvaluation: MutationEvaluation, cache: AstCache) => {    
    if (previousInstruction !== null) {
      console.log(mutationEvaluation);
      const previousMutationResults = previousInstruction.instruction.mutationResults;

      // Revert all mutated files
      await Promise.all(Object.keys(previousMutationResults.locations).map(resetFile));

      //console.log(locationToKey(previousInstruction.data.location.filePath, previousInstruction.data.location), { ...mutationEvaluation, mutations: undefined });

      previousInstruction.data.mutationEvaluations.push(mutationEvaluation);

      for(const [filePath, expressionLocations] of Object.entries(previousMutationResults.locations)) {
        for(const expressionLocation of expressionLocations) {
          const key = locationToKey(filePath, expressionLocation);
          if (locationEvaluations.has(key)) {
            locationEvaluations.get(key)!.evaluations.push(mutationEvaluation);
          } else {
            locationEvaluations.set(key, {
              evaluations: [mutationEvaluation],
              location: {
                filePath,
                ...expressionLocation
              }
            });
          }
        }
      }

      if (previousInstruction.instruction.isRemovable(previousInstruction.data)) {
        console.log('popping');
        // Can't assume it's at the top of the heap because any new instruction (onEvaluation) could technically end up at the top too
        instructionQueue.delete(previousInstruction);
      } else {
        console.log('updating')
        instructionQueue.update(previousInstruction);
      }

      for await(const newInstruction of previousInstruction.instruction.onEvaluation(mutationEvaluation, previousInstruction.data, cache)) {
        console.log('pushing');
        instructionQueue.push(newInstruction);
      }
    }
  }

  const runInstruction = async (tester: TesterResults, cache: AstCache) => {
    let count = 0;
    for(const instruction of instructionQueue) {
      count += instruction.instruction.mutationsLeft;
    }
    console.log(`${count} instructions`);

    if (instructionQueue.length <= 0) {
      finished = true;
      return false;
    }

    console.log('set peaking')
    const instruction = instructionQueue.peek()!;
    previousInstruction = instruction;

    //console.log('processing')
    
    await instruction.instruction.process(instruction.data, cache);

    if (isFinishedFn(instruction, { mutationCount, testerResults: tester })) {
      console.log('finished');
      // Avoids evaluation the same instruction twice if another addon requires a rerun of tests
      finished = true;
      return false;
    }

    const mutationResults = instruction.instruction.mutationResults;

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
    
    return true;
  }

  return {
    on: {
      start: async () => {
        // TODO: Types appear to be broken with mkdtemp
        copyTempDir = await (mkdtemp as any)(join(tmpdir(), 'fault-addon-mutation-localization-'));
      },
      allFilesFinished: async (tester: TesterResults) => {
        if(finished) {
          return null;
        }
        //console.log('finished all files')
        const cache = createAstCache(babelOptions);
        if (firstRun) {
          firstTesterResults = tester;
          firstRun = false;
          const failedCoverageMap = createCoverageMap({});
          for (const testResult of tester.testResults.values()) {
            // TODO: Maybe don't?
            if (!testResult.passed) {
              failingTestFiles.add(testResult.file);
              failedCoverageMap.merge(testResult.coverage);
            }
          }
          const failedCoverage: Coverage = failedCoverageMap.data;
          const statements: StatementInformation[] = [];
          const expressionsSeen: Set<string> = new Set();
          for(const [coveragePath, fileCoverage] of Object.entries(failedCoverage)) {
            //console.log('failing', coveragePath, micromatch.isMatch(coveragePath, resolvedIgnoreGlob));
            if (micromatch.isMatch(coveragePath, resolvedIgnoreGlob)) {
              continue;
            }
            for(const statementCoverage of Object.values(fileCoverage.statementMap)) {
              for await (const statement of identifyUnknownInstruction({
                filePath: coveragePath,
                ...statementCoverage,
              }, cache, expressionsSeen, false)) {
                statements.push(statement);
              }
            }
          }
          if (statements.length > 1) {
            const middle = Math.trunc(statements.length / 2);
            const deletionInstruction1 = new DeleteStatementInstruction(statements.slice(0, middle), RETRIES, RETRIES);
            const deletionInstruction2 = new DeleteStatementInstruction(statements.slice(middle), RETRIES, RETRIES);
            instructionQueue.push(createInstructionHolder(deletionInstruction1, false));
            instructionQueue.push(createInstructionHolder(deletionInstruction2, false));
          } else if (statements.length === 1) {
            const deletionInstruction = new DeleteStatementInstruction(statements, RETRIES, RETRIES);
            instructionQueue.push(createInstructionHolder(deletionInstruction, false));
          }
        } else {
          const mutationEvaluation = evaluateNewMutation(
            firstTesterResults,
            tester,
            previousInstruction,
            previousRunWasPartial
          );
  
          if (previousRunWasPartial && evaluationDidSomethingGoodOrCrashed(mutationEvaluation)) {
            const testsToBeRerun = [...firstTesterResults.testResults.values()].map(result => result.file);
            previousRunWasPartial = false;
            console.log('proceeding with full test run');
            return testsToBeRerun;
          }
  
          await resetMutationsInInstruction(previousInstruction);
 
          await analyzeEvaluation(mutationEvaluation, cache); 
        }
        
        const rerun = await runInstruction(tester, cache);
        if (!rerun) {
          return;
        }
        if (allowPartialTestRuns) {
          console.log('Running partial test run');
          previousRunWasPartial = true;
          return [...failingTestFiles];
        } else {
          // TODO: DRY
          const testsToBeRerun = [...firstTesterResults.testResults.values()].map(result => result.file);
          return testsToBeRerun;
        }
      },
      async exit(tester: FinalTesterResults) {
        if (finished) {
          return { rerun: false, allow: false };
        }
        if (firstRun) {
          return { rerun: false, allow: false, };
        }
        const mutationEvaluation: MutationEvaluation = {
          type: previousInstruction.instruction.type,
          mutationCount: previousInstruction.instruction.mutationCount,
          testsWorsened: null,
          testsImproved: null,
          stackEvaluation: null,
          errorsChanged: null,
          crashed: true,
          partial: previousRunWasPartial
        };

        if (previousRunWasPartial) {
          previousRunWasPartial = false;
        }

        const cache = createAstCache(babelOptions);
        if (previousInstruction !== null) {
          await resetMutationsInInstruction(previousInstruction);
        }
        await analyzeEvaluation(mutationEvaluation, cache);

        // TODO: Would be better if the exit hook could be told which tests to rerun. Maybe :P
        const rerun = await runInstruction(tester, cache);
        
        return { rerun, allow: true };
      },
      complete: async (tester: FinalTesterResults) => {
        console.log('complete');
        Promise.all(
          [...originalPathToCopyPath.values()].map(copyPath => unlink(copyPath)),
        ).then(() => rmdir(copyTempDir));
        
        const faults = mutationEvalatuationMapToFaults(locationEvaluations);
        const mappedFaults = mapToIstanbul ? mapFaultsToIstanbulCoverage(faults, tester.coverage) : faults;
        await Promise.all([recordFaults(faultFilePath, mappedFaults), reportFaults(mappedFaults)]);
      },
    },
  };
};

export default createPlugin;
