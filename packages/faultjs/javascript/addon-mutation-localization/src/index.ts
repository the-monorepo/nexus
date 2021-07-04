import {
  readFile,
  writeFile,
  mkdtemp,
  unlink,
  rmdir,
  mkdir,
  copyFile,
} from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve, basename, normalize } from 'path';

import generate from '@babel/generator';
import { parse, ParserOptions } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { File } from '@babel/types';

import del from 'del';
import ErrorStackParser from 'error-stack-parser';
import { createCoverageMap } from 'istanbul-lib-coverage';
import * as micromatch from 'micromatch';

import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import { ExpressionLocation } from '@fault/istanbul-util';

import { passFailStatsFromTests, Stats } from '@fault/localization-util';
import { reportFaults, Fault, recordFaults } from '@fault/record-faults';
import dstar from '@fault/sbfl-dstar';
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

class Queue<T> {
  private readonly arr: T[];
  private invalidated = false;
  private highest: T | undefined;
  constructor(public readonly compareFn: (a: T, b: T) => number, arr: T[] = []) {
    this.arr = [...arr];
    this.refindHighest();
  }

  some(callback: (item: T) => boolean) {
    return this.some(callback);
  }

  clone(): Queue<T> {
    return new Queue(this.compareFn, this.arr);
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

  sortedIterator() {
    return this.arr.sort(this.compareFn);
  }

  [Symbol.iterator]() {
    return this.arr[Symbol.iterator]();
  }
}
type Location = {
  filePath: string;
} & ExpressionLocation;

export const testStatsFromCoverageInfo = (info: CoveragePathObj) => {
  const stats: Stats = {
    passed: 0,
    failed: 0,
  };
  for (const testResult of info.coveredBy) {
    if (testResult.result.data.passed) {
      stats.passed++;
    } else {
      stats.failed++;
    }
  }

  return stats;
};

const expressionLocationEquals = (
  loc1: ExpressionLocation | null | undefined,
  loc2: ExpressionLocation | null | undefined,
) => {
  if (loc2 === loc1) {
    return true;
  }
  if (loc2 == null) {
    return false;
  }
  if (loc1 == null) {
    return false;
  }
  return (
    loc1.start.column === loc2.start.column &&
    loc1.start.line === loc2.start.line &&
    loc1.end.column === loc2.end.column &&
    loc1.end.line === loc2.end.line
  );
};

const fileLocationEquals = (
  loc1: Location | null | undefined,
  loc2: Location | null | undefined,
) => {
  if (loc2 === loc1) {
    return true;
  }
  if (loc2 == null) {
    return false;
  }
  if (loc1 == null) {
    return false;
  }
  return loc1.filePath === loc2.filePath && expressionLocationEquals(loc1, loc2);
};

export const binaryOperationCategories = [
  ['>>', '>>>'],
  ['<', '<<'],
  ['>', '>>'],
  [['^', '|', '&', ['<<', '>>>', '>>'], ['>>', '<<']]],
  [
    [['&&', '||']],
    [
      ['>=', '>'],
      ['<=', '<'],
    ],
    [
      ['!=', '=='],
      ['!==', '==='],
    ],
  ],
  [[['&', '&&']]],
  [[['|', '||']]],
  [[['**', '*'], ['%'], ['/', '*'], ['-', '+']]],
];

const changedOrImprovedError = (evaluation: MutationEvaluation) => {
  return (
    !evaluation.crashed &&
    (evaluation.testsImproved.length > 0 ||
      evaluation.errorsChanged.length > 0 ||
      evaluation.stackEvaluation.improvement.length > 0)
  );
};
const evaluationChangedOrImprovedErrorOrCrashed = (evaluation: MutationEvaluation) => {
  return evaluation.crashed || changedOrImprovedError(evaluation);
};

const evaluationDidNothingBad = (evaluation: MutationEvaluation) => {
  return (
    !evaluation.crashed &&
    evaluation.testsWorsened.length === 0 &&
    evaluation.stackEvaluation.degradation.length === 0
  );
};

export type CategoryData<T> = Array<T | CategoryData<T>>;
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
export const matchAndFlattenCategoryData = <T>(categories: CategoryData<T>, match: T) => {
  const stack: (CategoryData<T> | T)[] = [categories];
  const flattened: T[] = [];
  let s = 0;
  while (s < stack.length) {
    const value = stack[s];
    if (Array.isArray(value)) {
      // Could probably not constantly recursively check if the value is in the array
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
  return filterVariantDuplicates(flattened as T[]);
};

type Mutation<D, S> = {
  setup: (asts: Map<string, t.File>, data: D) => S;
  execute: (state: S) => void;
};

// TODO: nodePath should be a NodePath or NodePath[] - cbs fixing all the type errors
type ValueFromPathFn<D, T = any, F> = (data: D, nodePath: T) => F;

type GetFnKey<T> = Parameters<NodePath<T>['get']>[0];

type SetFnKey<T> = Parameters<NodePath<T>['set']>[0];
type SetFnNode<T> = Parameters<NodePath<T>['set']>[1];

type SetDataFnKey<T> = Parameters<NodePath<T>['setData']>[0];
type SetDataFnValue<T> = Parameters<NodePath<T>['setData']>[1];

type TraverseKey = number | string;

export const getTraverseKeys = (path: NodePath<any>) => {
  const parts: TraverseKey[] = [];

  do {
    parts.push(path.key);
    if (path.inList) {
      parts.push(path.listKey);
    }
    path = path.parentPath;
  } while (path !== null);

  return parts.reverse().slice(1);
};

const traverseKeys = (path: NodePath<any> | NodePath<any>[], keys: TraverseKey[]) => {
  let current: NodePath<any> | NodePath<any>[] = path;
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    if (Array.isArray(current)) {
      if (typeof key !== 'number') {
        throw new Error(
          `Key ${k} was ${key} but exected a number. Keys were [${keys.join(', ')}]`,
        );
      }
      current = current[key];
    } else {
      if (typeof key !== 'string') {
        throw new Error(
          `Key ${k} was ${key} but exected a string. Keys were [${keys.join(', ')}]`,
        );
      }
      current = current.get(key);
    }
    if (current === undefined) {
      throw new Error(
        `Traversing to key ${k} which was ${key} ended up as undefined. Keys were [${keys.join(
          ', ',
        )}]`,
      );
    }
  }
  return current;
};

const keysToDependencyList = (path: NodePath<any>, keyList: TraverseKey[][]) => {
  const dependencies: NodePath<any>[] = [];
  for (const keys of keyList) {
    const dependency = traverseKeys(path, keys);
    if (Array.isArray(dependency)) {
      dependencies.push(...dependency);
    } else {
      dependencies.push(dependency);
    }
  }
  return dependencies;
};

type WrapperMutation<D, S> = {
  // TODO: Should be NodePath<T> or NodePath<T>[]
  setup: (data: D, nodePath) => S;
  execute: (state: S) => void;
};

type ValueMutationState = {
  node: t.Node;
  value: any;
};
export class SetDataDynamicMutation implements WrapperMutation<any, ValueMutationState> {
  constructor(
    private readonly key: SetDataFnKey<any>,
    private readonly thisWrapper: NodePathMutationWrapper<any, any>,
    private readonly getValue: ValueFromPathFn<any, any, SetDataFnValue<any>>,
  ) {}

  setup(data, rootPath) {
    return {
      node: (this.thisWrapper.traverseToThisPath(rootPath) as NodePath).node,
      value: this.getValue(data, rootPath),
    };
  }

  execute({ node, value }) {
    node[this.key] = value;
  }
}

type SetState = {
  path: NodePath | NodePath[];
  value: t.Node;
};
abstract class AbstractSetMutation<D> implements WrapperMutation<D, SetState> {
  constructor(
    private readonly key: TraverseKey,
    private readonly thisWrapper: NodePathMutationWrapper<D, any>,
  ) {}

  setup(data: D, rootPath: NodePath): SetState {
    return {
      path: this.thisWrapper.traverseToThisPath(rootPath),
      value: this.setupValue(data, rootPath),
    };
  }

  abstract setupValue(data: D, rootPath: NodePath): t.Node;

  public execute({ path, value }) {
    path.set(this.key, value);
  }
}

class SetMutation extends AbstractSetMutation<any> {
  constructor(
    key: TraverseKey,
    thisWrapper: NodePathMutationWrapper<any, any>,
    private readonly setWrapper: NodePathMutationWrapper<any, t.Node>,
  ) {
    super(key, thisWrapper);
  }

  setupValue(data, rootPath) {
    return (this.setWrapper.traverseToThisPath(rootPath) as NodePath).node;
  }
}

class SetDynamicMutation<D, T> extends AbstractSetMutation<D> {
  constructor(
    key: TraverseKey,
    thisWrapper: NodePathMutationWrapper<D, T>,
    private readonly getNode: ValueFromPathFn<D, any, SetFnNode<T>>,
  ) {
    super(key, thisWrapper);
  }

  setupValue(data, rootPath) {
    return this.getNode(data, rootPath);
  }
}

type ReplaceWithMultipleState = {
  path: NodePath;
  value: t.Node[];
};
export class ReplaceWithMultipleMutation
  implements WrapperMutation<any, ReplaceWithMultipleState>
{
  constructor(
    private readonly thisWrapper: NodePathMutationWrapper<any, any>,
    private readonly valueWrapper: NodePathMutationWrapper<any, t.Node>,
  ) {}

  setup(data, rootPath) {
    return {
      path: this.thisWrapper.traverseToThisPath(rootPath) as NodePath,
      value: (this.valueWrapper.traverseToThisPath(rootPath) as NodePath[]).map(
        (path) => path.node,
      ),
    };
  }

  execute({ path, value }) {
    path.replaceWithMultiple(value);
  }
}

type ReplaceWithState = {
  path: NodePath;
  value: t.Node;
};
abstract class AbstractReplaceWithMutation
  implements WrapperMutation<any, ReplaceWithState>
{
  constructor(private readonly thisWrapper: NodePathMutationWrapper<any, any>) {}

  setup(data, rootPath) {
    const value = this.setupValue(data, rootPath);
    if (Array.isArray(value)) {
      throw new Error(`replaceWith does not support array node paths`);
    }

    const traversed = this.thisWrapper.traverseToThisPath(rootPath);
    if (Array.isArray(traversed)) {
      throw new Error(`replaceWith does not support array replacements`);
    }
    return {
      path: traversed,
      value,
    };
  }

  execute({ path, value }) {
    if (Array.isArray(value)) {
      path.replaceWithMultiple(value);
    } else {
      path.replaceWith(value);
    }
  }

  abstract setupValue(data, rootPath): t.Node | t.Node[];
}
export class ReplaceWithMutation extends AbstractReplaceWithMutation {
  constructor(
    thisWrapper: NodePathMutationWrapper<any, any>,
    private readonly replacementWrapper: NodePathMutationWrapper<any, any>,
  ) {
    super(thisWrapper);
  }

  setupValue(data, rootPath) {
    return (this.replacementWrapper.traverseToThisPath(rootPath) as NodePath).node;
  }
}

export class ReplaceWithDynamicMutation extends AbstractReplaceWithMutation {
  constructor(
    thisWrapper: NodePathMutationWrapper<any, any>,
    private readonly getReplacement: ValueFromPathFn<any, any, t.Node | t.Node[]>,
  ) {
    super(thisWrapper);
  }

  setupValue(data, rootPath) {
    return this.getReplacement(data, rootPath);
  }
}

export class RemoveMutation implements WrapperMutation<any, NodePath> {
  constructor(private readonly thisWrapper: NodePathMutationWrapper<any, any>) {}

  setup(data, rootPath) {
    return this.thisWrapper.traverseToThisPath(rootPath) as NodePath;
  }

  execute(path) {
    path.remove();
  }
}

export class NodePathMutationWrapper<D, T = t.Node> {
  constructor(
    public readonly keys: TraverseKey[],
    private readonly reads: TraverseKey[][],
    public readonly writes: TraverseKey[][],
    public readonly mutations: WrapperMutation<D, any>[],
  ) {}

  getDependencies(nodePath: NodePath<T>): DependencyInfo {
    return {
      reads: keysToDependencyList(nodePath, this.reads),
      writes: keysToDependencyList(nodePath, this.writes),
    };
  }

  registerAsWriteDependency() {
    this.writes.push(this.keys);
  }

  traverseToThisPath(nodePath: NodePath<any> | NodePath<any>[]) {
    return traverseKeys(nodePath, this.keys);
  }

  public get(key: GetFnKey<T> | number): NodePathMutationWrapper<D, t.Node> {
    const traverse = [...this.keys, key];
    this.reads.push(traverse);
    const wrapper = new NodePathMutationWrapper(
      traverse,
      this.reads,
      this.writes,
      this.mutations,
    );
    return wrapper;
  }

  public setDataDynamic(
    key: SetDataFnKey<T>,
    getValue: ValueFromPathFn<D, any, SetDataFnValue<T>>,
  ): any {
    this.writes.push([...this.keys, key]);
    this.mutations.push(new SetDataDynamicMutation(key, this, getValue));
  }

  public set(key: SetFnKey<T>, wrapper: NodePathMutationWrapper<D, t.Node>) {
    this.writes.push([...this.keys, key]);
    this.mutations.push(new SetMutation(key, this, wrapper));
  }

  public setDynamic(key: SetFnKey<T>, getNode: ValueFromPathFn<D, any, SetFnNode<T>>) {
    this.writes.push([...this.keys, key]);
    this.mutations.push(new SetDynamicMutation(key, this, getNode));
  }

  public replaceWith(wrapper: NodePathMutationWrapper<D>) {
    this.writes.push(this.keys);
    this.mutations.push(new ReplaceWithMutation(this, wrapper));
  }

  public replaceWithDynamic(getReplacement: ValueFromPathFn<D, any, t.Node | t.Node[]>) {
    this.writes.push(this.keys);
    this.mutations.push(new ReplaceWithDynamicMutation(this, getReplacement));
  }

  public remove() {
    this.writes.push(this.keys);
    this.mutations.push(new RemoveMutation(this));
  }
}

export const createMutationSequenceFactory = <D, T>(
  mutationSteps: (wrapper: NodePathMutationWrapper<D, T>) => any,
) => {
  const wrapper = new NodePathMutationWrapper<D, T>([], [], [], []);
  mutationSteps(wrapper);
  return wrapper;
};

export const findParentWithType = (path: NodePath) =>
  path.find(
    (parentPath) =>
      parentPath.node !== null &&
      parentPath.node !== undefined &&
      parentPath.node.type !== null &&
      parentPath.node.type !== undefined,
  );

export class Instruction<D> {
  public readonly typedDependencies: Map<string, DependencyInfo> = new Map();
  public readonly typedWriteDependencyKeys: string[];

  public readonly conflictWriteDependencyKeys: string[];

  public readonly indirectDependencies: Map<string, DependencyInfo> = new Map();
  public readonly indirectWriteDependencyKeys: string[];
  public variantIndex = 0;
  constructor(
    public readonly type: symbol,
    public readonly conflictDependencies: Map<string, DependencyInfo>,
    public readonly mutations: Mutation<D, any>[],
    public readonly variants: D[] | undefined,
  ) {
    const typedDependencies: Map<string, DependencyInfo> = new Map();
    for (const [filePath, fileDependencies] of conflictDependencies) {
      typedDependencies.set(filePath, {
        writes: [...new Set(fileDependencies.writes.map(findParentWithType))],
        reads: [...new Set(fileDependencies.reads.map(findParentWithType))],
      });
    }

    this.typedDependencies = typedDependencies;
    this.indirectDependencies = getDependencyPathMap(this.typedDependencies);

    this.conflictWriteDependencyKeys = dependenciesToWriteKeys(this.conflictDependencies);
    this.indirectWriteDependencyKeys = dependenciesToWriteKeys(this.indirectDependencies);
    this.typedWriteDependencyKeys = dependenciesToWriteKeys(this.typedDependencies);
  }
}

type ConditionFn = (path: NodePath) => boolean;
type CreateVariantsFn<D, T> = (path: NodePath<T>) => D[];
export type DependencyInfo = {
  reads: NodePath<any>[];
  writes: NodePath<any>[];
};

export const dependenciesToWriteKeys = (
  dependencies: Map<string, DependencyInfo>,
): string[] => [
  ...new Set(
    [...dependencies]
      .map(([filePath, dependency]) =>
        dependency.writes.map((writePath) => pathToPrimaryKey(filePath, writePath)),
      )
      .flat(),
  ),
];

export type AbstractInstructionFactory<D> = {
  setup?: (asts: Map<string, t.File>) => void;
  createInstructions(asts: Map<string, t.File>): IterableIterator<Instruction<D>>;
};

type InstructionFactoryPayload<D, T> = {
  type: symbol;
  wrapper: NodePathMutationWrapper<D, T>;
  variants: D[] | undefined;
};

class InstructionFactoryMutation<D> implements Mutation<D, any> {
  constructor(
    private readonly filePath: string,
    private readonly pathKeys: TraverseKey[],
    private readonly wrapperMutation: WrapperMutation<D, any>,
  ) {}

  setup(newAsts, data: D) {
    const newAst = newAsts.get(this.filePath)!;
    const astPath = getAstPath(newAst);
    return this.wrapperMutation.setup(data, traverseKeys(astPath, this.pathKeys));
  }

  execute(state) {
    return this.wrapperMutation.execute(state);
  }
}

export const mutationWrapperToInstruction = (
  type: symbol,
  filePath: string,
  wrapper: NodePathMutationWrapper<any>,
  rootPath: NodePath,
  pathKeys: TraverseKey[],
  variants: any[] | undefined,
) => {
  const dependencies = new Map([[filePath, wrapper.getDependencies(rootPath)]]);
  return new Instruction(
    type,
    dependencies,
    wrapper.mutations.map(
      (wrapperMutation) =>
        new InstructionFactoryMutation(filePath, pathKeys, wrapperMutation),
    ),
    variants,
  );
};

export class InstructionFactory implements AbstractInstructionFactory<any> {
  constructor(
    private readonly simpleInstructionFactories: AbstractSimpleInstructionFactory<
      any,
      any
    >[],
  ) {}

  setup(asts: Map<string, t.File>) {
    const setupObjects = this.simpleInstructionFactories.map((factory) =>
      factory.setup(),
    );
    for (const ast of asts.values()) {
      traverse(ast, {
        enter: (path) => {
          for (const setupObject of setupObjects) {
            setupObject?.enter?.(path);
          }
        },
        exit: (path) => {
          for (const setupObject of setupObjects) {
            setupObject?.exit?.(path);
          }
        },
      });
    }
  }

  *createInstructions(asts: Map<string, t.File>): IterableIterator<Instruction<any>> {
    for (const [filePath, ast] of asts) {
      const instructions: Instruction<any>[] = [];
      const enter = (path) => {
        let pathKeys: TraverseKey[] = null!;
        for (const instructionFactory of this.simpleInstructionFactories) {
          for (const { type, wrapper, variants } of instructionFactory.pathToInstructions(
            path,
          )) {
            if (pathKeys === null) {
              pathKeys = getTraverseKeys(path);
            }
            const newInstruction = mutationWrapperToInstruction(
              type,
              filePath,
              wrapper,
              path,
              pathKeys,
              variants,
            );
            instructions.push(newInstruction);
          }
        }
      };
      traverse(ast, {
        enter,
      });
      yield* instructions;
    }
  }
}

type PathToInstructionsFn<D, T> = (
  path: NodePath,
) => IterableIterator<InstructionFactoryPayload<D, T>>;
type SetupFn = (path: NodePath) => any;
type CreateSetupObjFn = () => {
  enter?: SetupFn;
  exit?: SetupFn;
} | null;

export type AbstractSimpleInstructionFactory<D, T> = {
  pathToInstructions: PathToInstructionsFn<D, T>;
  setup: CreateSetupObjFn;
};

export const simpleInstructionFactory = <D, T>(
  pathToInstructions: PathToInstructionsFn<D, T>,
  setup: CreateSetupObjFn = () => null,
): AbstractSimpleInstructionFactory<D, T> => ({
  pathToInstructions,
  setup,
});

class SimpleInstructionFactory<D, T> implements AbstractSimpleInstructionFactory<D, T> {
  constructor(
    private type: symbol,
    private wrapper: NodePathMutationWrapper<D, T>,
    private condition: ConditionFn,
    private createVariantFn?: CreateVariantsFn<D, T>,
    public readonly setup: CreateSetupObjFn = () => null,
  ) {}

  *pathToInstructions(path: NodePath) {
    if (this.condition(path)) {
      const variants =
        this.createVariantFn === undefined
          ? undefined
          : this.createVariantFn(path as any);
      if (variants === undefined || variants.length >= 1) {
        const wrapperMutation = {
          type: this.type,
          wrapper: this.wrapper,
          variants,
        };
        yield wrapperMutation;
      }
    }
  }
}

export function* gatherInstructions(
  factories: Iterable<AbstractInstructionFactory<any>>,
  asts: Map<string, t.File>,
) {
  for (const factory of factories) {
    if (factory.setup !== undefined) {
      factory.setup(asts);
    }
    yield* factory.createInstructions(asts);
  }
}

const createFilePathToCodeMap = async (
  filePaths: string[],
): Promise<Map<string, string>> => {
  const entries = await Promise.all(
    filePaths.map(async (filePath: string): Promise<[string, string]> => {
      const code = await readFile(filePath, 'utf8');
      return [filePath, code];
    }),
  );
  entries.sort(([filePath1], [filePath2]) => filePath1.localeCompare(filePath2));
  return new Map(entries);
};

/*const isParentOrChild = (path1: NodePath<any>, path2: NodePath<any>) => {
  // TODO: Could be faster
  const keys1 = getTraverseKeys(path1);
  const keys2 = getTraverseKeys(path2);
  let k = 0;
  while (k < keys1.length && k < keys2.length) {
    if (keys1[k] !== keys2[k]) {
      return false;
    }
    k++;
  }

  // TODO: Would be faster if we just got the filePath from somewhere
  const programPath1 = path1.find((p) => p.isProgram());
  const programPath2 = path2.find((p) => p.isProgram());

  const isSameProgram = programPath1.node === programPath2.node;
  return isSameProgram;
};

const isConflictingPaths = (d1: NodePath[], d2: NodePath[]) => {
  return d1.some((path) => d2.some((otherPath) => isParentOrChild(path, otherPath)));
};

const isConflictingDependencyInfos = (info1: DependencyInfo, info2: DependencyInfo) => {
  return (
    isConflictingPaths(info1.reads, info2.writes) ||
    isConflictingPaths(info2.reads, info1.writes) ||
    isConflictingPaths(info1.writes, info2.writes)
  );
};

const isConflictingDependencies = (
  map1: Map<string, DependencyInfo>,
  map2: Map<string, DependencyInfo>,
) => {
  for (const [filePath, info1] of map1) {
    const info2 = map2.get(filePath);
    if (info2 !== undefined) {
      if (isConflictingDependencyInfos(info1, info2)) {
        return true;
      }
    }
  }
  return false;
};*/

const organizeInstructions = (instructions: Iterable<Instruction<any>>) => {
  return [...instructions].map((instruction) => [instruction]);
  /*
  const instructionBlocks: Instruction<any>[][] = [];
  for(const newInstruction of instructions) {
    let addANewBlock = true;
    for(const instructions of instructionBlocks) {
      const conflict = instructions.some((instruction) => {
        return isConflictingDependencies(newInstruction.conflictDependencies, instruction.conflictDependencies);
      });
      if (!conflict) {
        instructions.push(newInstruction);
        addANewBlock = false;
        break;
      }
    }
    if (addANewBlock) {
      instructionBlocks.push([newInstruction]);
    }
  }
  return instructionBlocks;*/
};

export const executeInstructions = (
  asts: Map<string, t.File>,
  instructions: Iterable<Instruction<any>>,
): void => {
  [...instructions]
    .map((instruction) =>
      instruction.mutations.map((mutation) => ({
        mutation,
        state: mutation.setup(
          asts,
          instruction.variants === undefined
            ? undefined
            : instruction.variants[instruction.variantIndex],
        ),
      })),
    )
    .forEach((payload) => payload.map(({ mutation, state }) => mutation.execute(state)));
};

export const getAstPath = (ast: t.File): NodePath<t.Program> => {
  let filePath: NodePath<t.Program>;

  traverse(ast, {
    enter: (path) => {
      if (path.isProgram()) {
        filePath = path;
      } else {
        path.skip();
      }
    },
  });

  return filePath!;
};

export const forceConsequentSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, t.IfStatement>) => {
    // TODO: Add this back once you implement conflict-only dependencies: path.get('alternate').registerAsWriteDependency();
    path.setDynamic('test', () => t.booleanLiteral(true));
  },
);
export const FORCE_CONSEQUENT = Symbol('force-consequent');
export const forceConsequentFactory = new SimpleInstructionFactory(
  FORCE_CONSEQUENT,
  forceConsequentSequence,
  (path) => {
    if (!path.isIfStatement()) {
      return false;
    }
    const test = path.get('test');
    if (!test.isBooleanLiteral()) {
      return true;
    }
    return !test.node.value;
  },
);

export const forceAlternateSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, t.IfStatement>) => {
    //TODO: Add this back once you implement conflict-only dependencies: path.get('consequent').registerAsWriteDependency();
    path.setDynamic('test', () => t.booleanLiteral(false));
  },
);

export const FORCE_ALTERNATE = Symbol('force-alternate');
export const forceAlternateFactory = new SimpleInstructionFactory(
  FORCE_ALTERNATE,
  forceAlternateSequence,
  (path) => {
    if (!path.isIfStatement()) {
      return false;
    }
    const test = path.get('test');
    if (!test.isBooleanLiteral()) {
      return true;
    }

    return test.node.value;
  },
);

export const replaceValueSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<any, any>) => {
    path.setDataDynamic('value', (value) => value);
  },
);

export const filterVariantDuplicates = <T>(arr: T[]): T[] => {
  const seen: Set<T> = new Set();
  const filtered: T[] = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (seen.has(v)) {
      continue;
    }
    filtered.unshift(v);
    seen.add(v);
  }
  return filtered;
};

type ValueVariantInfo = {
  nodeNumber: number;
  value: any;
};

type ScopedNodeVariantInfo = {
  node: t.Node;
  nodeNumber: number;
};
const createValueVariantCollector = (
  condition: ConditionFn,
  symbol: symbol,
  key = 'value',
  collectCondition: ConditionFn = condition,
): CreateSetupObjFn => {
  return () => {
    let count = 0;
    const blocks: ValueVariantInfo[][] = [[]];
    const scopedNodes: ScopedNodeVariantInfo[][] = [];
    return {
      enter: (subPath) => {
        count++;
        if (subPath.isScope()) {
          blocks.push([]);
          scopedNodes.push([]);
        }
        if (condition(subPath)) {
          scopedNodes[scopedNodes.length - 1].push({
            node: subPath.node,
            nodeNumber: count,
          });
        }
        if (collectCondition(subPath)) {
          const current = (subPath.node as any)[key];
          blocks[blocks.length - 1].push({
            value: current,
            nodeNumber: count,
          });
        }
      },
      exit: (subPath) => {
        if (subPath.isScope()) {
          for (const { node, nodeNumber } of scopedNodes[scopedNodes.length - 1]) {
            node[symbol] = filterVariantDuplicates(
              ([] as ValueVariantInfo[])
                .concat(...blocks)
                .filter((info) => info.value !== node[key])
                .sort(
                  (a, b) =>
                    Math.abs(nodeNumber - b.nodeNumber) -
                    Math.abs(nodeNumber - a.nodeNumber),
                )
                .map((info) => info.value),
            );
          }
          blocks.pop();
          scopedNodes.pop();
        }
      },
    };
  };
};

export const createValueInstructionFactory = (
  condition: ConditionFn,
  factorySymbol,
  symbol: symbol,
) => {
  return new SimpleInstructionFactory<void, t.Node>(
    factorySymbol,
    replaceValueSequence,
    condition,
    (path) => {
      return [...path.node[symbol as any]];
    },
    createValueVariantCollector(condition, symbol),
  );
};

const isReplaceableStringLiteral = (path: NodePath) => {
  return (
    path.isStringLiteral() &&
    path.find((parentPath) => parentPath.isImportDeclaration()) == null
  );
};
export const CHANGE_STRING = Symbol('change-string');
const STRINGS = Symbol('strings');
export const replaceStringFactory = new SimpleInstructionFactory(
  CHANGE_STRING,
  createMutationSequenceFactory((wrapper) => {
    wrapper.setDataDynamic('value', (aString) => aString);
  }),
  isReplaceableStringLiteral,
  (path: NodePath) => [...path.node[STRINGS]],
  createValueVariantCollector(isReplaceableStringLiteral, STRINGS, 'value'),
);

export const NUMBERS = Symbol('numbers');
const isNumberLiteral = (path: NodePath) => path.isNumericLiteral();
export const CHANGE_NUMBER = Symbol('change-number');
export const replaceNumberFactory = new SimpleInstructionFactory(
  CHANGE_NUMBER,
  replaceValueSequence,
  isNumberLiteral,
  (nodePath: NodePath<t.NumericLiteral>) => {
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
      ...new Set([...nodePath.node[NUMBERS], node.value - 1, node.value + 1]),
    ]
      .filter((value) => !filterOut.has(value))
      .sort((a, b) => Math.abs(b - node.value) - Math.abs(a - node.value));
    return values;
  },
  createValueVariantCollector(isNumberLiteral, NUMBERS),
);

const CHANGE_BOOLEAN = Symbol('change-boolean');
export const replaceBooleanFactory = new SimpleInstructionFactory(
  CHANGE_BOOLEAN,
  replaceValueSequence,
  (path) => path.isBooleanLiteral(),
  (path: NodePath<t.BooleanLiteral>) => [!path.node.value],
);

type IdentifierProps = string;
export const replaceIdentifierSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<IdentifierProps, t.Identifier>) => {
    path.setDataDynamic('name', (name) => name);
  },
);
const isInvalidReplaceIdentifierParentPath = (parentPath: NodePath) => {
  return (
    parentPath.parentPath.isImportDeclaration() ||
    (parentPath.parentPath.isVariableDeclarator() && parentPath.key === 'id') ||
    (parentPath.parentPath.isFunction() &&
      (typeof parentPath.key === 'number' || parentPath.key === 'id'))
  );
};
const isReplaceableIdentifier = (path: NodePath) => {
  if (path.isIdentifier()) {
    const statementPath = path.find(
      (subPath) => subPath.isStatement() || subPath.isFunction(),
    );
    return (
      path.find(
        (parentPath) =>
          parentPath.node === statementPath.node ||
          isInvalidReplaceIdentifierParentPath(parentPath),
      ).node === statementPath.node
    );
  }
  return false;
};

export const REPLACEMENT_IDENTIFIER_PATHS = Symbol('previous-identifer-names');
export const CHANGE_IDENTIFIER = Symbol('change-identifier');

export const MARKED = Symbol('marked');
export const IDENTIFIER_INFO = Symbol('identifier-info');
export type IdentifierInfo = {
  sequence: AccessInfo[];
  index: number;
};
export type IdentifierTemp = {
  identifier: t.Identifier;
  index: number;
};
export const FUNCTION_ACCESS = Symbol('function-access');
export const MEMBER_ACCESS = Symbol('member-access');
export const UNKNOWN_ACCESS = Symbol('unknown-access');
export const CONSTRUCTOR_ACCESS = Symbol('constructor-access');
export const LITERAL_ACCESS = Symbol('literal-access');
export type FunctionAccessInfo = {
  type: typeof FUNCTION_ACCESS;
  name: string;
  argCount: number;
};

export type MemberAccessInfo = {
  type: typeof MEMBER_ACCESS;
  name: string;
};

export type UnknownAccessInfo = {
  type: typeof UNKNOWN_ACCESS;
};

export type ConstructorAccessInfo = {
  type: typeof CONSTRUCTOR_ACCESS;
  name: string;
  argCount: number;
};

export type LiteralAccessInfo = {
  type: typeof LITERAL_ACCESS;
  literalType: any;
};

export type AccessInfo =
  | FunctionAccessInfo
  | MemberAccessInfo
  | UnknownAccessInfo
  | ConstructorAccessInfo
  | LiteralAccessInfo;

export const innerMostMemberExpression = (path: NodePath) => {
  let current = path;
  if (current.isIdentifier() && current.parentPath.isMemberExpression()) {
    current = current.parentPath;
  }
  do {
    if (current.isMemberExpression()) {
      current = current.get('object');
    } else if (current.isCallExpression()) {
      current = current.get('callee');
    }
  } while (current.isMemberExpression() || current.isCallExpression());
  return current;
};
export const pathsToAccessInfo = (
  currentPath: NodePath,
  identifierPath: NodePath<t.Identifier>,
): AccessInfo => {
  if (currentPath.parentPath.isCallExpression()) {
    return {
      type: FUNCTION_ACCESS,
      argCount: currentPath.parentPath.node.arguments.length,
      name: identifierPath.node.name,
    };
  } else if (currentPath.parentPath.isNewExpression()) {
    return {
      type: CONSTRUCTOR_ACCESS,
      argCount: currentPath.parentPath.node.arguments.length,
      name: identifierPath.node.name,
    };
  } else {
    return {
      type: MEMBER_ACCESS,
      name: identifierPath.node.name,
    };
  }
};
export const collectParentIdentifierInfo = (path: NodePath) => {
  path = innerMostMemberExpression(path);
  const accesses: AccessInfo[] = [];

  let current = path;
  const identifiers: IdentifierTemp[] = [];
  do {
    if (current.isIdentifier()) {
      accesses.push(pathsToAccessInfo(current, current));
      identifiers.push({
        identifier: current.node,
        index: accesses.length - 1,
      });
    } else if (current.isMemberExpression()) {
      const property = current.get('property');
      if (!Array.isArray(property) && property.isIdentifier()) {
        accesses.push(pathsToAccessInfo(current, property));
        identifiers.push({
          identifier: property.node,
          index: accesses.length - 1,
        });
      } else {
        accesses.push({
          type: UNKNOWN_ACCESS,
        });
      }
    } else if (!current.isCallExpression()) {
      if (current.isLiteral()) {
        accesses.push({
          type: LITERAL_ACCESS,
          literalType: current.type,
        });
      } else {
        accesses.push({
          type: UNKNOWN_ACCESS,
        });
      }
    }
    current = current.parentPath;
  } while (
    current != null &&
    (current.isIdentifier() ||
      current.isMemberExpression() ||
      current.isCallExpression() ||
      current.isNewExpression())
  );

  for (const temp of identifiers) {
    temp.identifier[IDENTIFIER_INFO] = {
      index: temp.index,
      sequence: accesses,
    };
  }

  return accesses;
};

const accessInfoMatchExcludingName = (info1: AccessInfo, info2: AccessInfo) => {
  if (info1.type !== info2.type) {
    return false;
  }
  switch (info1.type) {
    case CONSTRUCTOR_ACCESS: {
      const other = info2 as ConstructorAccessInfo;
      return info1.argCount === other.argCount;
    }
    case FUNCTION_ACCESS: {
      const other = info2 as () => voidAccessInfo;
      return info1.argCount === other.argCount;
    }
    case MEMBER_ACCESS: {
      return true;
    }
    case UNKNOWN_ACCESS: {
      return false;
    }
    case LITERAL_ACCESS: {
      const other = info2 as LiteralAccessInfo;
      return info1.literalType === other.literalType;
    }
    default: {
      throw new Error(`${(info1 as any).type} not supported`);
    }
  }
};

export const accessInfoMatch = (info1: AccessInfo, info2: AccessInfo) =>
  accessInfoMatchExcludingName(info1, info2) &&
  (info1 as any).name === (info2 as any).name;

export const getReplacementIdentifierNode = (
  identifierInfo: IdentifierInfo,
  otherSequence: AccessInfo[],
): AccessInfo | null => {
  const accessSequence = identifierInfo.sequence;
  const index = identifierInfo.index;

  if (index >= otherSequence.length) {
    return null;
  }
  let i = 0;
  while (
    i < accessSequence.length &&
    i < otherSequence.length &&
    accessInfoMatch(accessSequence[i], otherSequence[i])
  ) {
    i++;
  }

  if (i !== index) {
    // Perfect match, skip
    return null;
  }

  let j = i + 1;
  while (
    j < accessSequence.length &&
    j < otherSequence.length &&
    accessInfoMatch(accessSequence[j], otherSequence[j])
  ) {
    j++;
  }

  if (j < accessSequence.length) {
    // This means there's at least 2 mismatches. Skip.
    return null;
  }

  if (!accessInfoMatchExcludingName(otherSequence[i], accessSequence[i])) {
    return null;
  }

  return otherSequence[i];
};

export const isUsedAsObject = (
  identifierInfo: IdentifierInfo,
  sequences: AccessInfo[][],
) => {
  const accessSequence = identifierInfo.sequence;
  return sequences.some((sequence) => {
    if (sequence.length <= accessSequence.length) {
      return false;
    }

    let i = 0;
    while (i < accessSequence.length) {
      if (!accessInfoMatch(accessSequence[i], sequence[i])) {
        return false;
      }
      i++;
    }

    return true;
  });
};

export const replaceIdentifierFactory = new SimpleInstructionFactory(
  CHANGE_IDENTIFIER,
  replaceIdentifierSequence,
  isReplaceableIdentifier,
  (path) => [...path.node[REPLACEMENT_IDENTIFIER_PATHS]],
  () => {
    const blocks: AccessInfo[][][] = [[]];
    return {
      enter: (path: NodePath) => {
        if (path.isScope()) {
          blocks.push([]);
        }
        if (path.isIdentifier()) {
          const previousPaths: string[] = [];

          if (path.node[IDENTIFIER_INFO] === undefined) {
            const longestAccessSequence = collectParentIdentifierInfo(path);
            // Only the full access path gets added for comparison
            blocks[blocks.length - 1].push(longestAccessSequence);
          }

          if (!(path.parentPath.isVariableDeclarator() && path.key === 'id')) {
            const identifierInfo: IdentifierInfo = path.node[IDENTIFIER_INFO];

            const parentDeclarator = path.find(
              (subPath) =>
                subPath.isVariableDeclarator() ||
                subPath.isStatement() ||
                subPath.isAssignmentExpression(),
            );
            const isOnLeftSide = !parentDeclarator.isStatement();
            const operatorParent = path.find(
              (subPath) =>
                subPath.isAssignmentExpression() ||
                subPath.isBinaryExpression() ||
                subPath.isUnaryExpression() ||
                subPath.isStatement(),
            );
            const isUsedWithOperator = !operatorParent.isStatement();

            const exclude: Set<string> = new Set();
            if (parentDeclarator.parentPath.isVariableDeclaration()) {
              const declarationPath = parentDeclarator.parentPath;
              for (const declaratorPath of declarationPath.get('declarations')) {
                const idPath = declaratorPath.get('id');
                if (idPath.isIdentifier()) {
                  exclude.add(idPath.node.name);
                }
              }
            }

            for (const otherSequences of blocks) {
              for (const otherSequence of otherSequences) {
                const info = getReplacementIdentifierNode(identifierInfo, otherSequence);
                if (info === null) {
                  continue;
                }
                const usedAsObject = isUsedAsObject(
                  { sequence: otherSequence, index: otherSequence.length - 1 },
                  otherSequences,
                );
                if (info.type === UNKNOWN_ACCESS) {
                  throw new Error(
                    `Was not expecting to match with access info of type ${info.type.toString()}`,
                  );
                }
                if (info.type === LITERAL_ACCESS) {
                  // TODO: Could possibly consider replacing literals too
                  continue;
                }
                if (isUsedWithOperator && usedAsObject) {
                  continue;
                }
                if (info.name === 'undefined' && isOnLeftSide) {
                  continue;
                }
                if (exclude.has(info.name)) {
                  continue;
                }
                previousPaths.push(info.name);
              }
            }
          }
          path.node[REPLACEMENT_IDENTIFIER_PATHS] =
            filterVariantDuplicates(previousPaths);
        }
      },
      exit: (path) => {
        if (path.isScope()) {
          blocks.pop();
        }
      },
    };
  },
);

type LogicalOrBinaryExpression = t.BinaryExpression | t.LogicalExpression;

type OperatorProps = string;
export const createCategoryVariantFactory = (
  key: string,
  categoryData: CategoryData<any>,
) => {
  return (path: NodePath) => {
    const operator = path.node[key];
    const operators = matchAndFlattenCategoryData(categoryData, operator);
    return operators;
  };
};
export const replaceBinaryOrLogicalOperatorSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<OperatorProps, LogicalOrBinaryExpression>) => {
    const left = path.get('left') as NodePathMutationWrapper<
      OperatorProps,
      LogicalOrBinaryExpression
    >;
    const right = path.get('right') as NodePathMutationWrapper<
      OperatorProps,
      LogicalOrBinaryExpression
    >;
    path.replaceWithDynamic((operator, nodePath) => {
      const leftNode = (left.traverseToThisPath(nodePath) as any).node;
      const rightNode = (right.traverseToThisPath(nodePath) as any).node;
      if (['||', '&&'].includes(operator)) {
        return t.logicalExpression(operator as any, leftNode, rightNode);
      } else {
        return t.binaryExpression(operator as any, leftNode, rightNode);
      }
    });
  },
);
const isBinaryOrLogicalExpression = (path: NodePath) =>
  path.isBinaryExpression() || path.isLogicalExpression();
export const CHANGE_BINARY_OPERATOR = Symbol('change-binary-operator');
export const replaceBinaryOrLogicalOperatorFactory = new SimpleInstructionFactory(
  CHANGE_BINARY_OPERATOR,
  replaceBinaryOrLogicalOperatorSequence,
  isBinaryOrLogicalExpression,
  createCategoryVariantFactory('operator', binaryOperationCategories),
);

export const leftNullifyBinaryOperatorSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, LogicalOrBinaryExpression>) => {
    const right = path.get('right') as NodePathMutationWrapper<
      void,
      LogicalOrBinaryExpression
    >;
    path.replaceWith(right);
  },
);

export const NULLIFY_LEFT_OPERATOR = Symbol('nullify-left-operator');
export const leftNullifyBinaryOrLogicalOperatorFactory = new SimpleInstructionFactory(
  NULLIFY_LEFT_OPERATOR,
  leftNullifyBinaryOperatorSequence,
  isBinaryOrLogicalExpression,
);

export const rightNullifyBinaryOperatorSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, LogicalOrBinaryExpression>) => {
    const left = path.get('left') as NodePathMutationWrapper<
      void,
      LogicalOrBinaryExpression
    >;
    path.replaceWith(left);
  },
);
export const NULLIFY_RIGHT_OPERATOR = Symbol('nullify-right-operator');
export const rightNullifyBinaryOrLogicalOperatorFactory = new SimpleInstructionFactory(
  NULLIFY_RIGHT_OPERATOR,
  rightNullifyBinaryOperatorSequence,
  isBinaryOrLogicalExpression,
);

export const assignmentSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<OperatorProps, t.AssignmentExpression>) => {
    path.setDataDynamic('operator', (operator) => operator);
  },
);

export const assignmentCategories = [
  [
    ['^=', '&=', '|='],
    ['>>>=', '&=', '>>='],
    ['|=', '<<='],
    ['&=', '|='],
    ['>>>=', '>>=', '<<='],
  ],
  [
    ['/=', '*='],
    ['-=', '+='],
  ],
];
export const CHANGE_ASSIGNMENT_OPERATOR = Symbol('change-assignment-operator');
export const replaceAssignmentOperatorFactory = new SimpleInstructionFactory(
  CHANGE_ASSIGNMENT_OPERATOR,
  assignmentSequence,
  (path) => {
    if (!path.isAssignmentExpression()) {
      return false;
    }
    const left = path.get('left');
    return left.isMemberExpression() || left.isIdentifier();
  },
  createCategoryVariantFactory('operator', assignmentCategories),
);

type SwapFunctionCallArgs = {
  index1: number;
  index2: number;
};
export const swapFunctionCallArgumentsSequence = ({
  index1,
  index2,
}: SwapFunctionCallArgs) => {
  return createMutationSequenceFactory(
    (wrapper: NodePathMutationWrapper<void, t.CallExpression>) => {
      const params = wrapper.get('arguments');

      const param1 = params.get(index1);
      const param2 = params.get(index2);

      param1.replaceWith(param2);
      param2.replaceWith(param1);
    },
  );
};

export const SWAP_FUNCTION_CALL = Symbol('swap-function-call');
export const swapFunctionCallArgumentsFactory = simpleInstructionFactory(function* (
  nodePath: NodePath,
) {
  if (nodePath.isCallExpression() && nodePath.node.loc) {
    const node = nodePath.node;
    for (let p = 1; p < node.arguments.length; p++) {
      const wrapper = swapFunctionCallArgumentsSequence({
        index1: p - 1,
        index2: p,
      });
      yield {
        type: SWAP_FUNCTION_CALL,
        wrapper,
        variants: undefined,
      };
    }
  }
});

export const swapFunctionDeclarationParametersSequence = ({
  index1,
  index2,
}: SwapFunctionCallArgs) => {
  return createMutationSequenceFactory(
    (wrapper: NodePathMutationWrapper<void, t.FunctionDeclaration>) => {
      const params = wrapper.get('params');

      const param1 = params.get(index1);
      const param2 = params.get(index2);

      param1.replaceWith(param2);
      param2.replaceWith(param1);
    },
  );
};

export const SWAP_FUNCTION_PARAMS = Symbol('swap-function-params');
export const swapFunctionDeclarationParametersFactory = simpleInstructionFactory(
  function* (nodePath) {
    if (nodePath.isFunction() && nodePath.node.loc) {
      const node = nodePath.node;
      for (let p = 1; p < node.params.length; p++) {
        const wrapper = swapFunctionDeclarationParametersSequence({
          index1: p - 1,
          index2: p,
        });
        yield {
          type: SWAP_FUNCTION_PARAMS,
          wrapper,
          variants: undefined,
        };
      }
    }
  },
);

type DeleteStatementArgs = {
  index: number;
};
export const deleteStatementSequence = ({ index }: DeleteStatementArgs) => {
  return createMutationSequenceFactory(
    (wrapper: NodePathMutationWrapper<void, t.Node>) => {
      const statement = wrapper.get('body').get(index);
      statement.remove();
    },
  );
};

export const DELETE_STATEMENT = Symbol('delete-statement');
export const deleteStatementFactory = simpleInstructionFactory(function* (path) {
  if (path.isBlock() || path.isProgram()) {
    const bodyPaths = path.get('body');
    if (Array.isArray(bodyPaths)) {
      for (let b = 0; b < bodyPaths.length; b++) {
        const statementPath = bodyPaths[b];
        if (
          statementPath.isVariableDeclaration() ||
          statementPath.isIfStatement() ||
          statementPath.isFunction() ||
          statementPath.isReturnStatement()
        ) {
          continue;
        }
        yield {
          type: DELETE_STATEMENT,
          wrapper: deleteStatementSequence({ index: b }),
          variants: undefined,
        };
      }
    }
  }
});

const instructionFactories: InstructionFactory[] = [
  new InstructionFactory([
    leftNullifyBinaryOrLogicalOperatorFactory,
    rightNullifyBinaryOrLogicalOperatorFactory,
    deleteStatementFactory,
    replaceAssignmentOperatorFactory,
    replaceBinaryOrLogicalOperatorFactory,
    replaceBooleanFactory,
    replaceNumberFactory,
    replaceStringFactory,
    forceConsequentFactory,
    forceAlternateFactory,
    replaceIdentifierFactory,
    swapFunctionCallArgumentsFactory,
    swapFunctionDeclarationParametersFactory,
  ]),
];

const instructionTypeImportance: Map<symbol, number> = new Map(
  [
    NULLIFY_RIGHT_OPERATOR,
    NULLIFY_LEFT_OPERATOR,
    DELETE_STATEMENT,
    FORCE_CONSEQUENT,
    CHANGE_BINARY_OPERATOR,
    CHANGE_IDENTIFIER,
    CHANGE_STRING,
    FORCE_ALTERNATE,
    SWAP_FUNCTION_CALL,
    CHANGE_BOOLEAN,
    CHANGE_NUMBER,
    CHANGE_ASSIGNMENT_OPERATOR,
    SWAP_FUNCTION_PARAMS,
  ]
    .reverse()
    .map((symbol, i) => [symbol, i]),
);

export const addInstructionsToCoverageMap = (
  allInstructions: Instruction<any>[],
  coverageObjs: Map<string, Map<string, CoveragePathObj>>,
) => {
  for (const instruction of allInstructions) {
    for (const [filePath, fileDependencies] of instruction.typedDependencies) {
      const fileObjMap = coverageObjs.get(filePath)!;
      if (fileObjMap === undefined) {
        continue;
      }
      for (const writePath of fileDependencies.writes) {
        let selectedObj: CoveragePathObj | null = null as any;
        writePath.find((path) => {
          if (path.node.loc == null) {
            return false;
          }
          const key = coverageKey(path.node.loc);
          const obj = fileObjMap.get(key);
          if (obj === undefined) {
            return false;
          }
          selectedObj = obj;
          return true;
        });
        if (selectedObj !== null) {
          selectedObj.instructions.add(instruction);
          for (const info of selectedObj.coveredBy) {
            info.coverageInfo.set(coverageKey(selectedObj.originalLocation), selectedObj);
          }
        }
      }
    }
  }
};

type CoveragePathObj = {
  path: NodePath;
  pathKey: string;
  originalLocation: Location;
  coveredBy: TestInformation[];
  instructions: Set<Instruction<any>>;
};

export const isRelevantTestFromCoverage = (
  testResult: TestResult,
  coverageFilePath: string,
  coverageLocation: ExpressionLocation,
) => {
  if (testResult.data.coverage === undefined) {
    return false;
  }

  const fileCoverage = testResult.data.coverage[coverageFilePath];
  if (fileCoverage === undefined) {
    return false;
  }

  for (const [key, expressionLocation] of Object.entries(fileCoverage.statementMap)) {
    if (
      expressionLocationEquals(expressionLocation, coverageLocation) &&
      fileCoverage.s[key] > 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  return false;
};

const findWidenedCoveragePaths = (
  astMap: Map<string, t.File>,
  locations: Location[],
  testInfoMap: Map<string, TestInformation>,
): Map<string, Map<string, CoveragePathObj>> => {
  const nodePaths: Map<string, Map<string, CoveragePathObj>> = new Map();
  for (const filePath of astMap.keys()) {
    nodePaths.set(filePath, new Map());
  }
  for (const [filePath, ast] of astMap.entries()) {
    const fileLocationPaths: Map<string, Location> = new Map(
      locations
        .filter((location) => filePath === location.filePath)
        .map((location) => [
          locationToKeyIncludingEnd(location.filePath, location),
          location,
        ]),
    );

    traverse(ast, {
      enter(path: NodePath) {
        const loc = path.node.loc;
        if (loc == null) {
          return;
        }
        const key = locationToKeyIncludingEnd(filePath, loc);
        if (!fileLocationPaths.has(key)) {
          return;
        }
        const originalLocation = fileLocationPaths.get(key)!;
        fileLocationPaths.delete(key);

        const widenedPath = widenCoveragePath(path);

        const coveredBy: TestInformation[] = [];
        for (const info of testInfoMap.values()) {
          if (isRelevantTestFromCoverage(info.result, filePath, originalLocation)) {
            coveredBy.push(info);
          }
        }

        nodePaths.get(filePath)!.set(coverageKey(loc), {
          instructions: new Set(),
          path: widenedPath,
          pathKey: pathToKey(widenedPath),
          originalLocation,
          coveredBy,
        });
      },
    });
  }
  return nodePaths;
};

export type TestEvaluation = {
  // Whether the exception that was thrown in the test has changed
  errorChanged: boolean | null;
  // How much better we're doing in terms of whether the test failed/passed
  endResultChange: number;
  previouslyFailing: boolean;
  stackScore: number | null;
};

export const suspiciousnessScore = (
  r1: NormalMutationEvaluation,
  testInfoMap: Map<string, TestInformation>,
) => {
  let score = 0;
  for (const key of r1.testsImproved) {
    const info = testInfoMap.get(key)!;
    score += 1 / (info.fixes + 1);
  }
  for (const key of r1.stackEvaluation.improvement) {
    const info = testInfoMap.get(key)!;
    score += 1 / (info.fixes + info.stackScoresImproved + 1);
  }
  for (const key of r1.errorsChanged) {
    const info = testInfoMap.get(key)!;
    score += 1 / (info.fixes + info.stackScoresImproved + info.errorChanges + 1);
  }
  for (const key of r1.stackEvaluation.degradation) {
    const info = testInfoMap.get(key)!;
    score -= (1 + info.unchanged + info.stackScoresDegraded) / (info.total + 1);
  }
  for (const key of r1.testsWorsened) {
    const info = testInfoMap.get(key);
    score -=
      info === undefined
        ? 1
        : (1 + info.unchanged + info.stackScoresDegraded + info.breaks) /
          (info.total + 1);
  }

  return score;
};

export const compareSolutionProperties = (
  r1: MutationEvaluation,
  r2: MutationEvaluation,
) => {
  const goodThingsHappened1 = changedOrImprovedError(r1);
  const goodThingsHappened2 = changedOrImprovedError(r2);
  const goodThingsHappenedComparison =
    (goodThingsHappened1 ? 1 : -1) - (goodThingsHappened2 ? 1 : -1);
  if (goodThingsHappenedComparison !== 0) {
    return goodThingsHappenedComparison;
  }

  if (!goodThingsHappened1 && !goodThingsHappened2) {
    return null;
  }

  const evaluationDidNothingBad1 = evaluationDidNothingBad(r1);
  const evaluationDidNothingBad2 = evaluationDidNothingBad(r2);
  const evaluationDidNothingBadComparison =
    (evaluationDidNothingBad1 ? 1 : -1) - (evaluationDidNothingBad2 ? 1 : -1);
  if (evaluationDidNothingBadComparison !== 0) {
    return evaluationDidNothingBadComparison;
  }

  return 0;
};

export const compareNodeEvaluations = (
  result1: NodeEvaluation,
  result2: NodeEvaluation,
  testInfoMap: Map<string, TestInformation>,
) => {
  const solutionComparison = compareSolutionProperties(
    result1.evaluation,
    result2.evaluation,
  );
  if (solutionComparison === null) {
    return 0;
  }
  if (solutionComparison !== 0) {
    return solutionComparison;
  }

  const r1 = result1.evaluation as NormalMutationEvaluation;
  const r2 = result2.evaluation as NormalMutationEvaluation;

  const score1 = suspiciousnessScore(r1, testInfoMap) / result1.nodes;
  const score2 = suspiciousnessScore(r2, testInfoMap) / result2.nodes;

  return score1 - score2;
};

/**
 * From worst evaluation to best evaluation
 */
export const compareNodeInformation = (
  info1: NodeInformation,
  info2: NodeInformation,
  testInfoMap: Map<string, TestInformation>,
) => {
  const a = info1.evaluations;
  const b = info2.evaluations;
  if (a.length <= 0 && b.length >= 1) {
    const evaluation2 = b.peek().evaluation;
    if (changedOrImprovedError(evaluation2)) {
      return -1;
    } else {
      return 1;
    }
  } else if (a.length >= 1 && b.length <= 0) {
    const evaluation1 = a.peek().evaluation;
    if (changedOrImprovedError(evaluation1)) {
      return 1;
    } else {
      return -1;
    }
  } else if (a.length >= 1 && b.length >= 1) {
    const instructionEvaluationComparison = compareNodeEvaluations(
      a.peek(),
      b.peek(),
      testInfoMap,
    );
    if (instructionEvaluationComparison !== 0) {
      return instructionEvaluationComparison;
    }
  }

  return 0;
};

/**
 * From worst evaluation to best evaluation
 */
export const compareMutationEvaluations = (
  result1: MutationEvaluation,
  result2: MutationEvaluation,
  testInfoMap: Map<string, TestInformation>,
) => {
  const solutionComparison = compareSolutionProperties(result1, result2);
  if (solutionComparison === null) {
    return 0;
  }
  if (solutionComparison !== 0) {
    return solutionComparison;
  }

  const r1 = result1 as NormalMutationEvaluation;
  const r2 = result2 as NormalMutationEvaluation;

  const score1 = suspiciousnessScore(r1, testInfoMap);
  const score2 = suspiciousnessScore(r2, testInfoMap);

  return score1 - score2;
};

export const executionDistanceFromStart = (
  ast: t.File,
  lineNumber: number,
  columnNumber: number,
): number | null => {
  let newDistanceFromStart = 0;
  let doneWithTraversal = false;
  traverse(ast, {
    exit: (path) => {
      if (doneWithTraversal) {
        path.skip();
        return;
      }
      newDistanceFromStart++;
      const node = path.node;
      const loc = node.loc;
      if (loc == null) {
        return;
      }

      if (loc.start.line === lineNumber && loc.start.column + 1 === columnNumber) {
        doneWithTraversal = true;
      }
    },
  });
  return doneWithTraversal ? newDistanceFromStart : null;
};

export const evaluateStackDifference = (
  originalResult: TestResult,
  newResult: TestResult,
  testAstMap: Map<string, t.File>,
): number | null => {
  // TODO: Just make passing test cases have null as the stack property
  if (
    (newResult.data as any).stack == null ||
    (originalResult.data as any).stack == null
  ) {
    return null;
  }
  const newStackInfo = ErrorStackParser.parse({
    stack: (newResult.data as any).stack,
  } as Error);
  const oldStackInfo = ErrorStackParser.parse({
    stack: (originalResult.data as any).stack,
  } as Error);

  const findFrameFn = (frame) =>
    normalize(originalResult.data.file).replace(/\\+/g, '/') ===
    normalize(frame.fileName).replace(/\\+/g, '/');
  const firstNewStackFrame = newStackInfo.find(findFrameFn);
  const firstOldStackFrame = oldStackInfo.find(findFrameFn);

  if (firstNewStackFrame == null || firstOldStackFrame == null) {
    return null;
  }

  if (firstNewStackFrame.fileName !== firstOldStackFrame.fileName) {
    return null;
  }

  const ast = testAstMap.get(newResult.data.file);
  if (ast === undefined) {
    return null;
  }

  if (
    firstOldStackFrame.lineNumber === undefined ||
    firstOldStackFrame.columnNumber === undefined ||
    firstOldStackFrame.lineNumber === null ||
    firstOldStackFrame.columnNumber === null
  ) {
    return null;
  }

  const originalDistanceFromStart = executionDistanceFromStart(
    ast,
    firstOldStackFrame.lineNumber,
    firstOldStackFrame.columnNumber,
  );
  if (originalDistanceFromStart === null) {
    return null;
  }

  if (
    firstNewStackFrame.lineNumber === undefined ||
    firstNewStackFrame.columnNumber === undefined ||
    firstNewStackFrame.lineNumber === null ||
    firstNewStackFrame.columnNumber === null
  ) {
    return null;
  }
  const newDistanceFromStart = executionDistanceFromStart(
    ast,
    firstNewStackFrame.lineNumber,
    firstNewStackFrame.columnNumber,
  );
  if (newDistanceFromStart === null) {
    return null;
  }

  return newDistanceFromStart - originalDistanceFromStart;
};

const EndResult = {
  BETTER: 1,
  UNCHANGED: 0,
  WORSE: -1,
};

export const evaluateModifiedTestResult = (
  originalResult: TestResult,
  newResult: TestResult,
  testAstMap: Map<string, t.File>,
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
  const stackScore = evaluateStackDifference(originalResult, newResult, testAstMap);

  const evaluation = {
    stackScore,
    endResultChange,
    errorChanged,
    previouslyFailing: !originalResult.data.passed,
  };
  return evaluation;
};

type MutationStackEvaluation = {
  improvement: string[];
  degradation: string[];
};
const createMutationStackEvaluation = (): MutationStackEvaluation => ({
  improvement: [],
  degradation: [],
});

export type CommonMutationEvaluation = {
  instructions: Instruction<any>[];
  /*
  type: symbol;
  totalNodes: number;
  atomicMutation: boolean;
  mutationCount: number;
  */
};
export type CrashedMutationEvaluation = {
  stackEvaluation: null;
  testsWorsened: null;
  testsImproved: null;
  testsUnknown: null;
  errorsChanged: null;
  crashed: true;
} & CommonMutationEvaluation;
export type NormalMutationEvaluation = {
  stackEvaluation: MutationStackEvaluation;
  testsWorsened: string[]; // Keys
  testsImproved: string[]; // Keys
  errorsChanged: string[]; // Keys
  testsUnknown: string[]; // Keys
  crashed: false;
} & CommonMutationEvaluation;

export type MutationEvaluation = CrashedMutationEvaluation | NormalMutationEvaluation;

export type LocationMutationEvaluation = {
  evaluation: MutationEvaluation;
  direct: boolean;
};

type TestDifferencePayload = {
  original: TestResult;
  new: TestResult;
  evaluation: TestEvaluation;
};
type TesterDifferencePayload = {
  matches: TestDifferencePayload[]; // Test results found in both tester results
  missing: TestResult[]; // Missing test resuls
  added: TestResult[]; // New test results
  unknown: TestResult[]; // Tests that were run but the result wasn't evaluated/unclear
  crashed: boolean;
};

const evaluateNewMutation = (
  difference: TesterDifferencePayload,
  instructions: Instruction<any>[],
): MutationEvaluation => {
  const testsWorsened: string[] = [];
  const testsImproved: string[] = [];
  const stackEvaluation: MutationStackEvaluation = createMutationStackEvaluation();
  const errorsChanged: string[] = [];

  testsWorsened.push(
    ...difference.added
      .filter((result) => !result.data.passed)
      .map((result) => result.data.key),
  );
  testsWorsened.push(
    ...difference.missing
      .filter((result) => !result.data.passed)
      .map((result) => result.data.key),
  );

  const testsUnknown = difference.unknown.map((result) => result.data.key);

  for (const payload of difference.matches) {
    const testEvaluation = payload.evaluation;
    // End result scores
    if (testEvaluation.endResultChange === EndResult.BETTER) {
      testsImproved.push(payload.original.data.key);
    } else if (testEvaluation.endResultChange === EndResult.WORSE) {
      testsWorsened.push(payload.original.data.key);
    } else if (
      testEvaluation.errorChanged &&
      (testEvaluation.stackScore === 0 || testEvaluation.stackScore === null)
    ) {
      errorsChanged.push(payload.original.data.key);
    }

    if (testEvaluation.stackScore !== null) {
      if (testEvaluation.stackScore > 0) {
        stackEvaluation.improvement.push(payload.original.data.key);
      } else if (testEvaluation.stackScore < 0) {
        stackEvaluation.degradation.push(payload.original.data.key);
      }
    }
  }

  return {
    instructions,
    testsWorsened,
    testsImproved,
    testsUnknown,
    stackEvaluation,
    errorsChanged,
    crashed: false,
  };
};

const locationToKey = (filePath: string, location?: ExpressionLocation | null) => {
  if (!location) {
    return filePath;
  }
  return `${filePath}:${location.start.line}:${location.start.column}`;
};
export const coverageKey = (loc: ExpressionLocation) => {
  return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`;
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
  a: MutationEvaluation,
  b: MutationEvaluation,
  testInfoMap: Map<string, TestInformation>,
) => {
  const instructionLengthComparison = b.instructions.length - a.instructions.length;
  if (instructionLengthComparison !== 0) {
    return instructionLengthComparison;
  }

  return compareMutationEvaluations(a, b, testInfoMap);
};

const compareNodeEvaluationsWithLargeMutationCountsFirst = (
  a: NodeEvaluation,
  b: NodeEvaluation,
  testInfoMap: Map<string, TestInformation>,
) => {
  const instructionLengthComparison =
    b.evaluation.instructions.length - a.evaluation.instructions.length;
  if (instructionLengthComparison !== 0) {
    return instructionLengthComparison;
  }

  return compareNodeEvaluations(a, b, testInfoMap);
};

const shouldCountNode = (path: NodePath) =>
  !path.isExpressionStatement() && !path.isBlockStatement();

const getTotalNodes = (path: NodePath) => {
  let count = 0;

  const enter = (subPath) => {
    if (shouldCountNode(subPath)) {
      count++;
    }
  };

  enter(path);
  path.traverse({
    enter,
  });

  return count;
};

export const instructionChangedOrImprovedErrorOrHasNoEvaluations = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  instruction: Instruction<any>,
) => {
  const evals1 = [...instructionEvaluations.get(instruction)!.mutationEvaluations];
  const nodeEvalLists = instruction.typedWriteDependencyKeys.map((key) => [
    ...nodeInfoMap.get(key)!.evaluations,
  ]);

  if (evals1.length <= 0 && nodeEvalLists.length <= 0) {
    return true;
  }

  return (
    evals1.some(changedOrImprovedError) ||
    nodeEvalLists.some((evals) =>
      evals.some((nodeInfo) => changedOrImprovedError(nodeInfo.evaluation)),
    )
  );
};

export const compareFinalInstructionEvaluations = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  testInfoMap: Map<string, TestInformation>,
  category1: CoveragePathObj,
  category2: CoveragePathObj,
): number => {
  const instructions1 = category1.instructions;
  const instructions2 = category2.instructions;
  if (instructions1.size >= 1 && instructions2.size >= 1) {
    const comparisonFn = (instruction1, instruction2) => {
      const intructionComparison = compareInstruction(
        nodeInfoMap,
        instructionEvaluations,
        testInfoMap,
        instruction1,
        instruction2,
      );
      if (intructionComparison !== 0) {
        return intructionComparison;
      }

      const evaluation1 = instructionEvaluations.get(instruction1)!;
      const evaluation2 = instructionEvaluations.get(instruction2)!;
      return compareInitialInstructionValues(evaluation1, evaluation2);
    };

    const best1 = [...instructions1].sort(comparisonFn).reverse()[0];
    const best2 = [...instructions2].sort(comparisonFn).reverse()[0];

    const comparison = comparisonFn(best1, best2);
    if (comparison !== 0) {
      return comparison;
    }
  } else if (instructions1.size <= 0 && instructions2.size >= 1) {
    if (
      [...instructions2].some((instruction) =>
        instructionChangedOrImprovedErrorOrHasNoEvaluations(
          nodeInfoMap,
          instructionEvaluations,
          instruction,
        ),
      )
    ) {
      return -1;
    } else {
      return 1;
    }
  } else if (instructions1.size >= 1 && instructions2.size <= 0) {
    if (
      [...instructions1].some((instruction) =>
        instructionChangedOrImprovedErrorOrHasNoEvaluations(
          nodeInfoMap,
          instructionEvaluations,
          instruction,
        ),
      )
    ) {
      return 1;
    } else {
      return -1;
    }
  }

  let mutationCount1 = 0;
  let mutationCount2 = 0;
  for (const instruction of instructions1) {
    mutationCount1 += instructionEvaluations.get(instruction)!.mutationEvaluations.length;
  }

  for (const instruction of instructions2) {
    mutationCount2 += instructionEvaluations.get(instruction)!.mutationEvaluations.length;
  }

  const nodesPerMutation1 = getTotalNodes(category1.path) / (mutationCount1 + 1);
  const nodesPerMutation2 = getTotalNodes(category2.path) / (mutationCount2 + 1);
  return nodesPerMutation1 - nodesPerMutation2;
};

export const mutationEvalatuationMapToFaults = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  testInfoMap: Map<string, TestInformation>,
  coverageObjs: Map<string, Map<string, CoveragePathObj>>,
): Fault[] => {
  const flattened = [...coverageObjs.values()]
    .map((objMap) => [...objMap.values()])
    .flat();

  const faults = flattened
    .sort((a, b) =>
      compareFinalInstructionEvaluations(
        nodeInfoMap,
        instructionEvaluations,
        testInfoMap,
        a,
        b,
      ),
    )
    .map((obj, i): Fault => {
      return {
        score: i,
        sourcePath: obj.originalLocation.filePath,
        location: {
          start: obj.originalLocation.start,
          end: obj.originalLocation.end,
        },
        other: {
          instructions: [...obj.instructions].map((instruction) => {
            const keys = instruction.typedWriteDependencyKeys;
            return {
              type: instruction.type.toString(),
              initial: instructionEvaluations.get(instruction)!.initial,
              locations: [...instruction.conflictDependencies.values()][0].writes
                .map((path) =>
                  path.find((parent) => parent.node != null && parent.node.loc != null),
                )
                .map((path) =>
                  locationToKeyIncludingEnd(obj.originalLocation.filePath, path.node.loc),
                ),
              evaluations: [
                ...instructionEvaluations
                  .get(instruction)!
                  .mutationEvaluations.sortedIterator(),
              ]
                .reverse()
                .map((e) => ({ ...e, instructions: undefined })),
              nodes: keys
                .map((key) =>
                  [...nodeInfoMap.get(key)!.evaluations.sortedIterator()].map((e) => ({
                    evaluation: {
                      ...e.evaluation,
                      instructions: undefined,
                    },
                    nodes: e.nodes,
                  })),
                )
                .reverse(),
            };
          }),
        },
      };
    });
  return faults;
};

type IsFinishedFunction = (
  instructions: Queue<Instruction<any>>,
  testerResults: TesterResults,
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  mutationCount: number,
  solutionCount: number,
) => boolean;

export type PluginOptions = {
  faultFileDir?: string;
  babelOptions?: ParserOptions;
  ignoreGlob?: string[] | string;
  onMutation?: (mutatatedFiles: string[]) => any;
  isFinishedFn?: IsFinishedFunction;
  //mapToIstanbul?: boolean;
};

type DefaultIsFinishedOptions = {
  mutationThreshold?: number;
  durationThreshold?: number;
};

const isPromisingEvaluation = (evaluation: MutationEvaluation) => {
  return changedOrImprovedError(evaluation);
};

const hasPromisingEvaluation = (evaluations: Queue<MutationEvaluation>) => {
  if (evaluations.length <= 0) {
    return true;
  }
  const bestEvaluation = evaluations.peek();
  return isPromisingEvaluation(bestEvaluation);
};

const hasPromisingNodeEvaluation = (evaluations: Queue<NodeEvaluation>) => {
  if (evaluations.length <= 0) {
    return true;
  }
  const bestEvaluation = evaluations.peek();
  return isPromisingEvaluation(bestEvaluation.evaluation);
};

export const shouldFinishMutations = (
  instructions: Queue<Instruction<any>>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  nodeInfoMap: Map<string, NodeInformation>,
) => {
  const instructionArr = [...instructions];

  if (
    !instructionArr
      .map((instruction) => instructionEvaluations.get(instruction)!.mutationEvaluations)
      .some(hasPromisingEvaluation)
  ) {
    return true;
  }

  const allWriteDependencyKeys = [
    ...new Set(
      instructionArr.map((instruction) => instruction.typedWriteDependencyKeys).flat(),
    ),
  ];
  const allDependencyEvaluations = allWriteDependencyKeys.map(
    (key) => nodeInfoMap.get(key)!.evaluations,
  );
  if (
    !allDependencyEvaluations.some((nodeEval) => hasPromisingNodeEvaluation(nodeEval))
  ) {
    return true;
  }

  return false;
};

export const createDefaultIsFinishedFn = ({
  mutationThreshold,
  durationThreshold,
}: DefaultIsFinishedOptions = {}): IsFinishedFunction => {
  let consecutiveFailures = 0;
  const isFinishedFn: IsFinishedFunction = (
    instructions,
    testerResults,
    nodeInfoMap,
    instructionEvaluations,
    mutationCount,
    solutionCount,
  ): boolean => {
    if (solutionCount > 0) {
      return true;
    }

    if (durationThreshold !== undefined && testerResults.duration >= durationThreshold) {
      return true;
    }

    if (mutationThreshold !== undefined && mutationCount >= mutationThreshold) {
      return true;
    }

    const shouldFinish = shouldFinishMutations(
      instructions,
      instructionEvaluations,
      nodeInfoMap,
    );

    if (shouldFinish) {
      if (
        consecutiveFailures < 3 ||
        consecutiveFailures <= Math.trunc(mutationCount * 0.01)
      ) {
        consecutiveFailures++;
        return false;
      }
    } else {
      consecutiveFailures = 0;
    }
    return shouldFinish;
  };

  return isFinishedFn;
};

const getAffectedFilePaths = (instructions: Queue<Instruction<any>>): string[] => {
  const filePaths = [
    ...new Set(
      [...instructions]
        .map((instruction) => [...instruction.conflictDependencies.keys()])
        .flat(),
    ),
  ];

  if (filePaths.length <= 0) {
    throw new Error(`No file paths were found`);
  }

  return filePaths;
};

const faultFileName = 'faults.json';

export function* iteratorWithNoDuplicates<T>(
  iterable: Iterable<T>,
  getKey: (item: T) => any = (item) => item,
) {
  const seen: Set<T> = new Set();
  for (const item of iterable) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    yield item;
  }
}

export const pathToKey = (path: NodePath): string => {
  return getTraverseKeys(path)
    .map((key) => (typeof key === 'string' ? `${key}` : `[${key}]`))
    .join('.');
};
export const pathToPrimaryKey = (filePath: string, path: NodePath) => {
  return `${filePath}=>${pathToKey(path)}`;
};

export const compareEvaluationHeaps = (
  a: Queue<MutationEvaluation>,
  b: Queue<MutationEvaluation>,
  testInfoMap: Map<string, TestInformation>,
) => {
  if (a.length <= 0 && b.length >= 1) {
    const evaluation2 = b.peek();
    if (changedOrImprovedError(evaluation2)) {
      return -1;
    } else {
      return 1;
    }
  } else if (a.length >= 1 && b.length <= 0) {
    const evaluation1 = a.peek();
    if (changedOrImprovedError(evaluation1)) {
      return 1;
    } else {
      return -1;
    }
  } else if (a.length >= 1 && b.length >= 1) {
    const instructionEvaluationComparison = compareMutationEvaluations(
      a.peek(),
      b.peek(),
      testInfoMap,
    );
    if (instructionEvaluationComparison !== 0) {
      return instructionEvaluationComparison;
    }
  }

  return 0;
};

const compareInitialInstructionValues = (
  evaluation1: InstructionEvaluation,
  evaluation2: InstructionEvaluation,
) => {
  return evaluation1.initial - evaluation2.initial;
};

export const compareInstructionWithInitialValues = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  testInfoMap: Map<string, TestInformation>,
  instruction1: Instruction<any>,
  instruction2: Instruction<any>,
) => {
  // TODO: Refactor this so you don't keep writing code to retrieve the evaluation in different methods
  const intructionComparison = compareInstruction(
    nodeInfoMap,
    instructionEvaluations,
    testInfoMap,
    instruction1,
    instruction2,
  );
  if (intructionComparison !== 0) {
    return intructionComparison;
  }

  const evaluation1 = instructionEvaluations.get(instruction1)!;
  const evaluation2 = instructionEvaluations.get(instruction2)!;
  const initial = compareInitialInstructionValues(evaluation1, evaluation2);
  if (initial !== 0) {
    return initial;
  }

  return (
    instructionTypeImportance.get(instruction1.type)! -
    instructionTypeImportance.get(instruction2.type)!
  );
};

export const compareInstruction = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  testInfoMap: Map<string, TestInformation>,
  instruction1: Instruction<any>,
  instruction2: Instruction<any>,
) => {
  const instructionEvaluations1 = instructionEvaluations.get(instruction1)!;
  const instructionEvaluations2 = instructionEvaluations.get(instruction2)!;

  const instructionEvaluationComparison = compareEvaluationHeaps(
    instructionEvaluations1.mutationEvaluations,
    instructionEvaluations2.mutationEvaluations,
    testInfoMap,
  );
  if (instructionEvaluationComparison !== 0) {
    return instructionEvaluationComparison;
  }

  const relevantKeys1 = instruction1.typedWriteDependencyKeys;
  const relevantKeys2 = instruction2.typedWriteDependencyKeys;

  const bestNodeEvaluations1 = relevantKeys1
    .map((node) => nodeInfoMap.get(node)!)
    .sort((a, b) => compareNodeInformation(a, b, testInfoMap))[relevantKeys1.length - 1];
  const bestNodeEvaluations2 = relevantKeys2
    .map((node) => nodeInfoMap.get(node)!)
    .sort((a, b) => compareNodeInformation(a, b, testInfoMap))[relevantKeys2.length - 1];

  const nodeEvaluationComparison = compareNodeInformation(
    bestNodeEvaluations1,
    bestNodeEvaluations2,
    testInfoMap,
  );
  if (nodeEvaluationComparison !== 0) {
    return nodeEvaluationComparison;
  }

  return 0;
};

export const instructionQueueComparator = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  testInfoMap: Map<string, TestInformation>,
  block1: Queue<Instruction<any>>,
  block2: Queue<Instruction<any>>,
): number => {
  const bestInstruction1 = block1.peek();
  const bestInstruction2 = block2.peek();
  const instructionComparison = compareInstructionWithInitialValues(
    nodeInfoMap,
    instructionEvaluations,
    testInfoMap,
    bestInstruction1,
    bestInstruction2,
  );
  if (instructionComparison !== 0) {
    return instructionComparison;
  }

  const sizeComparison = block2.length - block1.length;
  if (sizeComparison !== 0) {
    return sizeComparison;
  }

  return 0;
};

export type InstructionEvaluation = {
  initial: number;
  mutationEvaluations: Queue<MutationEvaluation>;
};

export const createInstructionEvaluation = (
  initial: number,
  testInfoMap: Map<string, TestInformation>,
): InstructionEvaluation => {
  return {
    initial,
    mutationEvaluations: new Queue((a, b) =>
      compareMutationEvaluationsWithLargeMutationCountsFirst(a, b, testInfoMap),
    ),
  };
};

const aggregateDependencyMaps = (
  dependencyMaps: Iterable<Map<string, DependencyInfo>>,
) => {
  const aggregation: Map<string, DependencyInfo> = new Map();
  const allFilePaths: Set<string> = new Set();
  for (const dependencyMap of dependencyMaps) {
    for (const filePath of dependencyMap.keys()) {
      allFilePaths.add(filePath);
    }
  }
  for (const filePath of allFilePaths) {
    const writeNodeToPaths: Map<t.Node, NodePath> = new Map();
    const readNodeToPaths: Map<t.Node, NodePath> = new Map();
    for (const dependencyMap of dependencyMaps) {
      const fileDependencies = dependencyMap.get(filePath);
      if (fileDependencies === undefined) {
        continue;
      }

      for (const path of fileDependencies.writes) {
        writeNodeToPaths.set(path.node, path);
      }

      for (const path of fileDependencies.reads) {
        readNodeToPaths.set(path.node, path);
      }
      aggregation.set(filePath, {
        writes: [...writeNodeToPaths.values()],
        reads: [...readNodeToPaths.values()],
      });
    }
  }

  return aggregation;
};

export const initialiseTestInfoMap = (
  testInfoMap: Map<string, TestInformation>,
  tester: TesterResults,
) => {
  for (const testResult of tester.testResults.values()) {
    testInfoMap.set(testResult.data.key, {
      fixes: 0,
      breaks: 0,
      errorChanges: 0,
      total: 0,
      stackScoresImproved: 0,
      stackScoresDegraded: 0,
      unchanged: 0,
      result: testResult,
      coverageInfo: new Map(),
    });
  }
};

export const initialiseEvaluationMaps = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  coverageInfoMap: Map<string, Map<string, CoveragePathObj>>,
  testInfoMap: Map<string, TestInformation>,
  instructions: Iterable<Instruction<any>>,
) => {
  const allDependencies = aggregateDependencyMaps(
    [...instructions].map((instruction) => instruction.indirectDependencies),
  );
  for (const [filePath, fileDependencies] of allDependencies) {
    // Wouldn't exist if there's a indirect dependency in a file that's excluded from babel istanbul coverage
    const fileCoverageMap = coverageInfoMap.get(filePath)!;
    for (const writePath of fileDependencies.writes) {
      let coverageInfo: CoveragePathObj | null = null;
      writePath.find((parentPath) => {
        if (parentPath.node.loc == null) {
          return false;
        }

        const key = coverageKey(parentPath.node.loc);

        const candidateInfo = fileCoverageMap.get(key);
        if (candidateInfo === undefined) {
          return false;
        }

        coverageInfo = candidateInfo;
        return true;
      });

      const key = pathToPrimaryKey(filePath, writePath);
      nodeInfoMap.set(key, {
        evaluations: new Queue((a, b) =>
          compareNodeEvaluationsWithLargeMutationCountsFirst(a, b, testInfoMap),
        ),
        instructions: [],
        path: writePath,
        coverageInfo,
      });
    }
  }
  for (const instruction of instructions) {
    for (const key of instruction.indirectWriteDependencyKeys) {
      nodeInfoMap.get(key)!.instructions.push(instruction);
    }
    instructionEvaluations.set(instruction, createInstructionEvaluation(0, testInfoMap));
  }
};

//let a = 1;
//let b = a;
//let c = b + 1;*/
//      ^ changing it did something good. Meaning something is wrong with c or anything that depends on it
//  since it alters c anything that relies on or creates c should have the evaluation added to it
// this includes all nodes from: "= 1", "= a", "b + 1", "= c", "d"
//let d = c;
//let q = b;
//rawr(d);

//rawr(mm() + 4)
//       ^ changing it did something good.
// added eval goes to: "= 1", "= a", "= c", "b ="

export const travelUpToRootDependencyPath = (path: NodePath) => {
  return path.find((path) => {
    if (path.isStatement() || path.isBlockParent()) {
      return true;
    }
    const parent = path.parentPath;
    if (
      parent.isIfStatement() ||
      parent.isFor() ||
      parent.isCallExpression() ||
      parent.isFunction()
    ) {
      return true;
    }

    return false;
  });
};

/**
 * Assumption: Paths are all from the same file
 */
export const getDependencyPaths = (paths: Iterable<NodePath>): NodePath[] => {
  const collectedNodes: Set<string> = new Set();
  const collectedPaths: NodePath[] = [];
  const pathStack: NodePath[] = [...paths];

  const checkAndAddPath = (aPath: NodePath): boolean => {
    const key = pathToKey(aPath);
    if (collectedNodes.has(key)) {
      return false;
    }

    /* TODO: This is pretty confusing but the reason this check exists is because in places like:
      const a = 0, b = 0, c = 0;
      There's 3 coverage 'statements' in istanbul but it doesn't count the 'const' keyword. Thus, we just skip adding
      evaluations to the 'const' node since it isn't associated with any of the 3 statements (thus it would end up associating with the parent statement).
      A better alternative would be to ensure that FaultJS knows to associate the 'const' keyword/variable declaration keyword with the declarator nodes/paths
    */
    if (!aPath.isVariableDeclaration()) {
      collectedPaths.push(aPath);
    }
    collectedNodes.add(key);

    return true;
  };

  while (pathStack.length > 0) {
    const dependentPath: NodePath = pathStack.pop()!;
    const rootPath = travelUpToRootDependencyPath(dependentPath);

    if (!checkAndAddPath(rootPath)) {
      continue;
    }

    // TODO: Traverse skips certain node paths like the "values" of binary operators
    rootPath.traverse({
      enter: (subPath) => {
        if (subPath.isFunction()) {
          subPath.skip();
          return;
        }
        if (!checkAndAddPath(subPath)) {
          subPath.skip();
          return;
        }

        pathStack.push(subPath);

        if (subPath.isIdentifier()) {
          const binding = subPath.scope.getBinding(subPath.node.name);
          if (binding !== undefined) {
            const bindPath = binding.path;
            // TODO: Might result in the same path being added multiple times. May decrease performance.
            pathStack.push(bindPath, ...binding.referencePaths);
          }
        }
      },
    });
  }

  return collectedPaths;
};

export const getDependencyPathMap = (
  pathMap: Map<string, DependencyInfo>,
): Map<string, DependencyInfo> => {
  const map: Map<string, DependencyInfo> = new Map();

  for (const [filePath, fileDependencies] of pathMap) {
    map.set(filePath, {
      writes: getDependencyPaths(fileDependencies.writes),
      reads: getDependencyPaths(fileDependencies.reads),
    });
  }

  return map;
};

export const overwriteWithMutatedAst = async (
  filePath: string,
  mutatedAsts: Map<string, t.File>,
): Promise<any> => {
  const originalCodeText = await readFile(filePath, 'utf8');
  const ast = mutatedAsts.get(filePath)!;
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
};

export const differenceInTesterResults = (
  originalResults: TesterResults,
  newResults: TesterResults,
  testAstMap: Map<string, t.File>,
): TesterDifferencePayload => {
  const matches: TestDifferencePayload[] = [];
  const notSeen = new Set(originalResults.testResults.keys());
  const added: TestResult[] = []; // TODO: ATM this also includes double ups of the same test
  for (const [key, newResult] of newResults.testResults) {
    if (!notSeen.has(key)) {
      added.push(newResult);
      continue;
    }
    notSeen.delete(key);
    const oldResult = originalResults.testResults.get(key)!;
    const testEvaluation = evaluateModifiedTestResult(oldResult, newResult, testAstMap);
    matches.push({
      evaluation: testEvaluation,
      original: oldResult,
      new: newResult,
    });
  }

  const missing: TestResult[] = [];
  for (const key of notSeen) {
    const original = originalResults.testResults.get(key)!;
    missing.push(original);
  }

  return {
    matches,
    added,
    missing,
    unknown: [],
    crashed: false,
  };
};

const testEvaluationChanged = (evaluation: TestEvaluation): boolean => {
  return (
    evaluation.endResultChange !== EndResult.UNCHANGED ||
    (evaluation.stackScore !== 0 && evaluation.stackScore !== null) ||
    evaluation.errorChanged === true
  );
};

const isRelevantTest = (
  testResult: TestResult,
  coverageObjs: Map<string, Map<string, CoveragePathObj>>,
  coverageInfo: CoveragePathObj | null,
) => {
  if (coverageInfo === null) {
    return false;
  }

  // TODO: Could clean this up - Less linear searching
  for (const [filePath, fileCoverage] of Object.entries(testResult.data.coverage)) {
    const objMap = coverageObjs.get(filePath)!;
    if (objMap === undefined) {
      continue;
    }
    for (const [key, expressionLocation] of Object.entries(fileCoverage.statementMap)) {
      const obj = objMap.get(coverageKey(expressionLocation));
      if (obj === undefined) {
        continue;
      }

      if (obj !== coverageInfo) {
        continue;
      }

      const executionCount = fileCoverage.s[key];
      if (executionCount <= 0) {
        continue;
      }
      return true;
    }
  }

  return false;
};

export const addDifferencePayloadToTestInformation = (
  differences: Iterable<TestDifferencePayload>,
  testInfoMap: Map<string, TestInformation>,
) => {
  for (const payload of differences) {
    const info = testInfoMap.get(payload.original.data.key);
    if (info === undefined) {
      continue;
    }

    if (payload.evaluation.endResultChange === EndResult.BETTER) {
      info.fixes++;
    } else if (payload.evaluation.endResultChange === EndResult.WORSE) {
      info.breaks++;
    } else if (
      payload.evaluation.errorChanged !== null &&
      payload.evaluation.errorChanged
    ) {
      info.errorChanges++;
    } else if (payload.evaluation.stackScore !== null) {
      if (payload.evaluation.stackScore > 0) {
        info.stackScoresImproved++;
      } else if (payload.evaluation.stackScore < 0) {
        info.stackScoresDegraded++;
      }
    } else {
      info.unchanged++;
    }
    info.total++;
  }
};

const addMutationEvaluation = (
  difference: TesterDifferencePayload,
  coverageObjMap: Map<string, Map<string, CoveragePathObj>>,
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  instructionQueue: Queue<Queue<Instruction<any>>>,
  testInfoMap: Map<string, TestInformation>,
  instructions: Queue<Instruction<any>>,
  mutationEvaluation: MutationEvaluation,
) => {
  const affectedKeys: Set<string> = new Set();

  if (!difference.crashed) {
    for (const instruction of instructions) {
      for (const key of instruction.indirectWriteDependencyKeys) {
        affectedKeys.add(key);
      }
    }

    const changed = difference.matches.filter((match) =>
      testEvaluationChanged(match.evaluation),
    );

    addDifferencePayloadToTestInformation(changed, testInfoMap);

    for (const key of affectedKeys) {
      const nodeInfo = nodeInfoMap.get(key)!;

      const matches: TestDifferencePayload[] = [];
      const unknown: TestResult[] = [...difference.unknown];
      for (const payload of changed) {
        if (isRelevantTest(payload.original, coverageObjMap, nodeInfo.coverageInfo)) {
          matches.push(payload);
        } else {
          unknown.push(payload.original);
        }
      }
      if (matches.length <= 0) {
        continue;
      }

      const missing: TestResult[] = [];
      for (const missingResult of difference.missing) {
        if (isRelevantTest(missingResult, coverageObjMap, nodeInfo.coverageInfo)) {
          missing.push(missingResult);
        } else {
          unknown.push(missingResult);
        }
      }

      // TODO: ATM, no logic implemented to check if test covered original code from mutated code
      const added: TestResult[] = [];

      const nodeEvaluation = evaluateNewMutation(
        {
          missing,
          matches,
          added,
          unknown,
          crashed: false,
        },
        mutationEvaluation.instructions,
      );
      nodeInfo.evaluations.push({
        evaluation: nodeEvaluation,
        nodes: affectedKeys.size,
      });
    }
  } else {
    for (const instruction of instructions) {
      for (const key of instruction.typedWriteDependencyKeys) {
        affectedKeys.add(key);
      }
    }

    const filteredAffectedKeys = [...affectedKeys].filter((key) => {
      if (!nodeInfoMap.has(key)) {
        return false;
      }
      const nodeInfo = nodeInfoMap.get(key)!;
      return difference.missing.some((result) =>
        isRelevantTest(result, coverageObjMap, nodeInfo.coverageInfo),
      );
    });

    const newEvaluation = {
      evaluation: mutationEvaluation,
      nodes: filteredAffectedKeys.length,
    };
    for (const key of filteredAffectedKeys) {
      const nodeInfo = nodeInfoMap.get(key)!;
      nodeInfo.evaluations.push(newEvaluation);
    }
  }

  for (const instruction of instructions) {
    instructionEvaluations.get(instruction)!.mutationEvaluations.push(mutationEvaluation);
  }

  instructionQueue.update();
};

export const widenCoveragePath = (path: NodePath) => {
  if (path.parentPath && path.parentPath.isVariableDeclarator()) {
    return path.parentPath;
  }

  return path;
};

const addSplittedInstructionBlock = (
  queue: Queue<Queue<Instruction<any>>>,
  block: Queue<Instruction<any>>,
) => {
  const cloned = block.clone();
  const mid = Math.trunc(block.length / 2);
  const part1: Queue<Instruction<any>> = new Queue(cloned.compareFn);
  for (let i = 0; i < mid; i++) {
    part1.push(cloned.pop()!);
  }
  queue.push(part1);
  queue.push(cloned);
};

export const codeMapToAstMap = (
  codeMap: Map<string, string>,
  options: Parameters<typeof parse>[1],
): Map<string, t.File> => {
  const mapEntries = [...codeMap.entries()].map(([filePath, code]): [string, t.File] => {
    return [filePath, parse(code, options)];
  });
  return new Map(mapEntries);
};

export const createInstructionQueue = (
  nodeInfoMap: Map<string, NodeInformation>,
  testInfoMap: Map<string, TestInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
) => {
  const heapComparisonFn = (a: Queue<Instruction<any>>, b: Queue<Instruction<any>>) =>
    instructionQueueComparator(nodeInfoMap, instructionEvaluations, testInfoMap, a, b);
  return new Queue(heapComparisonFn);
};

export const createInstructionBlocks = (
  nodeInfoMap: Map<string, NodeInformation>,
  instructionEvaluations: Map<Instruction<any>, InstructionEvaluation>,
  testInfoMap: Map<string, TestInformation>,
  instructionsList: Instruction<any>[][],
) => {
  const subHeapCompareFn = (a: Instruction<any>, b: Instruction<any>) =>
    compareInstructionWithInitialValues(
      nodeInfoMap,
      instructionEvaluations,
      testInfoMap,
      a,
      b,
    );

  return instructionsList.map(
    (instructions) => new Queue(subHeapCompareFn, instructions),
  );
};

export type NodeEvaluation = {
  evaluation: MutationEvaluation;
  nodes: number;
};

export type NodeInformation = {
  evaluations: Queue<NodeEvaluation>;
  instructions: Instruction<any>[];
  coverageInfo: CoveragePathObj | null;
  path: NodePath;
};

type TestInformation = {
  fixes: number;
  breaks: number;
  errorChanges: number;
  stackScoresImproved: number;
  stackScoresDegraded: number;
  unchanged: number;
  total: number;
  result: TestResult;
  coverageInfo: Map<string, CoveragePathObj>;
};

export const createPlugin = ({
  faultFileDir = './faults/',
  babelOptions,
  ignoreGlob = [],
  onMutation = () => {},
  isFinishedFn = createDefaultIsFinishedFn(),
}: //mapToIstanbul = false,
PluginOptions): PartialTestHookOptions => {
  let solutionCounter = 0;
  const solutionsDir = resolve(faultFileDir, 'solutions');

  const faultFilePath = resolve(faultFileDir, faultFileName);

  const nodeInfoMap: Map<string, NodeInformation> = new Map();
  const instructionEvaluations: Map<Instruction<any>, InstructionEvaluation> = new Map();
  const testInfoMap: Map<string, TestInformation> = new Map();

  let previousInstructions: Queue<Instruction<any>> = null!;
  let codeMap: Map<string, string> = null!;
  let originalAstMap: Map<string, t.File> = null!;
  let testAstMap: Map<string, t.File> = null!;
  let coverageObjs: Map<string, Map<string, CoveragePathObj>> = null!;
  let finished = false;
  let instructionQueue: Queue<Queue<Instruction<any>>> = null!;
  let firstRun = true;
  let firstTesterResults: TesterResults;
  const failingTestFiles: Set<string> = new Set();
  const failingLocationKeys: Set<string> = new Set();

  let mutationCount = 0;

  const resolvedIgnoreGlob = (Array.isArray(ignoreGlob) ? ignoreGlob : [ignoreGlob]).map(
    (glob) => resolve('.', glob).replace(/\\+/g, '/'),
  );

  const originalPathToCopyPath: Map<string, string> = new Map();
  let copyFileId = 0;
  let copyTempDir: string = null!;
  const resetFile = async (filePath: string) => {
    const copyPath = originalPathToCopyPath.get(filePath)!;
    if (copyPath === undefined) {
      console.error(originalPathToCopyPath);
      throw new Error(`Copied/cached path for ${filePath} was ${copyPath}`);
    }

    await copyFile(copyPath, filePath);
  };

  const resetMutationsInInstruction = async (instructions: Queue<Instruction<any>>) => {
    const filePathsToReset = getAffectedFilePaths(instructions);
    await Promise.all(filePathsToReset.map(resetFile));
  };

  const createTempCopyOfFileIfItDoesntExist = (filePath: string): Promise<any> => {
    if (!originalPathToCopyPath.has(filePath)) {
      const fileId = copyFileId++;
      const copyPath = resolve(copyTempDir, fileId.toString());
      originalPathToCopyPath.set(filePath, copyPath);

      return copyFile(filePath, copyPath);
    }
    return Promise.resolve();
  };

  const analyzeEvaluation = async (
    difference: TesterDifferencePayload,
    mutationEvaluation: MutationEvaluation,
  ) => {
    if (previousInstructions !== null) {
      if (previousInstructions.length >= 2) {
        if (evaluationChangedOrImprovedErrorOrCrashed(mutationEvaluation)) {
          addSplittedInstructionBlock(instructionQueue, previousInstructions);
        }
      } else {
        if (evaluationChangedOrImprovedErrorOrCrashed(mutationEvaluation)) {
          const instruction = previousInstructions.peek();

          /*if (
          const previousIndirectNodeEvaluations = instruction.indirectWriteDependencyKeys.map(
            key => nodeInfoMap.get(key)!.evaluations,
          );

          const previousDirectNodeEvaluations = instruction.typedWriteDependencyKeys.map(
            key => nodeInfoMap.get(key)!.evaluations,
          );

            previousIndirectNodeEvaluations.some(
              evaluation =>
                evaluation.length > 0 &&
                compareNodeMutations({ evaluation: mutationEvaluation, nodes: 1 }, evaluation.peek(), testInfoMap) > 0
            ) ||
            previousDirectNodeEvaluations.some(
              evaluations =>
                evaluations.length <= 0 ||
                compareNodeMutations({ evaluation: mutationEvaluation, nodes: 1 }, evaluations.peek(), testInfoMap) > 0
            )
          ) {*/
          if (instruction.variants !== undefined) {
            instruction.variantIndex++;
            if (instruction.variantIndex < instruction.variants.length) {
              instructionQueue.push(previousInstructions);
            }
          }
          // }
        }
      }
      addMutationEvaluation(
        difference,
        coverageObjs,
        nodeInfoMap,
        instructionEvaluations,
        instructionQueue,
        testInfoMap,
        previousInstructions,
        mutationEvaluation,
      );
    }
  };

  const runInstruction = async (tester: TesterResults) => {
    if (instructionQueue.length <= 0) {
      finished = true;
      return false;
    }

    const instructions = instructionQueue.pop()!;
    previousInstructions = instructions;

    const newAstMap = codeMapToAstMap(codeMap, babelOptions);
    executeInstructions(newAstMap, instructions);

    if (
      isFinishedFn(
        instructions,
        tester,
        nodeInfoMap,
        instructionEvaluations,
        mutationCount,
        solutionCounter,
      )
    ) {
      // Avoids evaluation the same instruction twice if another addon requires a rerun of tests
      finished = true;
      return false;
    }

    mutationCount++;

    const mutatedFilePaths = getAffectedFilePaths(instructions);

    await Promise.all(
      mutatedFilePaths.map((filePath) =>
        createTempCopyOfFileIfItDoesntExist(filePath).then(() =>
          overwriteWithMutatedAst(filePath, newAstMap),
        ),
      ),
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
        await mkdir(solutionsDir, { recursive: true } as any); // TODO: Need as any because there seems to be a type error with the package (?)
        // TODO: Types appear to be broken with mkdtemp
        copyTempDir = await (mkdtemp as any)(
          join(tmpdir(), 'fault-addon-mutation-localization-'),
        );
      },
      allFilesFinished: async (tester: TesterResults) => {
        if (finished) {
          return null;
        }

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
          const locations: Location[] = [];
          const failingLocations: Location[] = [];
          for (const [coveragePath, fileCoverage] of Object.entries(failedCoverage)) {
            if (micromatch.isMatch(coveragePath, resolvedIgnoreGlob)) {
              continue;
            }
            for (const [key, statementCoverage] of Object.entries(
              fileCoverage.statementMap,
            )) {
              const location = {
                ...statementCoverage,
                filePath: coveragePath,
              };
              locations.push(location);
              if (fileCoverage.s[key] <= 0) {
                continue;
              }
              failingLocationKeys.add(
                locationToKeyIncludingEnd(coveragePath, statementCoverage),
              );
              failingLocations.push(location);
            }
          }

          codeMap = await createFilePathToCodeMap([
            ...new Set(failingLocations.map((location) => location.filePath)),
          ]);

          originalAstMap = codeMapToAstMap(codeMap, babelOptions);
          const testCodeMap = await createFilePathToCodeMap([
            ...new Set(
              [...tester.testResults.values()].map((testResult) => testResult.data.file),
            ),
          ]);
          testAstMap = codeMapToAstMap(testCodeMap, babelOptions);

          const allInstructions = [
            ...gatherInstructions(instructionFactories, originalAstMap),
          ];

          const fullCoverageObjs = findWidenedCoveragePaths(
            originalAstMap,
            locations,
            testInfoMap,
          );
          addInstructionsToCoverageMap(allInstructions, fullCoverageObjs);

          coverageObjs = new Map(
            [...fullCoverageObjs]
              .map(([filePath, objs]): [string, Map<string, CoveragePathObj>] => [
                filePath,
                new Map(
                  [...objs].filter(([, obj]) => {
                    return failingLocations.some((failingLocation) =>
                      fileLocationEquals(obj.originalLocation, failingLocation),
                    );
                  }),
                ),
              ])
              .filter(([, objs]) => objs.size > 0),
          );

          const relevantInstructions: Set<Instruction<any>> = new Set();
          for (const objMap of coverageObjs.values()) {
            for (const obj of objMap.values()) {
              for (const instruction of obj.instructions) {
                relevantInstructions.add(instruction);
              }
            }
          }

          initialiseTestInfoMap(testInfoMap, tester);

          initialiseEvaluationMaps(
            nodeInfoMap,
            instructionEvaluations,
            fullCoverageObjs,
            testInfoMap,
            relevantInstructions,
          );

          const totalPassFailStats = passFailStatsFromTests(tester.testResults.values());

          for (const objMap of coverageObjs.values()) {
            for (const obj of objMap.values()) {
              const testStats = testStatsFromCoverageInfo(obj);
              const score = dstar(testStats, totalPassFailStats);
              for (const instruction of obj.instructions) {
                const evaluation = instructionEvaluations.get(instruction)!;
                evaluation.initial = Math.max(
                  evaluation.initial,
                  score === null ? Number.NEGATIVE_INFINITY : score,
                );
              }
            }
          }

          const sortedInstructions = [...relevantInstructions].sort((a, b) =>
            compareInstructionWithInitialValues(
              nodeInfoMap,
              instructionEvaluations,
              testInfoMap,
              a,
              b,
            ),
          );

          const organizedInstructions = organizeInstructions(sortedInstructions);
          instructionQueue = createInstructionQueue(
            nodeInfoMap,
            testInfoMap,
            instructionEvaluations,
          );
          instructionQueue.push(
            ...createInstructionBlocks(
              nodeInfoMap,
              instructionEvaluations,
              testInfoMap,
              organizedInstructions,
            ),
          );
        } else {
          const differenceBetweenResults = differenceInTesterResults(
            firstTesterResults,
            tester,
            testAstMap,
          );
          const mutationEvaluation = evaluateNewMutation(differenceBetweenResults, [
            ...previousInstructions,
          ]);

          if (
            mutationEvaluation.testsImproved?.length ===
              [...firstTesterResults.testResults.values()].filter((a) => !a.data.passed)
                .length &&
            mutationEvaluation.testsWorsened?.length === 0 &&
            previousInstructions !== null
          ) {
            const newSolutionDir = resolve(solutionsDir, (solutionCounter++).toString());
            // TODO: Package's method types seem broken so had to use as any
            await mkdir(newSolutionDir, { recursive: true } as any);
            // TODO: Use folders + the actual file name or something
            let i = 0;
            for (const filePath of getAffectedFilePaths(previousInstructions)) {
              const code = await readFile(filePath, 'utf8');
              await writeFile(resolve(newSolutionDir, i.toString()), code, 'utf8');
              i++;
            }
          }

          await resetMutationsInInstruction(previousInstructions);

          await analyzeEvaluation(differenceBetweenResults, mutationEvaluation);
        }

        const rerun = await runInstruction(tester);
        if (!rerun) {
          return;
        }
        // TODO: DRY
        const testsToBeRerun = [...firstTesterResults.testResults.values()].map(
          (result) => result.data.file,
        );
        return testsToBeRerun;
      },
      async exit(tester: FinalTesterResults) {
        if (finished) {
          return { rerun: false, allow: false };
        }
        if (firstRun) {
          return { rerun: false, allow: false };
        }
        const mutationEvaluation: MutationEvaluation = {
          instructions: [...previousInstructions],
          testsWorsened: null,
          testsImproved: null,
          stackEvaluation: null,
          errorsChanged: null,
          testsUnknown: null,
          crashed: true,
        };

        if (previousInstructions !== null) {
          await resetMutationsInInstruction(previousInstructions);
        }
        await analyzeEvaluation(
          {
            matches: [],
            added: [],
            unknown: [],
            missing: [...tester.testResults.values()].flat(),
            crashed: true,
          },
          mutationEvaluation,
        );

        // TODO: Would be better if the exit hook could be told which tests to rerun. Maybe :P
        const rerun = await runInstruction(tester);

        return { rerun, allow: true };
      },
      complete: async (_: FinalTesterResults) => {
        await writeFile(
          resolve(faultFileDir, 'mutations-attempted.txt'),
          mutationsAttempted.toString(),
        );
        Promise.all(
          [...originalPathToCopyPath.values()].map((copyPath) => unlink(copyPath)),
        ).then(() => rmdir(copyTempDir));

        const faults = mutationEvalatuationMapToFaults(
          nodeInfoMap,
          instructionEvaluations,
          testInfoMap,
          coverageObjs,
        );

        await Promise.all([recordFaults(faultFilePath, faults), reportFaults(faults)]);
      },
    },
  };
};

export default createPlugin;
