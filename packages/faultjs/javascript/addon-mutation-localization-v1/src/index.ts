import { readFile, writeFile, mkdtemp, unlink, rmdir, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve, basename } from 'path';

import generate from '@babel/generator';
import { parse, ParserOptions } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import { File, BaseNode } from '@babel/types';
import * as t from '@babel/types';

import del from 'del';
import ErrorStackParser from 'error-stack-parser';
import { createCoverageMap } from 'istanbul-lib-coverage';
import * as micromatch from 'micromatch';

import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { ExpressionLocation, Coverage } from '@fault/istanbul-util';
import {
  reportFaults,
  Fault,
  recordFaults,
  sortBySuspciousness,
} from '@fault/record-faults';
import {
  TesterResults,
  TestResult,
  FailingTestData,
  FinalTesterResults,
} from '@fault/types';

const getHighest = <T>(arr: T[], compareFn: (a: T, b: T) => number) => {
  let i = 1;
  let highest: T = arr[0];
  while (i < arr.length) {
    const item = arr[i];
    if (compareFn(item, highest) > 0) {
      highest = item;
    }
    i++;
  }

  return highest;
};

class Heap<T> {
  private arr: T[];
  private invalidated = false;
  private highest: T | undefined;
  constructor(public readonly compareFn: (a: T, b: T) => number, arr: T[] = []) {
    this.arr = [...arr];
    this.refindHighest();
  }

  some(callback: (item: T) => boolean) {
    return this.some(callback);
  }

  clone(): Heap<T> {
    return new Heap(this.compareFn, this.arr);
  }

  private refindHighest() {
    if (this.arr.length <= 0) {
      this.highest = undefined;
      return;
    }

    this.highest = getHighest(this.arr, this.compareFn);
    this.invalidated = false;
  }

  public update() {
    this.invalidated = true;
  }

  private refindHighestIfInvalidated() {
    if (this.invalidated) {
      this.refindHighest();
    }
  }

  delete(a) {
    this.arr = this.arr.filter((b) => a !== b);
    if (a === this.highest) {
      this.invalidated = true;
    }
  }

  pop() {
    if (this.arr.length <= 0) {
      this.highest = undefined;
      this.invalidated = false;
      return undefined;
    }
    this.refindHighestIfInvalidated();
    this.arr.splice(
      this.arr.findIndex((item) => item === this.highest!),
      1,
    );
    this.invalidated = true;
    return this.highest;
  }

  peek(): T {
    this.refindHighestIfInvalidated();
    return this.highest!;
  }

  push(...item: T[]) {
    if (this.arr.length <= 0) {
      this.highest = getHighest(item, this.compareFn);
      this.invalidated = false;
    } else if (!this.invalidated) {
      const highestOutOfNew = getHighest(item, this.compareFn);
      if (this.compareFn(highestOutOfNew, this.highest!) > 0) {
        this.highest = highestOutOfNew;
      }
    }

    this.arr.push(...item);
  }

  get length() {
    return this.arr.length;
  }

  unsortedIterator() {
    return this.arr[Symbol.iterator]();
  }

  [Symbol.iterator]() {
    return this.arr.sort(this.compareFn);
  }
}

export const createAstCache = (babelOptions?: ParserOptions) => {
  const cache = new Map<string, File>();
  return {
    get: async (filePath: string, force = false): Promise<File> => {
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

type MutationResultLocation = {
  direct: boolean;
  location: ExpressionLocation;
};
type LocationObject = {
  [filePath: string]: MutationResultLocation[];
};

type MutationResults = {
  lineWidth: number;
  columnWidth: number;
  locations: LocationObject;
};

const totalMutations = (mutationResults: MutationResults) => {
  let count = 0;
  for (const location of Object.values(mutationResults.locations)) {
    count += location.length;
  }
  return count;
};

const originalPathToCopyPath: Map<string, string> = new Map();
let copyFileId = 0;
let copyTempDir: string = null!;
const resetFile = async (filePath: string) => {
  const copyPath = originalPathToCopyPath.get(filePath)!;
  if (copyPath === undefined) {
    console.error(originalPathToCopyPath);
    throw new Error(`Copied/cached path for ${filePath} was ${copyPath}`);
  }
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
const compareInstructions = (a: InstructionHolder, b: InstructionHolder) => {
  // TODO: The most important instructions should be ones that have huge potential to be a fix (E.g. Only improves tests, nothing else)
  if (a.data.derivedFromPassingTest && !b.data.derivedFromPassingTest) {
    return -1;
  } else if (!a.data.derivedFromPassingTest && b.data.derivedFromPassingTest) {
    return 1;
  }
  a.data.mutationEvaluations.sort(compareMutationEvaluations);
  b.data.mutationEvaluations.sort(compareMutationEvaluations);
  let aI = a.data.mutationEvaluations.length - 1;
  let bI = b.data.mutationEvaluations.length - 1;
  while (aI >= 0 && bI >= 0) {
    const aMutationEvaluation = a.data.mutationEvaluations[aI];
    const bMutationEvaluation = b.data.mutationEvaluations[bI];
    const comparison = compareMutationEvaluations(
      aMutationEvaluation,
      bMutationEvaluation,
    );
    if (comparison !== 0) {
      return comparison;
    }
    aI--;
    bI--;
  }
  while (aI >= 0) {
    const aMutationEvaluation = a.data.mutationEvaluations[aI];
    const didSomethingGoodOrCrashed =
      evaluationDidSomethingGoodOrCrashed(aMutationEvaluation);
    if (didSomethingGoodOrCrashed) {
      return 1;
    }
    aI--;
  }
  while (bI >= 0) {
    const bMutationEvaluation = b.data.mutationEvaluations[bI];
    const didSomethingGoodOrCrashed =
      evaluationDidSomethingGoodOrCrashed(bMutationEvaluation);
    if (didSomethingGoodOrCrashed) {
      return -1;
    }
    bI--;
  }
  return b.data.mutationEvaluations.length - a.data.mutationEvaluations.length;
};

type Location = {
  filePath: string;
} & ExpressionLocation;

const IF_TRUE = 'if-true';
const IF_FALSE = 'if-false';
const STATEMENT = 'statement';

type StatementInformationType = typeof IF_TRUE | typeof IF_FALSE | typeof STATEMENT;

type StatementInformation = {
  index: any;
  type: StatementInformationType;
  filePath: string;
  location: ExpressionLocation;
  retries: number;
  innerStatements: StatementInformation[];
  instructionHolders: InstructionHolder[];
  totalNodes: number;
  yielded: boolean;
};

type InstructionData = {
  mutationEvaluations: MutationEvaluation[];
  derivedFromPassingTest: boolean;
};

type Instruction = {
  type: symbol;
  isRemovable: (evaluation: MutationEvaluation, data: InstructionData) => boolean;
  mutationResults: MutationResults;
  process: (data: InstructionData, cache: AstCache) => Promise<any>;
  totalNodes: number;
  atomicMutation: boolean;
  mutationsLeft: number;
  mutationCount: number;
  onEvaluation: (
    evaluation: MutationEvaluation,
    data: InstructionData,
    cache: AstCache,
  ) => AsyncIterableIterator<InstructionHolder<any>>;
};

type InstructionHolder<T extends Instruction = Instruction> = {
  data: InstructionData;
  instruction: T;
};

type InstructionFactory<T extends Instruction = Instruction> = {
  enter(nodePath: NodePath, filePath: string, derivedFromPassingTest: boolean);
  onInitialEnter(nodePath: NodePath, filePath: string, derivedFromPassingTest: boolean);
  createPreBlockInstructions(
    nodePath: NodePath,
    filePath: string,
    derivedFromPassingTests: boolean,
  );
  createInstructions(
    nodePath: NodePath,
    filePath: string,
    derivedFromPassingTest: boolean,
  ): IterableIterator<InstructionHolder<T>>;
};

const createInstructionHolder = <T extends Instruction>(
  instruction: T,
  derivedFromPassingTest: boolean,
): InstructionHolder<T> => {
  return {
    data: {
      mutationEvaluations: [],
      derivedFromPassingTest,
    },
    instruction,
  };
};

const findNodePathsWithLocation = (ast: t.File, location: ExpressionLocation) => {
  const nodePaths: NodePath[] = [];
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

const getStatementOrBlock = (
  path: NodePath<t.Node>,
): NodePath<t.Scopable> | NodePath<t.Node> => {
  if (path.isStatement() || path.isBlock()) {
    return path;
  } else if (path.parentPath) {
    return getStatementOrBlock(path.parentPath);
  } else {
    return path;
  }
};

const expressionKey = (filePath: string, node: BaseNode) =>
  `${filePath}:${node.loc!.start.line}:${node.loc!.start.column}:${node.loc!.end.line}:${
    node.loc!.end.column
  }:${node.type}`;

const assertFoundNodePaths = (nodePaths: NodePath[], location: Location) => {
  if (nodePaths.length <= 0) {
    throw new Error(
      `Expected to find a node at location ${locationToKeyIncludingEnd(
        location.filePath,
        location,
      )} but didn't`,
    );
  }
};

const OPERATOR = Symbol('operation');
export const binaryOperationCategories = [
  ['^', ['&', '<<', '>>>', '>>'], ['|', '>>', '<<']],
  [['&', '&&']],
  [['|', '||']],
  [
    ['&&', '||'],
    [
      ['>=', '>'],
      ['<=', '<'],
    ],
    [
      ['!=', '=='],
      ['!==', '==='],
    ],
  ],
  [['**', '*'], '%', ['/', '*'], ['-', '+']],
];

abstract class SingleLocationInstruction implements Instruction {
  public abstract type: symbol;
  public readonly mutationCount = 1;
  private readonly retryHandler = new RetryHandler();
  public readonly mutationResults: MutationResults;
  public readonly atomicMutation: boolean = true;
  constructor(private readonly location: Location) {
    this.mutationResults = locationToMutationResults(location, true);
  }

  isRemovable(evaluation: MutationEvaluation) {
    return this.retryHandler.evaluate(evaluation);
  }

  protected abstract processNodePaths(nodePaths: NodePath[]);

  abstract filterNodePath(nodePath: NodePath): boolean;

  async process(data, cache) {
    const ast = await cache.get(this.location.filePath);

    const nodePaths = findNodePathsWithLocation(ast, this.location).filter((nodePath) =>
      this.filterNodePath(nodePath),
    );
    assertFoundNodePaths(nodePaths, this.location);

    this.processNodePaths(nodePaths);
  }
}

class BinaryInstruction extends SingleLocationInstruction {
  public readonly type: symbol = OPERATOR;
  public readonly mutationCount = 1;

  filterNodePath(nodePath) {
    return nodePath.isBinaryExpression() || nodePath.isLogicalExpression();
  }

  constructor(
    location: Location,
    private readonly operators: string[],
    private nullifyLeft: boolean,
    private nullifyRight: boolean,
    public readonly totalNodes: number,
  ) {
    super(location);
  }

  isRemovable(evaluation) {
    return this.operators.length <= 0 || super.isRemovable(evaluation);
  }

  get mutationsLeft() {
    return this.operators.length;
  }

  async processNodePaths(
    nodePaths: NodePath<t.BinaryExpression | t.LogicalExpression>[],
  ) {
    const operator = this.operators.pop()!;
    const nodePath = nodePaths[0];
    if (this.nullifyLeft) {
      this.nullifyLeft = false;
      // TODO: Wasn't sure if it's always possible to do this but need results :P. Remove the try
      try {
        nodePath.replaceWith(nodePath.get('left'));
        return;
      } catch (err) {
        console.error(err);
      }
    } else if (this.nullifyRight) {
      this.nullifyRight = false;
      try {
        nodePath.replaceWith(nodePath.get('right'));
        return;
      } catch (err) {
        console.error(err);
      }
    }
    if (['||', '&&'].includes(operator)) {
      nodePath.replaceWith(
        t.logicalExpression(operator as any, nodePath.node.left, nodePath.node.right),
      );
    } else {
      nodePath.replaceWith(
        t.binaryExpression(operator as any, nodePath.node.left, nodePath.node.right),
      );
    }
  }

  async *onEvaluation() {}
}

const locationToMutationResults = (
  location: Location,
  direct: boolean,
): MutationResults => {
  return {
    lineWidth: location.end.line - location.start.line,
    columnWidth: location.end.column - location.start.column,
    locations: {
      [location.filePath]: [{ location, direct }],
    },
  };
};

const ASSIGNMENT = Symbol('assignment');
class AssignmentInstruction extends SingleLocationInstruction {
  public readonly type: symbol = ASSIGNMENT;
  constructor(
    location: Location,
    private readonly operators: string[],
    public readonly totalNodes: number,
  ) {
    super(location);
  }

  isRemovable(evaluation) {
    return this.operators.length <= 0 || super.isRemovable(evaluation);
  }

  get mutationsLeft() {
    return this.operators.length;
  }

  filterNodePath(nodePath) {
    return nodePath.isAssignmentExpression();
  }

  processNodePaths(nodePaths: NodePath[]) {
    const operator = this.operators.pop();
    const nodePath = nodePaths[0];

    nodePath.setData('operator', operator);
  }

  async *onEvaluation() {}
}

const didSomethingGood = (evaluation: MutationEvaluation) => {
  return (
    !evaluation.crashed &&
    (evaluation.testsImproved > 0 ||
      evaluation.errorsChanged > 0 ||
      !nothingChangedMutationStackEvaluation(evaluation.stackEvaluation))
  );
};
const evaluationDidSomethingGoodOrCrashed = (evaluation: MutationEvaluation) => {
  return evaluation.crashed || didSomethingGood(evaluation);
};

const evaluationDidNothingBad = (evaluation: MutationEvaluation) => {
  return (
    evaluation.testsWorsened === 0 &&
    evaluation.stackEvaluation.lineDegradationScore === 0 &&
    evaluation.stackEvaluation.columnDegradationScore === 0
  );
};

type StatementBlock = {
  statements: StatementInformation[];
};
export const DELETE_STATEMENT = Symbol('delete-statement');
class DeleteStatementInstruction implements Instruction {
  public readonly type = DELETE_STATEMENT;
  public mutationResults: MutationResults;
  public mutationsLeft: number;
  public totalNodes: number;
  public atomicMutation: boolean;
  public mutationCount: number;
  private lastProcessedStatementBlock: StatementBlock = undefined!;
  private statementBlocks: Heap<StatementBlock>;
  constructor(statements: StatementBlock[], private readonly maxRetries: number) {
    this.statementBlocks = new Heap(
      (a, b) => a.statements.length - b.statements.length,
      statements,
    );
    // TODO: This doesn't really make sense, need to make this less hacky
    this.lastProcessedStatementBlock = this.statementBlocks.peek();
    this.recalculateMutationResults();
  }

  /**
   * Managing state like this is gross, refactor
   */
  recalculateMutationResults() {
    const locationsObj: LocationObject = {};
    const locationsAdded: Set<string> = new Set();
    const statements = this.lastProcessedStatementBlock.statements;
    this.atomicMutation = statements.length <= 1;
    const stack: StatementInformation[] = [...statements];
    let totalNodes = 0;
    for (const outerStatement of statements) {
      totalNodes += outerStatement.totalNodes;
    }
    const originalStackLength = stack.length;
    this.totalNodes = totalNodes;
    let s = 0;
    while (s < stack.length) {
      const statement = stack[s];
      const key = locationToKeyIncludingEnd(statement.filePath, statement.location!);
      if (statement.innerStatements.length > 0 && statement.type !== IF_TRUE) {
        stack.push(...statement.innerStatements);
      }
      if (!locationsAdded.has(key)) {
        if (locationsObj[statement.filePath] === undefined) {
          locationsObj[statement.filePath] = [];
        }
        locationsObj[statement.filePath].push({
          location: statement.location,
          direct: s < originalStackLength,
        });
        locationsAdded.add(key);
      }
      s++;
    }
    let lineWidth = 0;
    let columnWidth = 0;
    for (const statement of statements) {
      lineWidth += Math.abs(statement.location.end.line - statement.location.start.line);
      columnWidth += Math.abs(
        statement.location.end.column - statement.location.start.column,
      );
    }
    this.mutationResults = {
      lineWidth,
      columnWidth,
      locations: locationsObj,
    };

    let count = statements.length * 2 - 1;
    for (const statement of statements) {
      for (const instructionHolder of statement.instructionHolders) {
        count += instructionHolder.instruction.mutationsLeft;
      }
    }
    this.mutationsLeft = count;
    this.mutationCount = totalMutations(this.mutationResults);
  }

  isRemovable() {
    return this.statementBlocks.length <= 0;
  }

  async process(data: InstructionData, cache: AstCache) {
    const statements = this.statementBlocks.pop()!;
    this.lastProcessedStatementBlock = statements;
    this.recalculateMutationResults();

    const sortedStatements = [...statements.statements].sort((a, b) => {
      const comparison = a.filePath.localeCompare(b.filePath);
      if (comparison !== 0) {
        return comparison;
      }

      const startLine = a.location.start.line - b.location.start.line;
      if (startLine !== 0) {
        return startLine;
      }
      const startColumn = a.location.start.column - b.location.start.column;
      if (startColumn !== 0) {
        return startColumn;
      }
      const endLine = a.location.end.line - b.location.end.line;
      if (endLine !== 0) {
        return endLine;
      }
      const endColumn = a.location.end.column - b.location.end.column;
      if (endColumn !== 0) {
        return endColumn;
      }
      return 0;
    });
    // TODO: Really shouldn't have to rely on the order of statements for this to work
    for (let s = sortedStatements.length - 1; s >= 0; s--) {
      const statement = sortedStatements[s];
      const ast = await cache.get(statement.filePath);
      const nodePaths = findNodePathsWithLocation(ast, statement.location!);
      assertFoundNodePaths(nodePaths, {
        ...statement.location!,
        filePath: statement.filePath,
      });
      const filteredNodePaths = nodePaths.filter(
        (path) =>
          path.parentPath &&
          (path.parentPath.node.body || path.parentPath.node.consequent),
      );
      assertFoundNodePaths(filteredNodePaths, {
        ...statement.location!,
        filePath: statement.filePath,
      });
      // TODO: Pretty sure you'll only ever get 1 node path but should probably check to make sure
      const path = filteredNodePaths.pop()!;
      const parentPath = path.parentPath;
      const parentNode = parentPath!.node;

      if (statement.type !== STATEMENT) {
        if (!path.isIfStatement()) {
          throw new Error(
            `Statement type was ${statement.type} but node type was ${path.node.type}`,
          );
        }
        if (statement.type === IF_TRUE) {
          path.set('test', t.booleanLiteral(true));
        } else if (statement.type === IF_FALSE) {
          path.set('test', t.booleanLiteral(false));
        } else {
          throw new Error(`Statement type not recognized ${statement.type}`);
        }
      } else if (parentPath.isIfStatement()) {
        path.replaceWith(t.blockStatement([]));
      } else if (Array.isArray(parentNode.body)) {
        parentNode.body.splice(statement.index, 1);
      } else {
        parentPath.set('body', t.blockStatement([]));
      }
    }
  }

  private splitStatementBlock(statements: StatementInformation[]) {
    const middle = Math.trunc(statements.length / 2);
    const statements1 = statements.slice(middle);
    const statements2 = statements.slice(0, middle);
    this.statementBlocks.push({
      statements: statements1,
    });
    this.statementBlocks.push({
      statements: statements2,
    });
  }

  mergeStatementsWithLargestStatementBlock(statements: StatementInformation[]) {
    if (this.statementBlocks.length <= 0) {
      this.statementBlocks.push({
        statements,
      });
      return;
    }
    let largestStatementBlock: StatementBlock | null = null;
    for (const statementBlock of this.statementBlocks.unsortedIterator()) {
      if (statementBlock.statements[0].retries < this.maxRetries) {
        if (
          largestStatementBlock === null ||
          statementBlock.statements.length > largestStatementBlock.statements.length
        ) {
          largestStatementBlock = statementBlock;
        }
      }
    }
    if (largestStatementBlock !== null) {
      largestStatementBlock.statements.push(...statements);
      this.statementBlocks.update(largestStatementBlock);
    }
  }

  async *onEvaluation(
    evaluation: MutationEvaluation,
  ): AsyncIterableIterator<InstructionHolder> {
    const statements = this.lastProcessedStatementBlock;
    if (statements.statements.length <= 0) {
      throw new Error(`There were ${statements.statements.length} statements`);
    }

    const deletingStatementsDidSomethingGoodOrCrashed =
      evaluationDidSomethingGoodOrCrashed(evaluation);
    if (deletingStatementsDidSomethingGoodOrCrashed) {
      if (!evaluation.crashed) {
        for (const statement of statements.statements) {
          statement.retries = this.maxRetries;
        }
      }
      if (statements.statements.length === 1) {
        const statement = statements.statements[0];
        if (!statement.yielded) {
          yield* statement.instructionHolders;
          statement.yielded = true;
        }
        if (statement.type === IF_TRUE) {
          statement.type = IF_FALSE;
          this.statementBlocks.push({
            statements: [statement],
          });
        }
      } else {
        this.splitStatementBlock(statements.statements);
      }
    } else {
      const originallySingleStatement = statements.statements.length === 1;
      let statementStateAltered = false;
      for (let s = statements.statements.length - 1; s >= 0; s--) {
        const statement = statements.statements[s];
        if (statement.retries <= 0) {
          if (statement.type === IF_TRUE) {
            statement.type = IF_FALSE;
            statementStateAltered = true;
          } else {
            statements.statements.splice(s, 1);
          }
        } else {
          statement.retries--;
        }
      }
      if (statements.statements.length > 1) {
        this.splitStatementBlock(statements.statements);
      } else if (
        statements.statements.length === 1 &&
        (!originallySingleStatement || statementStateAltered)
      ) {
        this.statementBlocks.push({
          statements: [statements.statements[0]],
        });
      }
    }
  }
}

class RetryHandler {
  private readonly maxRetries: number = 1;
  private retries: number = this.maxRetries;
  private previousEvaluation: MutationEvaluation | null = null;

  /**
   * @param evaluation The mutation evaluation
   * @returns whether the instruction needs to be removed or not
   */
  evaluate(evaluation: MutationEvaluation): boolean {
    let removeInstruction = false;
    if (
      !didSomethingGood(evaluation) ||
      (this.previousEvaluation &&
        compareMutationEvaluations(evaluation, this.previousEvaluation) <= 0)
    ) {
      if (this.retries > 0) {
        this.retries--;
      } else {
        removeInstruction = true;
      }
    } else {
      this.retries = this.maxRetries;
    }
    if (
      this.previousEvaluation === null ||
      compareMutationEvaluations(this.previousEvaluation, evaluation) < 0
    ) {
      this.previousEvaluation = evaluation;
    }
    return removeInstruction;
  }
}

type CategoryData<T> = (T | CategoryData<T>)[];
const recursiveIncludes = (match: any, arr: any) => {
  if (match === arr) {
    return true;
  } else if (Array.isArray(arr)) {
    return arr.some((item) => recursiveIncludes(match, item));
  }
};
/**
 * Creates the ordering for the operation and assignment arrays based off what the
 * current value of the assignment/operation node is
 */
export const matchAndFlattenCategoryData = <T>(match: T, categories: CategoryData<T>) => {
  const stack: (CategoryData<T> | T)[] = [categories];
  const flattened: T[] = [];
  let s = 0;
  while (s < stack.length) {
    const value = stack[s];
    if (Array.isArray(value)) {
      // Could probably not constantly recursively check if the value is in the array
      // Also constantly pushing new elements onto the stack results in some nasty memory complexity
      if (recursiveIncludes(match, value)) {
        stack.push(...value);
        s++;
      } else {
        stack.splice(s, 1, ...value);
      }
    } else {
      if (match !== value) {
        flattened.push(value as T);
      }
      s++;
    }
  }
  const alreadyAddedSet = new Set();
  return flattened
    .reverse()
    .filter((item) => {
      if (alreadyAddedSet.has(item)) {
        return false;
      } else {
        alreadyAddedSet.add(item);
        return true;
      }
    })
    .reverse();
};

const REPLACE_STRING = Symbol('replace-string');
class ReplaceStringInstruction extends SingleLocationInstruction {
  public readonly type: symbol = REPLACE_STRING;

  constructor(
    location: Location,
    private readonly values: string[],
    public readonly totalNodes: number,
  ) {
    super(location);
  }

  get mutationsLeft() {
    return this.values.length;
  }

  filterNodePath(nodePath) {
    if (nodePath.isStringLiteral()) {
      return true;
    }
    return false;
  }

  isRemovable(evaluation) {
    return this.values.length <= 0 || super.isRemovable(evaluation);
  }

  processNodePaths(nodePaths: NodePath<t.StringLiteral>[]) {
    const nodePath = nodePaths[0];
    nodePath.setData('value', this.values.pop());
  }

  async *onEvaluation() {}
}

const REPLACE_NUMBER = Symbol('replace-number');
class ReplaceNumberInstruction extends SingleLocationInstruction {
  public readonly type: symbol = REPLACE_NUMBER;

  constructor(
    location: Location,
    private readonly values: number[],
    public readonly totalNodes: number,
  ) {
    super(location);
  }

  get mutationsLeft() {
    return this.values.length;
  }

  filterNodePath(nodePath) {
    return nodePath.isNumericLiteral();
  }

  isRemovable(evaluation) {
    return this.values.length <= 0 || super.isRemovable(evaluation);
  }

  processNodePaths(nodePaths) {
    const nodePath = nodePaths[0] as NodePath<t.NumberLiteral>;
    nodePath.setData('value', this.values.pop());
  }

  async *onEvaluation() {}
}

class ReplaceNumberFactory implements InstructionFactory<ReplaceNumberInstruction> {
  private readonly filePathToNumberValues: Map<string, Set<number>> = new Map();

  enter() {}

  onInitialEnter(nodePath: NodePath, filePath: string) {
    if (nodePath.isNumericLiteral()) {
      if (!this.filePathToNumberValues.has(filePath)) {
        this.filePathToNumberValues.set(filePath, new Set());
      }
      this.filePathToNumberValues.get(filePath)!.add(nodePath.node.value);
    }
  }

  *createPreBlockInstructions() {}

  *createInstructions(nodePath: NodePath, filePath, derivedFromPassingTest) {
    if (nodePath.isNumericLiteral() && nodePath.node.loc) {
      const node = nodePath.node;
      const filterOut: Set<number> = new Set();
      if (nodePath.parentPath && nodePath.parentPath.isBinaryExpression()) {
        const operator = nodePath.parentPath.node.operator;
        if (['-', '+', '*', '/', '%', '>>>', '>>'].includes(operator)) {
          filterOut.add(0);
        }
        if ('**' === operator) {
          filterOut.add(1);
        }
        if ('/' === operator && nodePath.key === 'right') {
          filterOut.add(1);
        }
        if ('*' === operator) {
          filterOut.add(1);
        }
        if ('<<' === operator && nodePath.key === 'right') {
          filterOut.add(0);
        }
        if ('%' === operator && nodePath.key === 'right') {
          filterOut.add(0);
          filterOut.add(1);
        }
      }
      filterOut.add(node.value);

      const values = [
        ...new Set([
          ...this.filePathToNumberValues.get(filePath)!,
          node.value - 1,
          node.value + 1,
        ]),
      ]
        .filter((value) => !filterOut.has(value))
        .sort((a, b) => Math.abs(b - node.value) - Math.abs(a - node.value));
      yield createInstructionHolder(
        new ReplaceNumberInstruction(
          { ...nodePath.node.loc, filePath },
          values,
          node[TOTAL_NODES],
        ),
        derivedFromPassingTest,
      );
    }
  }
}

class ReplaceStringFactory implements InstructionFactory<ReplaceStringInstruction> {
  enter() {}

  onInitialEnter() {}

  *createPreBlockInstructions() {}

  *createInstructions(nodePath, filePath, derivedFromPassingTest) {
    const node = nodePath.node;
    if (nodePath.isStringLiteral() && node.loc) {
      const alreadySeen = new Set();
      const values = node[STRINGS]!.filter((value) => value !== node.value).reverse();
      const filteredValues = values.filter((value) => {
        if (alreadySeen.has(value)) {
          return false;
        }
        alreadySeen.add(value);
        return true;
      });
      filteredValues.reverse();
      if (values.length > 0) {
        yield createInstructionHolder(
          new ReplaceStringInstruction(
            { ...node.loc, filePath },
            filteredValues,
            node[TOTAL_NODES],
          ),
          derivedFromPassingTest,
        );
      }
    }
  }
}

const REPLACE_BOOLEAN = Symbol('replace-boolean');
class InvertBooleanLiteralInstruction extends SingleLocationInstruction {
  public readonly mutationsLeft: number = 1;
  public readonly type = REPLACE_BOOLEAN;
  constructor(location: Location, public readonly totalNodes: number) {
    super(location);
  }

  isRemovable() {
    return true;
  }

  filterNodePath(path: NodePath) {
    return path.isBooleanLiteral();
  }

  async processNodePaths(nodePaths) {
    const nodePath = nodePaths[0] as NodePath<t.BooleanLiteral>;
    nodePath.setData('value', !nodePath.node.value);
  }

  async *onEvaluation() {}
}

const REPLACE_IDENTIFIER = Symbol('replace-identifier');
class ReplaceIdentifierInstruction extends SingleLocationInstruction {
  public readonly totalNodes: number = 1;
  public readonly type: symbol = REPLACE_IDENTIFIER;
  constructor(location: Location, public readonly names: string[]) {
    super(location);
  }

  async *onEvaluation() {}

  get mutationsLeft() {
    return this.names.length;
  }

  isRemovable(evaluation) {
    return this.names.length <= 0 || super.isRemovable(evaluation);
  }

  filterNodePath(nodePath: NodePath) {
    return (
      nodePath.isIdentifier() &&
      nodePath.node.loc !== null &&
      (nodePath.parentPath === null || !nodePath.parentPath.isVariableDeclarator())
    );
  }

  processNodePaths(nodePaths: NodePath<t.Identifier>[]) {
    const nodePath = nodePaths[0];
    nodePath.setData('name', this.names.pop()!);
  }
}

const couldBeVariableNameReplaceable = (path: NodePath): boolean =>
  path.isIdentifier() &&
  path.node.loc !== null &&
  (path.parentPath === null ||
    (!path.parentPath.isVariableDeclarator() &&
      !path.parentPath.isMemberExpression() &&
      !path.parentPath.isFunction() &&
      (!path.parentPath.isCallExpression() || typeof path.key === 'number')));

class ReplaceIdentifierFactory
  implements InstructionFactory<ReplaceIdentifierInstruction>
{
  enter() {}

  *createPreBlockInstructions() {}

  *onInitialEnter() {}

  *createInstructions(path: NodePath, filePath, derivedFromPassingTest) {
    const node = path.node as t.Identifier;
    if (couldBeVariableNameReplaceable(path) && node.loc) {
      const possibleNames = [...path.node[PREVIOUS_IDENTIFIER_NAMES]].reverse();

      const alreadySeen: Set<string> = new Set([node.name]);

      const filteredNames = possibleNames.filter((name) => {
        if (alreadySeen.has(name)) {
          return false;
        }
        alreadySeen.add(name);
        return true;
      });

      filteredNames.reverse();

      if (filteredNames.length > 0) {
        yield createInstructionHolder(
          new ReplaceIdentifierInstruction({ filePath, ...node.loc }, filteredNames),
          derivedFromPassingTest,
        );
      }
    }
  }
}

const SWAP_FUNCTION_CALL = Symbol('swap-function-call');
class SwapFunctionCallArgumentsInstruction implements Instruction {
  public readonly type: symbol = SWAP_FUNCTION_CALL;
  public readonly mutationsLeft = 1;
  public readonly mutationResults: MutationResults;
  public readonly atomicMutation: boolean = true;
  public readonly mutationCount: number = 2;

  isRemovable() {
    return true;
  }

  constructor(
    private readonly location: Location,
    private readonly arg1: SwapFunctionInformation,
    private readonly arg2: SwapFunctionInformation,
    public readonly totalNodes: number,
  ) {
    let columnWidth = 0;
    columnWidth += arg1.location.end.column - arg1.location.start.column;
    columnWidth += arg2.location.end.column - arg2.location.start.column;

    let lineWidth = 0;
    lineWidth += arg1.location.end.line - arg1.location.start.line;
    lineWidth += arg2.location.end.line - arg2.location.start.line;

    this.mutationResults = {
      columnWidth,
      lineWidth,
      locations: {
        [location.filePath]: [
          {
            location: arg1.location,
            direct: true,
          },
          {
            location: arg2.location,
            direct: true,
          },
        ],
      },
    };
  }

  async *onEvaluation() {}

  async process(data, cache: AstCache) {
    const ast = await cache.get(this.location.filePath);

    const nodePaths = findNodePathsWithLocation(ast, this.location).filter((path) =>
      path.isCallExpression(),
    );
    assertFoundNodePaths(nodePaths, this.location);

    const nodePath = nodePaths[0] as NodePath<t.CallExpression>;
    const args = nodePath.node.arguments;

    const temp = args[this.arg1.index];
    args[this.arg1.index] = args[this.arg2.index];
    args[this.arg2.index] = temp;
  }
}

const SWAP_FUNCTION_PARAMS = Symbol('swap-function-params');
type SwapFunctionInformation = {
  location: ExpressionLocation;
  index: number;
};

class SwapFunctionParametersInstruction implements Instruction {
  public readonly type: symbol = SWAP_FUNCTION_PARAMS;
  public readonly mutationCount: number = 2;
  public readonly mutationsLeft: number = 1;
  public readonly mutationResults: MutationResults;
  public readonly atomicMutation: boolean = true;

  constructor(
    private readonly location: Location,
    private readonly param1: SwapFunctionInformation,
    private readonly param2: SwapFunctionInformation,
    public readonly totalNodes: number,
  ) {
    let columnWidth = 0;
    let lineWidth = 0;

    lineWidth += param1.location.end.line - param1.location.start.line;
    lineWidth += param2.location.end.line - param2.location.start.line;

    columnWidth += param1.location.end.column - param1.location.start.column;
    columnWidth += param2.location.end.column - param2.location.start.column;

    this.mutationResults = {
      columnWidth,
      lineWidth,
      locations: {
        [location.filePath]: [
          {
            location: param1.location,
            direct: true,
          },
          {
            location: param2.location,
            direct: true,
          },
        ],
      },
    };
  }

  isRemovable() {
    return true;
  }

  async *onEvaluation() {}

  async process(data, cache: AstCache) {
    const ast = await cache.get(this.location.filePath);

    const nodePaths = findNodePathsWithLocation(ast, this.location).filter((path) =>
      path.isFunction(),
    );
    assertFoundNodePaths(nodePaths, this.location);

    const nodePath = nodePaths[0] as NodePath<t.Function>;

    if (nodePath) {
      const params = nodePath.node.params;
      const temp = params[this.param1.index];
      params[this.param1.index] = params[this.param2.index];
      params[this.param2.index] = temp;
    }
  }
}

class SwapFunctionParametersFactory
  implements InstructionFactory<SwapFunctionParametersInstruction>
{
  *createInstructions() {}

  enter() {}

  *createPreBlockInstructions(nodePath: NodePath, filePath, derivedFromPassingTests) {
    if (nodePath.isFunction() && nodePath.node.loc) {
      const node = nodePath.node;
      const params = node.params;
      for (let p = 1; p < node.params.length; p++) {
        const param1 = params[p - 1];
        const param2 = params[p];
        if (param1.loc && param2.loc) {
          yield createInstructionHolder(
            new SwapFunctionParametersInstruction(
              { ...nodePath.node.loc, filePath },
              {
                index: p - 1,
                location: param1.loc,
              },
              {
                index: p,
                location: param2.loc,
              },
              param1[TOTAL_NODES] + param2[TOTAL_NODES],
            ),
            derivedFromPassingTests,
          );
        }
      }
    }
  }

  onInitialEnter() {}
}

class SwapFunctionCallArgumentsFactory
  implements InstructionFactory<SwapFunctionCallArgumentsInstruction>
{
  *createInstructions() {}

  enter() {}

  *createPreBlockInstructions(
    nodePath: NodePath,
    filePath: string,
    derivedFromPassingTests,
  ) {
    if (nodePath.isCallExpression() && nodePath.node.loc) {
      const node = nodePath.node;
      const params = node.arguments;
      for (let p = 1; p < node.arguments.length; p++) {
        const param1 = params[p - 1];
        const param2 = params[p];
        if (param1.loc && param2.loc) {
          yield createInstructionHolder(
            new SwapFunctionCallArgumentsInstruction(
              { ...nodePath.node.loc, filePath },
              {
                index: p - 1,
                location: param1.loc,
              },
              {
                index: p,
                location: param2.loc,
              },
              param1[TOTAL_NODES] + param2[TOTAL_NODES],
            ),
            derivedFromPassingTests,
          );
        }
      }
    }
  }

  onInitialEnter() {}
}

class InvertBooleanLiteralInstructionFactory
  implements InstructionFactory<InvertBooleanLiteralInstruction>
{
  enter() {}

  *createInstructions(nodePath, filePath, derivedFromPassingTests) {
    if (nodePath.isBooleanLiteral()) {
      yield createInstructionHolder(
        new InvertBooleanLiteralInstruction(
          { ...nodePath.node.loc, filePath },
          nodePath.node[TOTAL_NODES],
        ),
        derivedFromPassingTests,
      );
    }
  }

  *createPreBlockInstructions() {}

  onInitialEnter() {}
}

class AssignmentFactory implements InstructionFactory<AssignmentInstruction> {
  constructor(private readonly operations: CategoryData<string>) {}

  enter() {}

  onInitialEnter() {}

  *createPreBlockInstructions() {}

  *createInstructions(path, filePath, derivedFromPassingTest) {
    const node = path.node;
    if (path.isAssignmentExpression() && node.loc) {
      const operators = matchAndFlattenCategoryData(node.operator, this.operations);
      if (operators.length > 0) {
        yield createInstructionHolder(
          new AssignmentInstruction(
            { filePath, ...node.loc },
            operators,
            node[TOTAL_NODES],
          ),
          derivedFromPassingTest,
        );
      }
    }
  }
}

class BinaryFactory implements InstructionFactory<BinaryInstruction> {
  constructor(private readonly operations: CategoryData<string>) {}

  enter() {}

  onInitialEnter() {}

  *createPreBlockInstructions() {}

  *createInstructions(path, filePath, derivedFromPassingTest) {
    const node = path.node;
    if ((path.isBinaryExpression() || path.isLogicalExpression()) && node.loc) {
      const operators = matchAndFlattenCategoryData(node.operator, this.operations);
      if (operators.length > 0) {
        const operator = node.operator;
        const nullify = !['<', '>', '>=', '<=', '==', '==='].includes(operator);
        yield createInstructionHolder(
          new BinaryInstruction(
            { filePath, ...node.loc },
            operators,
            nullify,
            nullify,
            node[TOTAL_NODES],
          ),
          derivedFromPassingTest,
        );
      }
    }
  }
}

export const assignmentCategories = [
  [
    ['^=', '&=', '|='],
    ['>>>=', '&=', '>>='],
    ['|=', '<<='],
    ['&=', '|='],
    ['>>>=', '>>=', '<<='],
  ],
  ['&=', ['/=', '*='], ['-=', '+=']],
];
const instructionFactories: InstructionFactory<any>[] = [
  new AssignmentFactory(assignmentCategories),
  new BinaryFactory(binaryOperationCategories),
  new InvertBooleanLiteralInstructionFactory(),
  new ReplaceStringFactory(),
  new SwapFunctionCallArgumentsFactory(),
  new SwapFunctionParametersFactory(),
  new ReplaceNumberFactory(),
  new ReplaceIdentifierFactory(),
];
const RETRIES = 1;

const statementDepth = (statements: StatementInformation[]) => {
  if (statements.length <= 0) {
    return 0;
  }
  let largestInnerDepth = 0;
  for (const statement of statements) {
    const depth = statementDepth(statement.innerStatements);
    if (depth > largestInnerDepth) {
      largestInnerDepth = depth;
    }
  }
  return largestInnerDepth + 1;
};

const findAllNodePaths = async (cache: AstCache, locations: Location[]) => {
  const nodePaths: NodePath[] = [];
  const filePaths: Set<string> = new Set(locations.map((location) => location.filePath));
  for (const filePath of filePaths) {
    const fileLocationPaths: Set<string> = new Set(
      locations
        .filter((location) => filePath === location.filePath)
        .map((location) => locationToKeyIncludingEnd(location.filePath, location)),
    );

    const ast = await cache.get(filePath);

    traverse(ast, {
      enter(path: NodePath) {
        const loc = path.node.loc;
        if (loc) {
          const key = locationToKeyIncludingEnd(filePath, loc);
          if (fileLocationPaths.has(key)) {
            path.filePath = filePath;
            fileLocationPaths.delete(key);
            nodePaths.push(path);
          }
        }
      },
    });
  }
  return nodePaths;
};

const isStatementContainer = (path: NodePath<any>) => {
  const node = path.node;
  return (
    (node.body && (Array.isArray(node.body) || !node.body.body)) ||
    (path.isIfStatement() &&
      ((node.alternate && !node.alternate.body) || !node.consequent.body))
  );
};

const stubLocationEvaluation = (
  location: Location,
  totalNodes: number,
): LocationEvaluation => {
  return {
    totalAtomicMutationsPerformed: 0,
    totalNodes,
    location,
    evaluations: [],
  };
};

type IdentifierData = {
  order: number;
  name: string;
};
type PreviousIdentifiersData = {
  references: IdentifierData[];
  declarations: IdentifierData[];
};

const STRINGS = Symbol('strings');
const TOTAL_NODES = Symbol('total-nodes');
const PREVIOUS_IDENTIFIER_NAMES = Symbol('previous-identifer-names');
async function identifyUnknownInstruction(
  nodePaths: NodePath[],
  derivedFromPassingTest: boolean,
  cache: AstCache,
): Promise<StatementInformation[][]> {
  const filePaths = new Set(nodePaths.map((nodePath) => nodePath.filePath));
  for (const filePath of filePaths) {
    const nodeCounts: number[] = [];
    const names: PreviousIdentifiersData[] = [
      {
        references: [],
        declarations: [],
      },
    ];
    const stringBlocks: string[][] = [[]];
    let identifierCount = 0;
    const enter = (path: NodePath) => {
      // TODO: String logic is all over the place
      if (path.isStringLiteral()) {
        path.node[STRINGS] = ([] as string[]).concat(...stringBlocks);
        stringBlocks[stringBlocks.length - 1].push(path.node.value);
      }
      // TODO: Logic for identifier replacement is all over the place. Need to refactor
      if (path.isIdentifier()) {
        if (
          path.parentPath &&
          (path.parentPath.isVariableDeclarator() ||
            (path.parentPath.isFunction() && typeof path.key === 'number'))
        ) {
          names[names.length - 1].declarations.push({
            name: path.node.name,
            order: identifierCount,
          });
          identifierCount++;
        }
        if (couldBeVariableNameReplaceable(path)) {
          // Little confusing to read
          path.node[PREVIOUS_IDENTIFIER_NAMES] = ([] as string[]).concat(
            ...names.map((info) =>
              [...info.declarations, ...info.references]
                .sort((a, b) => a.order - b.order)
                .map((nameData) => nameData.name),
            ),
          );
          names[names.length - 1].references.push({
            name: path.node.name,
            order: identifierCount,
          });
          identifierCount++;
        }
      }

      if (isStatementContainer(path)) {
        stringBlocks.push([]);
        names.push({
          references: [],
          declarations: [],
        });
      }

      nodeCounts.push(path.isBlockStatement() || path.isExpressionStatement() ? 0 : 1);
      for (const instructionFactory of instructionFactories) {
        instructionFactory.onInitialEnter(path, filePath, derivedFromPassingTest);
      }
    };
    const exit = (path: NodePath) => {
      if (isStatementContainer(path)) {
        const popped = names.pop()!;
        const declarationNameSet = new Set(
          popped.declarations.map((nameData) => nameData.name),
        );
        const referencesThatWerentDeclaredInScope = popped.references.filter(
          (nameData) => !declarationNameSet.has(nameData.name),
        );
        names[names.length - 1].references.push(...referencesThatWerentDeclaredInScope);
        stringBlocks.pop();
      }

      const totalNodes = nodeCounts.pop()!;
      if (nodeCounts.length > 0) {
        nodeCounts[nodeCounts.length - 1] += totalNodes;
      }
      path.node[TOTAL_NODES] = totalNodes;
    };

    const ast = await cache.get(filePath);
    traverse(ast, {
      enter,
      exit,
    });
  }

  const statements: StatementInformation[] = [];
  for (const filePath of filePaths) {
    const expressionKeys: Set<string> = new Set(
      nodePaths
        .filter((nodePath) => nodePath.filePath === filePath)
        .map((nodePath) => {
          const statement = getStatementOrBlock(nodePath);
          if (statement.node.loc) {
            return expressionKey(filePath, statement.node);
          } else {
            return expressionKey(filePath, nodePath.node);
          }
        }),
    );

    let insideImportantStatementCount = 0;
    const currentStatementStack: StatementInformation[][] = [[]];
    const enter = (path: NodePath) => {
      const node = path.node;
      const parentPath = path.parentPath;
      const key = expressionKey(filePath, node);
      if (expressionKeys.has(key)) {
        insideImportantStatementCount++;
      }
      if (insideImportantStatementCount <= 0) {
        return;
      }

      if (
        parentPath &&
        ((parentPath.node.body &&
          ((path.key === 'body' && !node.body) ||
            (Array.isArray(parentPath.node.body) && typeof path.key === 'number'))) ||
          (parentPath.isIfStatement() &&
            parentPath.node.consequent &&
            (!parentPath.node.consequent.body ||
              (parentPath.node.alternate && !parentPath.node.alternate.body)) &&
            ['consequent', 'alternate'].includes(path.key))) &&
        node.loc
      ) {
        currentStatementStack[currentStatementStack.length - 1].push({
          index: path.key,
          type: path.isIfStatement() ? IF_TRUE : STATEMENT,
          filePath: filePath,
          instructionHolders: [],
          innerStatements: [],
          location: node.loc,
          retries: RETRIES,
          totalNodes: node[TOTAL_NODES],
          yielded: false,
        });
      }

      const statementStack = currentStatementStack[currentStatementStack.length - 1];
      if (statementStack.length > 0) {
        const statement = statementStack[statementStack.length - 1];
        for (const factory of instructionFactories) {
          statement.instructionHolders.push(
            ...factory.createPreBlockInstructions(path, filePath, derivedFromPassingTest),
          );
        }
      }

      if (isStatementContainer(path)) {
        currentStatementStack.push([]);
      }

      for (const factory of instructionFactories) {
        factory.enter(path, filePath, derivedFromPassingTest);
      }
    };
    const exit = (path: NodePath) => {
      const node = path.node;
      const key = expressionKey(filePath, node);
      if (insideImportantStatementCount <= 0) {
        return;
      }

      if (expressionKeys.has(key)) {
        insideImportantStatementCount--;
      }

      const statementStack = currentStatementStack[currentStatementStack.length - 1];
      if (statementStack.length > 0) {
        const statement = statementStack[statementStack.length - 1];
        for (const factory of instructionFactories) {
          statement.instructionHolders.push(
            ...factory.createInstructions(path, filePath, derivedFromPassingTest),
          );
        }
      }
      if (isStatementContainer(path)) {
        const poppedStatementInfo = currentStatementStack.pop()!;
        const newTopStackStatementInfo =
          currentStatementStack[currentStatementStack.length - 1];
        if (newTopStackStatementInfo.length <= 0) {
          newTopStackStatementInfo.push(...poppedStatementInfo);
        } else {
          const lastStatement =
            newTopStackStatementInfo[newTopStackStatementInfo.length - 1];
          lastStatement.innerStatements.push(...poppedStatementInfo);
        }
      }
    };

    const ast = await cache.get(filePath);
    traverse(ast, {
      enter,
      exit,
    });
    if (currentStatementStack.length !== 1) {
      console.error(currentStatementStack);
      throw new Error(
        `currentStatementStack was of length ${currentStatementStack.length} instead of 1`,
      );
    }
    statements.push(...currentStatementStack[0]);
  }
  const maxDepth = statementDepth(statements);
  const comparator = (a, b) => b.length - a.length;
  const statementBlocks: StatementInformation[][] = [];
  for (let d = 0; d < maxDepth; d++) {
    statementBlocks.push([]);
  }
  for (const statement of statements) {
    let stack = [statement];
    const statementLayers: StatementInformation[][] = [];
    do {
      const nextStack: StatementInformation[] = [];
      for (const item of stack) {
        nextStack.push(...item.innerStatements);
      }
      statementLayers.push(stack);
      stack = nextStack;
    } while (stack.length > 0);
    statementLayers.sort(comparator);
    for (let b = 0; b < statementLayers.length; b++) {
      statementBlocks[b].push(...statementLayers[b]);
    }
    statementBlocks.sort(comparator);
  }
  const originalLength = statementBlocks.length;
  for (let i = 0; i < originalLength; i++) {
    const statementBlock = statementBlocks[i];
    if (statementBlock.length > 1) {
      const mid = Math.trunc(statementBlock.length / 2);
      statementBlocks.push(statementBlock.splice(mid));
    }
  }

  return statementBlocks;
}

export type TestEvaluation = {
  // Whether the exception that was thrown in the test has changed
  errorChanged: boolean | null;
  // How much better we're doing in terms of whether the test failed/passed
  endResultChange: number;
  previouslyFailing: boolean;
} & StackEvaluation;

type StackEvaluation = {
  stackColumnScore: number | null;
  stackLineScore: number | null;
};

const nothingChangedMutationStackEvaluation = (e: MutationStackEvaluation) => {
  return (
    e.columnDegradationScore === 0 &&
    e.columnImprovementScore === 0 &&
    e.lineDegradationScore === 0 &&
    e.lineImprovementScore === 0
  );
};

export const compareMutationEvaluationsWithLesserProperties = (
  r1: MutationEvaluation,
  r2: MutationEvaluation,
) => {
  const comparison = compareMutationEvaluations(r1, r2);
  if (comparison !== 0) {
    return comparison;
  }
  if (!r1.crashed && !r2.crashed) {
    const result1 = r1 as NormalMutationEvaluation;
    const result2 = r2 as NormalMutationEvaluation;

    const stackEval1 = result1.stackEvaluation;
    const stackEval2 = result2.stackEvaluation;

    // TODO: stack null scores tell us very little but maybe more is better? Verify
    const lineScoreNulls = stackEval1.lineScoreNulls - stackEval2.lineScoreNulls;
    if (lineScoreNulls !== 0) {
      return lineScoreNulls;
    }

    const columnScoreNulls = stackEval1.columnScoreNulls - stackEval2.columnScoreNulls;
    if (columnScoreNulls !== 0) {
      return columnScoreNulls;
    }
  }
  return 0;
};

/**
 * From worst evaluation to best evaluation
 */
export const compareMutationEvaluations = (
  r1: MutationEvaluation,
  r2: MutationEvaluation,
) => {
  if (r1.partial && !r2.partial) {
    return -1;
  } else if (!r1.partial && r2.partial) {
    return 1;
  }

  if (r1.crashed && r2.crashed) {
    return 0;
  }

  const goodThingsHappened1 = didSomethingGood(r1);
  const goodThingsHappened2 = didSomethingGood(r2);
  const goodThingsHappenedComparison =
    (goodThingsHappened1 ? 1 : -1) - (goodThingsHappened2 ? 1 : -1);
  if (goodThingsHappenedComparison !== 0) {
    return goodThingsHappenedComparison;
  }

  const nothingBadHappened1 = evaluationDidNothingBad(r1);
  const nothingBadHappened2 = evaluationDidNothingBad(r2);
  const nothingBadHappenedComparison =
    (nothingBadHappened1 ? 1 : -1) - (nothingBadHappened2 ? 1 : -1);
  if (nothingBadHappenedComparison !== 0) {
    return nothingBadHappenedComparison;
  }

  if (r1.crashed && !r2.crashed) {
    if (r1.type === DELETE_STATEMENT && !goodThingsHappened2 && !nothingBadHappened2) {
      return 1;
    }
    return -1;
  }
  if (!r1.crashed && r2.crashed) {
    if (r2.type === DELETE_STATEMENT && !goodThingsHappened1 && !nothingBadHappened1) {
      return -1;
    }
    return 1;
  }

  if (
    !goodThingsHappened1 &&
    !goodThingsHappened2 &&
    nothingBadHappened1 &&
    nothingBadHappened2
  ) {
    const isDeleteStatement =
      (r2.type === DELETE_STATEMENT ? 1 : -1) - (r1.type === DELETE_STATEMENT ? 1 : -1);
    if (isDeleteStatement !== 0) {
      return isDeleteStatement;
    }
  }

  // TODO: TypeScript should have inferred that this would be the case..
  const result1 = r1 as NormalMutationEvaluation;
  const result2 = r2 as NormalMutationEvaluation;

  const stackEval1 = result1.stackEvaluation;
  const stackEval2 = result2.stackEvaluation;

  const netTestsImproved1 = result1.testsImproved - result1.testsWorsened;
  const netTestsImproved2 = result2.testsImproved - result2.testsWorsened;
  const netTestsImprovedComparison = netTestsImproved1 - netTestsImproved2;
  if (netTestsImprovedComparison !== 0) {
    return netTestsImprovedComparison;
  }

  const testsImproved = result1.testsImproved - result2.testsImproved;
  if (testsImproved !== 0) {
    return testsImproved;
  }

  const lineImprovementScore =
    stackEval1.lineImprovementScore - stackEval2.lineImprovementScore;
  if (lineImprovementScore !== 0) {
    return lineImprovementScore;
  }

  const lineDegradationScore =
    stackEval2.lineDegradationScore - stackEval1.lineDegradationScore;
  if (lineDegradationScore !== 0) {
    return lineDegradationScore;
  }

  const columnImprovementScore =
    stackEval1.columnImprovementScore - stackEval2.columnImprovementScore;
  if (columnImprovementScore !== 0) {
    return columnImprovementScore;
  }

  const columnDegradationScore =
    stackEval2.columnDegradationScore - stackEval1.columnDegradationScore;
  if (columnDegradationScore !== 0) {
    return columnDegradationScore;
  }

  const errorsChanged = result1.errorsChanged - result2.errorsChanged;
  if (errorsChanged !== 0) {
    return errorsChanged;
  }

  /*
  const mutationCount = result1.mutationCount - result2.mutationCount;
  if (mutationCount !== 0) {
    return mutationCount;
  }
  const totalNodes = result2.totalNodes - result1.totalNodes;
  if (totalNodes !== 0) {
    return totalNodes;
  }
  */

  return 0;
};

export const evaluateStackDifference = (
  originalResult: TestResult,
  newResult: TestResult,
): StackEvaluation => {
  // TODO: Just make passing test cases have null as the stack property
  if (
    (newResult.data as any).stack == null ||
    (originalResult.data as any).stack == null
  ) {
    return {
      stackColumnScore: null,
      stackLineScore: null,
    };
  }
  const newStackInfo = ErrorStackParser.parse({
    stack: (newResult.data as any).stack,
  } as Error);
  const oldStackInfo = ErrorStackParser.parse({
    stack: (originalResult.data as any).stack,
  } as Error);

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
  const samePassFailResult = originalResult.data.passed === newResult.data.passed;
  const endResultChange: number = samePassFailResult
    ? EndResult.UNCHANGED
    : newResult.data.passed
    ? EndResult.BETTER
    : EndResult.WORSE;
  const errorChanged: boolean | null = (() => {
    if (!samePassFailResult) {
      return null;
    }
    if (newResult.data.passed) {
      return false;
    }
    return (
      (newResult.data as any).stack !== (originalResult.data as FailingTestData).stack
    );
  })();
  const stackEvaluation = evaluateStackDifference(originalResult, newResult);

  const evaluation = {
    ...stackEvaluation,
    endResultChange,
    errorChanged,
    previouslyFailing: !originalResult.data.passed,
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
};
const createMutationStackEvaluation = (): MutationStackEvaluation => ({
  lineDegradationScore: 0,
  columnDegradationScore: 0,
  lineScoreNulls: 0,
  columnScoreNulls: 0,
  lineImprovementScore: 0,
  columnImprovementScore: 0,
});

export type CommonMutationEvaluation = {
  type: symbol;
  totalNodes: number;
  atomicMutation: boolean;
  partial: boolean;
  mutationCount: number;
};
export type CrashedMutationEvaluation = {
  stackEvaluation: null;
  testsWorsened: null;
  testsImproved: null;
  errorsChanged: null;
  overallPositiveEffect: null;
  overallNegativeEffect: null;
  crashed: true;
} & CommonMutationEvaluation;
export type NormalMutationEvaluation = {
  stackEvaluation: MutationStackEvaluation;
  testsWorsened: number;
  testsImproved: number;
  errorsChanged: number;
  overallPositiveEffect: number;
  overallNegativeEffect: number;
  crashed: false;
} & CommonMutationEvaluation;

export type MutationEvaluation = CrashedMutationEvaluation | NormalMutationEvaluation;

export type LocationMutationEvaluation = {
  evaluation: MutationEvaluation;
  direct: boolean;
};

const evaluateNewMutation = (
  originalResults: TesterResults,
  newResults: TesterResults,
  instruction: InstructionHolder,
  partial: boolean,
): MutationEvaluation => {
  const notSeen = new Set(originalResults.testResults.keys());
  let testsWorsened = 0;
  let testsImproved = 0;
  const stackEvaluation: MutationStackEvaluation = createMutationStackEvaluation();
  let errorsChanged = 0;
  let overallPositiveEffect = 0;
  let overallNegativeEffect = 0;

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
      overallPositiveEffect++;
    } else if (testEvaluation.endResultChange === EndResult.WORSE) {
      testsWorsened++;
      overallNegativeEffect++;
    } else if (
      testEvaluation.errorChanged &&
      (testEvaluation.stackLineScore === 0 || testEvaluation.stackColumnScore === null) &&
      (testEvaluation.stackColumnScore === 0 || testEvaluation.stackColumnScore === null)
    ) {
      errorsChanged++;
      overallPositiveEffect++;
    }

    if (testEvaluation.stackLineScore === null) {
      stackEvaluation.lineScoreNulls++;
    } else if (testEvaluation.stackLineScore > 0) {
      overallPositiveEffect++;
      stackEvaluation.lineImprovementScore += testEvaluation.stackLineScore;
    } else if (testEvaluation.stackLineScore < 0) {
      stackEvaluation.lineDegradationScore -= testEvaluation.stackLineScore;
      overallNegativeEffect++;
    } else if (testEvaluation.stackColumnScore === null) {
      stackEvaluation.columnScoreNulls++;
    } else if (testEvaluation.stackColumnScore > 0) {
      overallPositiveEffect++;
      stackEvaluation.columnImprovementScore += testEvaluation.stackColumnScore;
    } else if (testEvaluation.stackColumnScore < 0) {
      overallNegativeEffect++;
      stackEvaluation.columnDegradationScore -= testEvaluation.stackColumnScore;
    }
  }
  return {
    type: instruction.instruction.type,
    atomicMutation: instruction.instruction.atomicMutation,
    mutationCount: instruction.instruction.mutationCount,
    totalNodes: instruction.instruction.totalNodes,
    overallPositiveEffect,
    overallNegativeEffect,
    testsWorsened,
    testsImproved,
    stackEvaluation,
    errorsChanged,
    crashed: false,
    partial,
  };
};

const isInCoverage = (
  filePath: string,
  location: ExpressionLocation,
  locationKeys: Set<string>,
) => {
  const key = locationToKeyIncludingEnd(filePath, location);
  return locationKeys.has(key);
};

const locationToKey = (filePath: string, location?: ExpressionLocation | null) => {
  if (!location) {
    return filePath;
  }
  return `${filePath}:${location.start.line}:${location.start.column}`;
};
export const locationToKeyIncludingEnd = (
  filePath: string,
  location?: ExpressionLocation | null,
) => {
  if (!location) {
    return filePath;
  }
  const withStart = locationToKey(filePath, location);
  if (location.end === null) {
    return withStart;
  }
  return `${withStart}:${location.end.line}:${location.end.column}`;
};

const compareMutationEvaluationsWithLargeMutationCountsFirst = (
  a: LocationMutationEvaluation,
  b: LocationMutationEvaluation,
) => {
  const partial = (b.evaluation.partial ? 1 : -1) - (a.evaluation.partial ? 1 : -1);
  if (partial !== 0) {
    return partial;
  }

  const atomicMutation =
    (a.evaluation.atomicMutation ? 1 : -1) - (b.evaluation.atomicMutation ? 1 : -1);
  if (atomicMutation !== 0) {
    return atomicMutation;
  }

  const direct = (a.direct ? 1 : -1) - (b.direct ? 1 : -1);
  if (direct !== 0) {
    return direct;
  }

  const crashed = (b.evaluation.crashed ? 1 : -1) - (a.evaluation.crashed ? 1 : -1);
  if (crashed !== 0) {
    return crashed;
  }

  return compareMutationEvaluationsWithLesserProperties(a.evaluation, b.evaluation);
};

export const compareLocationEvaluations = (
  aL: LocationEvaluation,
  bL: LocationEvaluation,
) => {
  const a = aL.evaluations;
  const b = bL.evaluations;
  const aSingleMutationsOnly = a
    .sort(compareMutationEvaluationsWithLargeMutationCountsFirst)
    .reverse();
  const bSingleMutationsOnly = b
    .sort(compareMutationEvaluationsWithLargeMutationCountsFirst)
    .reverse();
  let aI = 0;
  let bI = 0;
  // Assumption: All arrays are at least .length > 0
  do {
    const a = aSingleMutationsOnly[aI];
    const b = bSingleMutationsOnly[bI];
    const comparison = compareMutationEvaluations(a.evaluation, b.evaluation);
    if (comparison !== 0) {
      return comparison;
    }

    // TODO: This doesn't need to be in the loop - it's the same in each iteration
    const roomForMutationComparison =
      aL.totalNodes / (1 + aL.totalAtomicMutationsPerformed) -
      bL.totalNodes / (1 + bL.totalAtomicMutationsPerformed);
    if (roomForMutationComparison !== 0) {
      return roomForMutationComparison;
    }

    aI++;
    bI++;
  } while (aI < aSingleMutationsOnly.length && bI < bSingleMutationsOnly.length);
  return bSingleMutationsOnly.length - aSingleMutationsOnly.length;
};

type LocationEvaluation = {
  evaluations: LocationMutationEvaluation[];
  location: Location;
  totalNodes: number;
  totalAtomicMutationsPerformed: number;
};
export const mutationEvalatuationMapToFaults = (
  locationEvaluations: Map<string, LocationEvaluation>,
  failingLocationKeys: Set<string>,
): Fault[] => {
  const locationEvaluationsList: LocationEvaluation[] = [...locationEvaluations.values()];
  locationEvaluationsList.sort(compareLocationEvaluations);

  const faults = locationEvaluationsList.map((lE, i): Fault => {
    return {
      score: i,
      sourcePath: lE.location.filePath,
      location: {
        start: lE.location.start,
        end: lE.location.end,
      },
      other: {
        isInCoverage: isInCoverage(
          lE.location.filePath,
          lE.location,
          failingLocationKeys,
        ),
        totalAtomicMutationsPerformed: lE.totalAtomicMutationsPerformed,
        totalNodes: lE.totalNodes,
        evaluation: lE.evaluations.map((e) => ({
          type: e.evaluation.type.toString(),
          ...e,
        })),
      },
    };
  });
  return faults;
};

type IsFinishedFunction = (
  instruction: InstructionHolder<any>,
  finishData: MiscFinishData,
) => boolean;
export type PluginOptions = {
  faultFileDir?: string;
  babelOptions?: ParserOptions;
  ignoreGlob?: string[] | string;
  onMutation?: (mutatatedFiles: string[]) => any;
  isFinishedFn?: IsFinishedFunction;
  mapToIstanbul?: boolean;
  allowPartialTestRuns?: boolean;
};

type DefaultIsFinishedOptions = {
  mutationThreshold?: number;
  durationThreshold?: number;
  finishOnPassDerviedNonFunctionInstructions?: boolean;
};

type MiscFinishData = {
  mutationCount: number;
  testerResults: TesterResults;
};

export const createDefaultIsFinishedFn = ({
  mutationThreshold,
  durationThreshold,
  finishOnPassDerviedNonFunctionInstructions = true,
}: DefaultIsFinishedOptions = {}): IsFinishedFunction => {
  const isFinishedFn: IsFinishedFunction = (
    { data }: InstructionHolder<any>,
    finishData: MiscFinishData,
  ): boolean => {
    if (
      durationThreshold !== undefined &&
      finishData.testerResults.duration >= durationThreshold
    ) {
      return true;
    }

    if (
      mutationThreshold !== undefined &&
      finishData.mutationCount >= mutationThreshold
    ) {
      return true;
    }

    // TODO: Should just never add them to the queue in the first place
    if (finishOnPassDerviedNonFunctionInstructions && data.derivedFromPassingTest) {
      return true;
    }

    if (data.mutationEvaluations.length > 0) {
      // TODO: Might need to rethink using mutationCount if multi mutation instructions exist outside the delete statement phase
      const hasAtomicMutations = data.mutationEvaluations.some((e) => e.atomicMutation);
      const mostSpecificMutations = data.mutationEvaluations.filter(
        (e) => e.atomicMutation === hasAtomicMutations,
      );
      const mostSpecificMutationsOnlyContainCrashes =
        mostSpecificMutations.filter((evaluation) => evaluation.crashed).length ===
        mostSpecificMutations.length;
      if (!mostSpecificMutationsOnlyContainCrashes) {
        const containsUsefulMutations = data.mutationEvaluations.some((evaluation) => {
          const improved =
            !evaluation.crashed &&
            (evaluation.testsImproved > 0 ||
              evaluation.errorsChanged > 0 ||
              evaluation.stackEvaluation.lineImprovementScore > 0 ||
              evaluation.stackEvaluation.columnImprovementScore > 0);
          const nothingChangedInNonDeleteStatement =
            !evaluation.crashed &&
            evaluation.errorsChanged === 0 &&
            evaluation.testsImproved === 0 &&
            evaluation.testsWorsened === 0 &&
            nothingChangedMutationStackEvaluation(evaluation.stackEvaluation) &&
            evaluation.type !== DELETE_STATEMENT;
          return improved || nothingChangedInNonDeleteStatement;
        });
        if (!containsUsefulMutations) {
          return true;
        }
      }
    }

    return false;
  };
  return isFinishedFn;
};

export const isLocationWithinBounds = (
  loc: ExpressionLocation,
  statement: ExpressionLocation,
) => {
  const lineWithin =
    loc.start.line > statement.start.line && loc.start.line < statement.end.line;
  const onStartLineBound =
    loc.start.line === statement.start.line &&
    loc.start.column >= statement.start.column &&
    (loc.start.line !== statement.end.line || loc.start.column <= statement.end.column);
  const onEndLineBound =
    loc.start.line === statement.end.line &&
    loc.start.column <= loc.end.column &&
    (loc.start.line !== statement.start.line ||
      loc.start.column >= statement.start.column);
  return lineWithin || onStartLineBound || onEndLineBound;
};

export const mapFaultsToIstanbulCoverage = (
  faults: Fault[],
  coverage: Coverage,
  failingLocationKeys: Set<string>,
): Fault[] => {
  // TODO: Could make this more efficient
  const mappedFaults: Map<string, Fault> = new Map();
  const replace = (fault: Fault, location: ExpressionLocation) => {
    const key = locationToKeyIncludingEnd(fault.sourcePath, location);
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
      other: fault.other,
    });
  };

  for (const fault of faults) {
    const fileCoverage = coverage[fault.sourcePath];
    if (fileCoverage === undefined) {
      continue;
    }

    let mostRelevantStatement: ExpressionLocation | null = null;
    const loc = fault.location;
    const locLineWidth = Math.abs(loc.end.line - loc.start.line) + 1; // + 1 cause the line it's on counts as one
    const locColumnWidth = Math.abs(loc.end.column - loc.start.column);
    for (const statement of Object.values(fileCoverage.statementMap)) {
      if (!isInCoverage(fault.sourcePath, statement, failingLocationKeys)) {
        continue;
      }
      if (
        isLocationWithinBounds(loc, statement) ||
        isLocationWithinBounds(statement, loc)
      ) {
        if (mostRelevantStatement === null) {
          mostRelevantStatement = statement;
        } else {
          const lineDistance = Math.abs(statement.start.line - loc.start.line);
          const columnDistance = Math.abs(statement.start.column - loc.start.column);

          const oLineDistance = Math.abs(
            mostRelevantStatement.start.line - loc.start.line,
          );
          const oColumnDistance = Math.abs(
            mostRelevantStatement.start.column - loc.start.column,
          );

          if (
            lineDistance < oLineDistance ||
            (lineDistance === oLineDistance && columnDistance < oColumnDistance)
          ) {
            mostRelevantStatement = statement;
          } else {
            const lineWidth = Math.abs(statement.end.line - statement.start.line);
            const columnWidth = Math.abs(statement.end.column - statement.start.column);

            const oLineWidth = Math.abs(
              mostRelevantStatement.end.line - mostRelevantStatement.start.line,
            );
            const oColumnWidth = Math.abs(
              mostRelevantStatement.end.column - mostRelevantStatement.start.column,
            );

            const lineDisimilarity = Math.abs(locLineWidth - lineWidth);
            const columnDisimilarity = Math.abs(locColumnWidth - columnWidth);

            const oLineDisimilarity = Math.abs(locLineWidth - oLineWidth);
            const oColumnDisimilarity = Math.abs(locColumnWidth - oColumnWidth);

            if (
              lineDisimilarity < oLineDisimilarity ||
              (lineDisimilarity === oLineDisimilarity &&
                columnDisimilarity < oColumnDisimilarity)
            ) {
              mostRelevantStatement = statement;
            }
          }
        }
      }
    }

    if (mostRelevantStatement !== null) {
      replace(fault, mostRelevantStatement);
    }
  }
  return [...mappedFaults.values()];
};

const resetMutationsInInstruction = async (instruction: InstructionHolder) => {
  const previousMutationResults = instruction.instruction.mutationResults;

  // Revert all mutated files
  await Promise.all(
    Object.keys(previousMutationResults.locations).map((filePath) => resetFile(filePath)),
  );
};

let solutionCounter = 0;

type LocationKey = string;
const faultFileName = 'faults.json';
const heapComparisonFn = (a, b) => -compareInstructions(a, b);
export const createPlugin = ({
  faultFileDir = './faults/',
  babelOptions,
  ignoreGlob = [],
  onMutation = () => {},
  isFinishedFn = createDefaultIsFinishedFn(),
  mapToIstanbul = false,
  allowPartialTestRuns = false,
}: PluginOptions): PartialTestHookOptions => {
  const solutionsDir = resolve(faultFileDir, 'solutions');

  const faultFilePath = resolve(faultFileDir, faultFileName);
  let previousInstruction: InstructionHolder = null!;
  let finished = false;
  const instructionQueue: Heap<InstructionHolder> = new Heap(heapComparisonFn);
  let firstRun = true;
  let firstTesterResults: TesterResults;
  const failingTestFiles: Set<string> = new Set();
  const failingLocationKeys: Set<string> = new Set();
  let previousRunWasPartial = false;

  const locationEvaluations: Map<LocationKey, LocationEvaluation> = new Map();
  let mutationCount = 0;

  const resolvedIgnoreGlob = (Array.isArray(ignoreGlob) ? ignoreGlob : [ignoreGlob]).map(
    (glob) => resolve('.', glob).replace(/\\+/g, '/'),
  );
  const analyzeEvaluation = async (
    mutationEvaluation: MutationEvaluation,
    cache: AstCache,
  ) => {
    if (previousInstruction !== null) {
      const previousMutationResults = previousInstruction.instruction.mutationResults;

      // Revert all mutated files
      await Promise.all(Object.keys(previousMutationResults.locations).map(resetFile));

      if (!(previousInstruction.instruction instanceof DeleteStatementInstruction)) {
        previousInstruction.data.mutationEvaluations.push(mutationEvaluation);
      }

      for (const [filePath, expressionLocations] of Object.entries(
        previousMutationResults.locations,
      )) {
        for (const expressionLocation of expressionLocations) {
          const key = locationToKeyIncludingEnd(filePath, expressionLocation.location);
          const locationEvaluation = locationEvaluations.get(key)!;
          locationEvaluation.evaluations.push({
            evaluation: mutationEvaluation,
            direct: expressionLocation.direct,
          });
          if (mutationEvaluation.atomicMutation) {
            locationEvaluation.totalAtomicMutationsPerformed++;
          }
        }
      }

      for await (const newInstruction of previousInstruction.instruction.onEvaluation(
        mutationEvaluation,
        previousInstruction.data,
        cache,
      )) {
        if (!newInstruction) {
          throw new Error(`Instruction was ${newInstruction}`);
        }
        instructionQueue.push(newInstruction);
      }

      if (
        previousInstruction.instruction.isRemovable(
          mutationEvaluation,
          previousInstruction.data,
        )
      ) {
        // Can't assume it's at the top of the heap and therefore can't use pop because any new instruction (onEvaluation) could technically end up at the top too
        instructionQueue.delete(previousInstruction);
      } else {
        instructionQueue.update();
      }
    }
  };

  const runInstruction = async (tester: TesterResults, cache: AstCache) => {
    if (instructionQueue.length <= 0) {
      finished = true;
      return false;
    }

    const instruction = instructionQueue.peek()!;

    previousInstruction = instruction;

    await instruction.instruction.process(instruction.data, cache);

    if (isFinishedFn(instruction, { mutationCount, testerResults: tester })) {
      // Avoids evaluation the same instruction twice if another addon requires a rerun of tests
      finished = true;
      return false;
    }

    const mutationResults = instruction.instruction.mutationResults;

    mutationCount++;

    const mutatedFilePaths = Object.keys(mutationResults.locations);

    await Promise.all(
      mutatedFilePaths.map((filePath) => createTempCopyOfFileIfItDoesntExist(filePath)),
    );

    await Promise.all(
      mutatedFilePaths.map(async (filePath) => {
        const originalCodeText = await readFile(filePath, 'utf8');
        const ast = await cache.get(filePath);
        const { code } = generate(
          ast,
          {
            retainFunctionParens: true,
            retainLines: true,
            compact: false,
            filename: basename(filePath),
          },
          originalCodeText,
        );
        await writeFile(filePath, code, { encoding: 'utf8' });
      }),
    );

    await Promise.resolve(onMutation(mutatedFilePaths));
    mutationsAttempted++;
    return true;
  };

  let mutationsAttempted = 0;
  return {
    on: {
      start: async () => {
        await del(resolve(solutionsDir, '**/*'));
        await mkdir(solutionsDir, { recursive: true });
        // TODO: Types appear to be broken with mkdtemp
        copyTempDir = await (mkdtemp as any)(
          join(tmpdir(), 'fault-addon-mutation-localization-'),
        );
      },
      allFilesFinished: async (tester: TesterResults) => {
        if (finished) {
          return null;
        }

        const cache = createAstCache(babelOptions);
        if (firstRun) {
          firstTesterResults = tester;
          firstRun = false;
          const failedCoverageMap = createCoverageMap({});
          for (const testResult of tester.testResults.values()) {
            // TODO: Maybe don't?
            if (!testResult.data.passed) {
              failingTestFiles.add(testResult.data.file);
              failedCoverageMap.merge(testResult.data.coverage);
            }
          }
          const failedCoverage = failedCoverageMap.data;
          const statements: StatementBlock[] = [];
          const locations: Location[] = [];
          for (const [coveragePath, fileCoverage] of Object.entries(failedCoverage)) {
            if (micromatch.isMatch(coveragePath, resolvedIgnoreGlob)) {
              continue;
            }
            for (const [key, statementCoverage] of Object.entries(
              fileCoverage.statementMap,
            )) {
              if (fileCoverage.s[key] <= 0) {
                continue;
              }
              failingLocationKeys.add(
                locationToKeyIncludingEnd(coveragePath, statementCoverage),
              );
              locations.push({
                ...statementCoverage,
                filePath: coveragePath,
              });
            }
          }
          const allNodePaths = await findAllNodePaths(cache, locations);
          const statementBlocks = await identifyUnknownInstruction(
            allNodePaths,
            false,
            cache,
          );
          for (const statement of statementBlocks) {
            statements.push({
              statements: statement,
            });
          }

          const allLocations: Map<string, Location> = new Map();
          const stack: StatementInformation[] = [];
          for (const block of statementBlocks) {
            stack.push(...block);
          }

          while (stack.length > 0) {
            const popped = stack.pop()!;
            const key = locationToKeyIncludingEnd(popped.filePath, popped.location);
            allLocations.set(key, { ...popped.location, filePath: popped.filePath });
            stack.push(...popped.innerStatements);

            for (const instructionHolder of popped.instructionHolders) {
              for (const [filePath, locations] of Object.entries(
                instructionHolder.instruction.mutationResults.locations,
              )) {
                for (const location of locations) {
                  const instructionKey = locationToKeyIncludingEnd(
                    filePath,
                    location.location,
                  );
                  allLocations.set(instructionKey, { ...location.location, filePath });
                }
              }
            }
          }

          // TODO: This includes istanbul coverage which isn't even necessarily covered. But we have to keep it for now cause mapToIstanbul assumes that they're included in the evaluations
          const nodePaths = await findAllNodePaths(cache, [
            ...allLocations.values(),
            ...locations,
          ]);
          for (const nodePath of nodePaths) {
            const key = locationToKeyIncludingEnd(nodePath.filePath, nodePath.node.loc!);
            const totalNodes = nodePath.node[TOTAL_NODES];
            if (locationEvaluations.has(key)) {
              const locationEvaluation = locationEvaluations.get(key)!;
              if (totalNodes > locationEvaluation.totalNodes) {
                locationEvaluation.totalNodes = totalNodes;
              }
            } else {
              locationEvaluations.set(
                key,
                stubLocationEvaluation(
                  {
                    filePath: nodePath.filePath,
                    ...nodePath.node.loc!,
                  },
                  totalNodes,
                ),
              );
            }
          }

          if (statements.length > 0) {
            instructionQueue.push(
              createInstructionHolder(
                new DeleteStatementInstruction(statements, RETRIES),
                false,
              ),
            );
          }
        } else {
          const mutationEvaluation = evaluateNewMutation(
            firstTesterResults,
            tester,
            previousInstruction,
            previousRunWasPartial,
          );

          if (previousRunWasPartial && !mutationEvaluation.crashed) {
            const testsToBeRerun = [...firstTesterResults.testResults.values()].map(
              (result) => result.data.file,
            );
            previousRunWasPartial = false;
            return testsToBeRerun;
          }

          if (
            mutationEvaluation.testsImproved ===
              [...firstTesterResults.testResults.values()].filter((a) => !a.data.passed)
                .length &&
            mutationEvaluation.testsWorsened === 0 &&
            previousInstruction
          ) {
            const locationObj: LocationObject =
              previousInstruction.instruction.mutationResults.locations;
            const newSolutionDir = resolve(solutionsDir, (solutionCounter++).toString());
            await mkdir(newSolutionDir, { recursive: true });
            // TODO: Use folders + the actual file name or something
            let i = 0;
            for (const filePath of Object.keys(locationObj)) {
              const code = await readFile(filePath, 'utf8');
              await writeFile(resolve(newSolutionDir, i.toString()), code, 'utf8');
              i++;
            }
          }

          await resetMutationsInInstruction(previousInstruction);

          await analyzeEvaluation(mutationEvaluation, cache);
        }

        const rerun = await runInstruction(tester, cache);
        if (!rerun) {
          return;
        }
        if (allowPartialTestRuns) {
          previousRunWasPartial = true;
          return [...failingTestFiles];
        } else {
          // TODO: DRY
          const testsToBeRerun = [...firstTesterResults.testResults.values()].map(
            (result) => result.data.file,
          );
          return testsToBeRerun;
        }
      },
      async exit(tester: FinalTesterResults) {
        if (finished) {
          return { rerun: false, allow: false };
        }
        if (firstRun) {
          return { rerun: false, allow: false };
        }
        const mutationEvaluation: MutationEvaluation = {
          type: previousInstruction.instruction.type,
          atomicMutation: previousInstruction.instruction.atomicMutation,
          mutationCount: previousInstruction.instruction.mutationCount,
          totalNodes: previousInstruction.instruction.totalNodes,
          testsWorsened: null,
          testsImproved: null,
          stackEvaluation: null,
          errorsChanged: null,
          overallPositiveEffect: null,
          overallNegativeEffect: null,
          crashed: true,
          partial: previousRunWasPartial,
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
        await writeFile(
          resolve(faultFileDir, 'mutations-attempted.txt'),
          mutationsAttempted.toString(),
        );
        Promise.all(
          [...originalPathToCopyPath.values()].map((copyPath) => unlink(copyPath)),
        ).then(() => rmdir(copyTempDir));

        const locationEvaluationsThatArentEmpty: Map<string, LocationEvaluation> =
          new Map();
        for (const [key, value] of locationEvaluations) {
          if (value.evaluations.length > 0) {
            locationEvaluationsThatArentEmpty.set(key, value);
          }
        }

        const faults = mutationEvalatuationMapToFaults(
          locationEvaluationsThatArentEmpty,
          failingLocationKeys,
        );

        const mappedFaults = mapToIstanbul
          ? mapFaultsToIstanbulCoverage(faults, tester.coverage, failingLocationKeys)
          : faults;
        sortBySuspciousness(mappedFaults);
        // TODO: Temporary hack to ensure failed coverage comes first but should just use dStar sorting or something instead
        await Promise.all([
          recordFaults(faultFilePath, mappedFaults),
          reportFaults(mappedFaults),
        ]);
      },
    },
  };
};

export default createPlugin;
