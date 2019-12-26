import { parse, ParserOptions } from '@babel/parser';
import { File, AssignmentExpression, Expression, Statement } from '@babel/types';
import { PartialTestHookOptions } from '@fault/addon-hook-schema';
import * as t from '@babel/types';
import {
  TesterResults,
  TestResult,
  FailingTestData,
  FinalTesterResults,
} from '@fault/types';
import { readFile, writeFile, mkdtemp, unlink, rmdir, mkdir } from 'mz/fs';
import { createCoverageMap } from 'istanbul-lib-coverage';
import { join, resolve, basename } from 'path';
import { tmpdir } from 'os';
import del from 'del';
import { ExpressionLocation, Coverage } from '@fault/istanbul-util';
import ErrorStackParser from 'error-stack-parser';
import { NodePath } from '@babel/traverse';
import {
  reportFaults,
  Fault,
  ScorelessFault,
  recordFaults,
  sortBySuspciousness,
} from '@fault/record-faults';
import generate from '@babel/generator';
import chalk from 'chalk';
import * as micromatch from 'micromatch';
import Heap from '@pshaw/binary-heap';
import traverse from '@babel/traverse';

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

type Location = {
  filePath: string;
} & ExpressionLocation;

const locationEqual = (
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

const findNodePathsWithLocation = (ast: t.File, location: ExpressionLocation) => {
  const nodePaths: NodePath[] = [];
  traverse(ast, {
    enter(path) {
      const loc1 = location;
      const loc2 = path.node.loc;
      if (locationEqual(loc1, loc2)) {
        nodePaths.push(path);
      }
    },
  });
  return nodePaths;
};

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

const ASSIGNMENT = Symbol('assignment');

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
    evaluation.stackEvaluation.degradation === 0
  );
};

type CategoryData<T> = {} & Array<T | CategoryData<T>>;
const recursiveIncludes = (match: any, arr: any) => {
  if (match === arr) {
    return true;
  } else if (Array.isArray(arr)) {
    return arr.some(item => recursiveIncludes(match, item));
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
    .filter(item => {
      if (alreadyAddedSet.has(item)) {
        return false;
      } else {
        alreadyAddedSet.add(item);
        return true;
      }
    })
    .reverse();
};

type Mutation<D, S> = {
  setup: (asts: Map<string, t.File>, data: D) => S;
  execute: (state: S) => void;
};

// TODO: nodePath should be a NodePath or NodePath[] - cbs fixing all the type errors
type ValueFromPathFn<D, T, F> = (data: D, nodePath: any) => F;

type GetFnKey<T> = Parameters<NodePath<T>['get']>[0];

type SetFnKey<T> = Parameters<NodePath<T>['set']>[0];
type SetFnNode<T> = Parameters<NodePath<T>['set']>[1];

type SetDataFnKey<T> = Parameters<NodePath<T>['setData']>[0];
type SetDataFnValue<T> = Parameters<NodePath<T>['setData']>[1];

type ReplaceWithFnReplacement<T> = Parameters<NodePath<T>['replaceWith']>[0];

type TraverseKey = number | string;

const getTraverseKeys = (path: NodePath<any>) => {
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
  setup: (nodePath, data: D) => S;
  execute: (state: S) => void;
};
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
    this.mutations.push({
      setup: (path, data) => {
        return { path: this.traverseToThisPath(path), value: getValue(data, path) };
      },
      execute: ({ path, value }) => {
        path.node[key] = value;
      },
    });
  }

  public set(key: SetFnKey<T>, wrapper: NodePathMutationWrapper<D, t.Node>) {
    this.setDynamic(key, (data, rootPath) => {
      const nodePath = wrapper.traverseToThisPath(rootPath);
      const nodes = Array.isArray(nodePath)
        ? nodePath.map(path => path.node)
        : nodePath.node;
      return nodes;
    });
  }

  public setDynamic(key: SetFnKey<T>, getNode: ValueFromPathFn<D, any, SetFnNode<T>>) {
    this.writes.push([...this.keys, key]);
    this.mutations.push({
      setup: (path, data) => {
        return { path: this.traverseToThisPath(path), value: getNode(data, path) };
      },
      execute: ({ path, value }) => {
        path.set(key, value);
      },
    });
  }

  public replaceWithMultiple(wrappers: NodePathMutationWrapper<D>[]) {
    this.writes.push(this.keys);
    this.mutations.push({
      setup: (nodePath, data) => {
        return {
          path: this.traverseToThisPath(nodePath),
          value: wrappers.map(wrapper => wrapper.traverseToThisPath(nodePath)),
        };
      },
      execute: ({ path, value }) => {
        path.replaceWithMultiple(value);
      },
    });
  }

  public replaceWith(wrapper: NodePathMutationWrapper<D>) {
    this.replaceWithDynamic((data, nodePath) => {
      const traversed = wrapper.traverseToThisPath(nodePath);
      if (Array.isArray(nodePath)) {
        throw new Error(`replaceWith does not support array node paths`);
      }
      if (Array.isArray(traversed)) {
        throw new Error(`replaceWith does not support array replacements`);
      }
      return traversed.node;
    });
  }

  public replaceWithDynamic(
    getReplacement: ValueFromPathFn<D, any, ReplaceWithFnReplacement<T>>,
  ) {
    this.writes.push(this.keys);
    this.mutations.push({
      setup: (nodePath, data) => {
        const path = this.traverseToThisPath(nodePath);
        if (Array.isArray(path)) {
          throw new Error(`replaceWithDynamic does not support array node paths`);
        }
        const replacement = getReplacement(data, nodePath);
        if (Array.isArray(replacement)) {
          throw new Error(`replaceWithDynamic does not support arrays as its input`);
        }
        console.log('setup', path.node.type, replacement.type);
        return { path, value: replacement };
      },
      execute: ({ path, value }) => {
        console.log('execute', path.node.type, value.type);
        path.replaceWith(value);
      },
    });
  }

  public remove() {
    this.writes.push(this.keys);
    this.mutations.push({
      setup: path => ({ path: this.traverseToThisPath(path) }),
      execute: ({ path }) => {
        path.remove();
      },
    });
  }
}

const createMutationSequenceFactory = <D, T>(
  mutationSteps: (wrapper: NodePathMutationWrapper<D, T>) => any,
) => {
  const wrapper = new NodePathMutationWrapper<D, T>([], [], [], []);
  mutationSteps(wrapper);
  return wrapper;
};

export const findParentWithType = (path: NodePath) => path.find(parentPath => parentPath.type != null);

export class Instruction<D> {
  public readonly writeDependencyKeys: string[] = [];
  public readonly indirectDependencyKeys: string[] = [];
  public readonly conflictWriteDependencyKeys: string[] = [];
  constructor(
    public readonly type: symbol,
    public readonly dependencies: Map<string, DependencyInfo>,
    public readonly mutations: Mutation<D, any>[],
    public readonly variants: D[] | undefined,
  ) {    
    const evaluationDependencies: Map<string, DependencyInfo> = new Map();
    const indirectKeySet: Set<string> = new Set();
    for(const [filePath, fileDependencies] of dependencies) {
      evaluationDependencies.set(filePath, {
        writes: fileDependencies.writes.map(findParentWithType),
        reads: fileDependencies.reads.map(findParentWithType),
      });
      for(const writePath of fileDependencies.writes) {
        const key = pathToPrimaryKey(filePath, writePath);
        this.conflictWriteDependencyKeys.push(key);
      }
    }

    for(const [filePath, fileDependencies] of evaluationDependencies) {
      for(const writePath of fileDependencies.writes) {
        const key = pathToPrimaryKey(filePath, writePath);
        this.writeDependencyKeys.push(key);
        indirectKeySet.add(key);
      }      
    }

    const indirectDependencyMap = getDependencyPathMap(evaluationDependencies);
    for(const [filePath, paths] of indirectDependencyMap) {
      for(const path of paths) {
        indirectKeySet.add(pathToPrimaryKey(filePath, path));
      }
    }
    this.indirectDependencyKeys = [...indirectKeySet];
  }
};

type ConditionFn = (path: NodePath) => boolean;
type CreateVariantsFn<D, T> = (path: NodePath<T>) => D[];
type DependencyInfo = {
  reads: NodePath<any>[];
  writes: NodePath<any>[];
};

type AbstractInstructionFactory<D> = {
  setup?: (asts: Map<string, t.File>) => void;
  createInstructions(asts: Map<string, t.File>): IterableIterator<Instruction<D>>;
};

type InstructionFactoryPayload<D, T> = {
  type: symbol;
  wrapper: NodePathMutationWrapper<D, T>;
  variants: D[] | undefined;
};
class InstructionFactory<D> implements AbstractInstructionFactory<D> {
  constructor(
    public readonly pathToInstructions: (
      path: NodePath,
    ) => IterableIterator<InstructionFactoryPayload<D, any>>,
    public readonly setupPath?: (path: t.File) => void,
  ) {}

  setup(asts: Map<string, t.File>) {
    if (this.setupPath) {
      for (const ast of asts.values()) {
        this.setupPath(ast);
      }
    }
  }

  *createInstructions(asts: Map<string, t.File>): IterableIterator<Instruction<D>> {
    for (const [filePath, ast] of asts) {
      const instructions: Instruction<D>[] = [];
      traverse(ast, {
        enter: path => {
          for (const { type, wrapper, variants } of this.pathToInstructions(path)) {
            const pathKeys = getTraverseKeys(path);
            try {
              const newInstruction = new Instruction(
                type,
                new Map([[filePath, wrapper.getDependencies(path as any)]]),
                wrapper.mutations.map(wrapperMutation => {
                  return {
                    setup: (newAsts, data: D) => {
                      const newAst = newAsts.get(filePath)!;
                      const astPath = getAstPath(newAst);
                      try {
                        return wrapperMutation.setup(
                          traverseKeys(astPath, pathKeys),
                          data,
                        );
                      } catch (err) {
                        err.message = `${
                          err.message
                        }. Core path location was [${getTraverseKeys(path).join(', ')}]`;
                        throw err;
                      }
                    },
                    execute: wrapperMutation.execute,
                  };
                }),
                variants,
              );
              instructions.push(newInstruction);
            } catch (err) {
              err.message = `${
                err.message
              }. Was creating instruction of type ${type.toString()}.`;
              throw err;
            }
          }
        },
      });
      yield* instructions;
    }
  }
}

class SimpleInstructionFactory<D, T> extends InstructionFactory<D> {
  constructor(
    type: symbol,
    wrapper: NodePathMutationWrapper<D, T>,
    condition: ConditionFn,
    createVariantFn?: CreateVariantsFn<D, T>,
    setup?: (ast: t.File) => void,
  ) {
    super(function*(path) {
      if (condition(path)) {
        const variants =
          createVariantFn === undefined ? undefined : createVariantFn(path as any);
        if (variants === undefined || variants.length >= 1) {
          yield {
            type,
            wrapper,
            variants,
          };
        }
      }
    }, setup);
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
    filePaths.map(
      async (filePath: string): Promise<[string, string]> => {
        const code = await readFile(filePath, 'utf8');
        return [filePath, code];
      },
    ),
  );
  entries.sort(([filePath1], [filePath2]) => filePath1.localeCompare(filePath2));
  return new Map(entries);
};

const isParentOrChild = (path1: NodePath<any>, path2: NodePath<any>) => {
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
  const programPath1 = path1.find(p => p.isProgram());
  const programPath2 = path2.find(p => p.isProgram());

  const isSameProgram = programPath1.node === programPath2.node;
  return isSameProgram;
};

const isConflictingPaths = (d1: NodePath[], d2: NodePath[]) => {
  return d1.some(path => d2.some(otherPath => isParentOrChild(path, otherPath)));
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
};

const organizeInstructions = (instructions: Iterable<Instruction<any>>) => {
  return [...instructions].map(instruction => [instruction]);
  /*
  const instructionBlocks: Instruction<any>[][] = [];
  for(const newInstruction of instructions) {
    let addANewBlock = true;
    for(const instructions of instructionBlocks) {
      const conflict = instructions.some((instruction) => {
        return isConflictingDependencies(newInstruction.dependencies, instruction.dependencies);
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
    .map(instruction =>
      instruction.mutations.map(mutation => ({
        mutation,
        state: mutation.setup(
          asts,
          instruction.variants === undefined
            ? undefined
            : instruction.variants[instruction.variants.length - 1],
        ),
      })),
    )
    .forEach(payload => payload.map(({ mutation, state }) => mutation.execute(state)));
};

export const getAstPath = (ast: t.File): NodePath<t.Program> => {
  let filePath: NodePath<t.Program>;

  traverse(ast, {
    enter: path => {
      if (path.isProgram()) {
        filePath = path;
      } else {
        path.skip();
      }
    },
  });

  return filePath!;
};

const isIfStatement = path => path.isIfStatement();

export const forceConsequentSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, t.IfStatement>) => {
    path.get('alternate').registerAsWriteDependency();
    path.setDynamic('test', () => t.booleanLiteral(true));
  },
);
export const FORCE_CONSEQUENT = Symbol('force-consequent');
export const forceConsequentFactory = new SimpleInstructionFactory(
  FORCE_CONSEQUENT,
  forceConsequentSequence,
  isIfStatement,
);

export const forceAlternateSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, t.IfStatement>) => {
    path.get('consequent').registerAsWriteDependency();
    path.setDynamic('test', () => t.booleanLiteral(false));
  },
);

export const FORCE_ALTERNATE = Symbol('force-alternate');
export const forceAlternateFactory = new SimpleInstructionFactory(
  FORCE_ALTERNATE,
  forceAlternateSequence,
  isIfStatement,
);

export const replaceValueSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<any, any>) => {
    path.setDataDynamic('value', value => value);
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

const createValueVariantCollector = (
  condition: ConditionFn,
  symbol: symbol,
  key = 'value',
  collectCondition: ConditionFn = condition,
) => {
  return <T>(ast: t.File): T[][] => {
    const blocks: T[][] = [[]];
    traverse(ast, {
      enter: subPath => {
        if (subPath.isScope()) {
          blocks.push([]);
        }
        const current = (subPath.node as any)[key];
        if (condition(subPath)) {
          subPath.node[symbol as any] = filterVariantDuplicates(
            ([] as any[]).concat(...blocks),
          ).filter(v => v !== current);
        }
        if (collectCondition(subPath)) {
          blocks[blocks.length - 1].push(current);
        }
      },
      exit: subPath => {
        if (subPath.isScope()) {
          blocks.pop();
        }
      },
    });
    return blocks;
  };
};

const createValueInstructionFactory = (
  condition: ConditionFn,
  factorySymbol,
  symbol: symbol,
) => {
  return new SimpleInstructionFactory<void, t.Node>(
    factorySymbol,
    replaceValueSequence,
    condition,
    path => {
      return [...path.node[symbol as any]];
    },
    createValueVariantCollector(condition, symbol),
  );
};

const isStringLiteral = path => path.isStringLiteral();
export const CHANGE_STRING = Symbol('change-string');
const STRINGS = Symbol('strings');
const TOTAL_NODES = Symbol('total-nodes');
const replaceStringFactory = createValueInstructionFactory(
  isStringLiteral,
  CHANGE_STRING,
  STRINGS,
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
      .filter(value => !filterOut.has(value))
      .sort((a, b) => Math.abs(b - node.value) - Math.abs(a - node.value));
    return values;
  },
  createValueVariantCollector(isNumberLiteral, NUMBERS),
);

const CHANGE_BOOLEAN = Symbol('change-boolean');
export const replaceBooleanFactory = new SimpleInstructionFactory(
  CHANGE_BOOLEAN,
  replaceValueSequence,
  path => path.isBooleanLiteral(),
  (path: NodePath<t.BooleanLiteral>) => [!path.node.value],
);

type IdentifierProps = {
  name: string;
};
const replaceIdentifierSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<IdentifierProps, t.Identifier>) => {
    path.setDataDynamic('name', name => name);
  },
);
const isInvalidReplaceIdentifierParentPath = (parentPath: NodePath) => {
  return (
    (parentPath.parentPath.isVariableDeclarator() && parentPath.key === 'id') ||
    (parentPath.parentPath.isFunction() && typeof parentPath.key === 'number')
  );
};

const isMiddleOfObjectChain = (path: NodePath) => {
  return path.parentPath.isMemberExpression() && path.key === 'property';
};

const isReplaceableIdentifier = (path: NodePath) => {
  if (path.isIdentifier()) {
    const statementPath = path.find(
      subPath => subPath.isStatement() || subPath.isFunction(),
    );
    return (
      !isMiddleOfObjectChain(path) &&
      path.find(
        parentPath =>
          parentPath.node === statementPath.node ||
          isInvalidReplaceIdentifierParentPath(parentPath),
      ).node === statementPath.node
    );
  }
  return false;
};

const collectIdentifierVariant = (path: NodePath): boolean => {
  return path.isIdentifier() && !isMiddleOfObjectChain(path);
};

export const PREVIOUS_IDENTIFIER_NAMES = Symbol('previous-identifer-names');
export const CHANGE_IDENTIFIER = Symbol('change-identifier');
const replaceIdentifierFactory = new SimpleInstructionFactory(
  CHANGE_IDENTIFIER,
  replaceIdentifierSequence,
  isReplaceableIdentifier,
  path => [...path.node[PREVIOUS_IDENTIFIER_NAMES]],
  createValueVariantCollector(
    isReplaceableIdentifier,
    PREVIOUS_IDENTIFIER_NAMES,
    'name',
    collectIdentifierVariant,
  ),
);

type LogicalOrBinaryExpression = t.BinaryExpression | t.LogicalExpression;

type OperatorProps = string;
const createCategoryVariantFactory = <T>(
  key: string,
  categoryData: CategoryData<any>,
) => {
  return (path: NodePath<T>) => {
    const operator = path.getData(key);
    const operators = matchAndFlattenCategoryData(categoryData, operator);
    return operators;
  };
};
const replaceBinaryOrLogicalOperatorSequence = createMutationSequenceFactory(
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
const replaceBinaryOrLogicalOperatorFactory = new SimpleInstructionFactory(
  CHANGE_BINARY_OPERATOR,
  replaceBinaryOrLogicalOperatorSequence,
  isBinaryOrLogicalExpression,
  createCategoryVariantFactory('operator', binaryOperationCategories),
);

export const leftNullifyBinaryOperatorSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<void, LogicalOrBinaryExpression>) => {
    const left = path.get('left') as NodePathMutationWrapper<
      void,
      LogicalOrBinaryExpression
    >;
    path.replaceWith(left);
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
    const right = path.get('right') as NodePathMutationWrapper<
      void,
      LogicalOrBinaryExpression
    >;
    path.replaceWith(right);
  },
);
export const NULLIFY_RIGHT_OPERATOR = Symbol('nullify-right-operator');
export const rightNullifyBinaryOrLogicalOperatorFactory = new SimpleInstructionFactory(
  NULLIFY_RIGHT_OPERATOR,
  rightNullifyBinaryOperatorSequence,
  isBinaryOrLogicalExpression,
);

const assignmentSequence = createMutationSequenceFactory(
  (path: NodePathMutationWrapper<OperatorProps, t.AssignmentExpression>) => {
    path.setDataDynamic('operator', operator => operator);
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
const replaceAssignmentOperatorFactory = new SimpleInstructionFactory(
  CHANGE_ASSIGNMENT_OPERATOR,
  assignmentSequence,
  path => path.isAssignmentExpression(),
  createCategoryVariantFactory('operator', assignmentCategories),
);

type SwapFunctionCallArgs = {
  index1: number;
  index2: number;
};
const swapFunctionCallArgumentsSequence = ({ index1, index2 }: SwapFunctionCallArgs) => {
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
const swapFunctionCallArgumentsFactory = new InstructionFactory(function*(nodePath) {
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

const swapFunctionDeclarationParametersSequence = ({
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
const swapFunctionDeclarationParametersFactory = new InstructionFactory(function*(
  nodePath,
) {
  if (nodePath.isFunctionDeclaration() && nodePath.node.loc) {
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
});

type DeleteStatementArgs = {
  index: number;
};
const deleteStatementSequence = ({ index }: DeleteStatementArgs) => {
  return createMutationSequenceFactory(
    (wrapper: NodePathMutationWrapper<void, t.Node>) => {
      const statement = wrapper.get('body').get(index);
      statement.remove();
    },
  );
};

export const DELETE_STATEMENT = Symbol('delete-statement');
const deleteStatementFactory = new InstructionFactory(function*(path) {
  if (path.has('body')) {
    const bodyPaths = path.get('body');
    if (Array.isArray(bodyPaths)) {
      for (let b = 0; b < bodyPaths.length; b++) {
        const statementPath = bodyPaths[b];
        if (statementPath.isVariableDeclaration()) {
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

export const AST_FILE_PATH = Symbol('ast-file-path');
const instructionFactories: InstructionFactory<any>[] = [
  replaceAssignmentOperatorFactory,
  replaceBinaryOrLogicalOperatorFactory,
  replaceBooleanFactory,
  replaceStringFactory,
  swapFunctionCallArgumentsFactory,
  leftNullifyBinaryOrLogicalOperatorFactory,
  swapFunctionDeclarationParametersFactory,
  replaceNumberFactory,
  replaceIdentifierFactory,
  deleteStatementFactory,
  rightNullifyBinaryOrLogicalOperatorFactory,
  forceConsequentFactory,
  forceAlternateFactory,
];
const RETRIES = 1;
const findWidenedCoveragePaths = (astMap: Map<string, t.File>, locations: Location[]): Map<string, NodePath[]> => {
  const nodePaths: Map<string, NodePath[]> = new Map();
  for(const filePath of astMap.keys()) {
    nodePaths.set(filePath, []);
  }
  for (const [filePath, ast] of astMap.entries()) {
    const fileLocationPaths: Set<string> = new Set(
      locations
        .filter(location => filePath === location.filePath)
        .map(location => locationToKeyIncludingEnd(location.filePath, location)),
    );

    traverse(ast, {
      enter(path: NodePath) {
        const loc = path.node.loc;
        if (loc !== undefined) {
          const key = locationToKeyIncludingEnd(filePath, loc);
          if (fileLocationPaths.has(key)) {
            path[AST_FILE_PATH] = filePath;
            fileLocationPaths.delete(key);
            nodePaths.get(filePath)!.push(widenCoveragePath(path));
          }
        }
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


const nothingChangedMutationStackEvaluation = (e: MutationStackEvaluation) => {
  return (
    e.degradation === 0 &&
    e.improvement === 0
  );
};

/**
 * From worst evaluation to best evaluation
 */
export const compareMutationEvaluations = (
  r1: MutationEvaluation,
  r2: MutationEvaluation,
) => {
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

  const stackImprovementScore = stackEval1.improvement - stackEval2.improvement;
  if (stackImprovementScore !== 0) {
    return stackImprovementScore;
  }

  const stackDegradationScore = stackEval2.degradation - stackEval1.degradation;
  if (stackDegradationScore !== 0) {
    return stackDegradationScore;
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

export const executionDistanceFromStart = (ast: t.File, lineNumber: number, columnNumber: number): number | null => {
  let newDistanceFromStart = 0;
  let doneWithTraversal = false;
  traverse(ast, {
    exit: (path) => {
      if(doneWithTraversal) {
        path.skip();
        return;
      }
      newDistanceFromStart++;
      const node = path.node;
      const loc = node.loc;
      if (loc === undefined) {
        return;
      }

      if (loc.start.line === lineNumber && loc.start.column + 1 === columnNumber) {
        doneWithTraversal = true;
      }
    }
  });
  return doneWithTraversal ? newDistanceFromStart : null;
}

export const evaluateStackDifference = (
  originalResult: TestResult,
  newResult: TestResult,
  testAstMap: Map<string, t.File>,
  distanceFromStartMap: Map<string, number | null>,
): number => {
  // TODO: Just make passing test cases have null as the stack property
  if ((newResult as any).stack == null || (originalResult as any).stack == null) {
    return null;
  }
  const newStackInfo = ErrorStackParser.parse({
    stack: (newResult as any).stack,
  } as Error);
  const oldStackInfo = ErrorStackParser.parse({
    stack: (originalResult as any).stack,
  } as Error);

  const firstNewStackFrame = newStackInfo[0];
  const firstOldStackFrame = oldStackInfo[0];

  if (firstNewStackFrame.fileName !== firstOldStackFrame.fileName) {
    return null;
  }
  const originalDistanceFromStart = distanceFromStartMap.get(originalResult.key);
  const ast = testAstMap.get(newResult.file);
  if (originalDistanceFromStart == null || ast === undefined) {
    return null;
  }
  const newDistanceFromStart = executionDistanceFromStart(ast, firstNewStackFrame.lineNumber, firstNewStackFrame.columnNumber);
  if (newDistanceFromStart === null) {
    console.log('could not find', firstNewStackFrame);
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
  distanceFromStartMap: Map<string, number | null>,
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
    return (newResult as any).stack !== (originalResult as FailingTestData).stack;
  })();
  const stackScore = evaluateStackDifference(
    originalResult,
    newResult,
    testAstMap,
    distanceFromStartMap
  );

  const evaluation = {
    stackScore,
    endResultChange,
    errorChanged,
    previouslyFailing: !originalResult.passed,
  };
  return evaluation;
};

type MutationStackEvaluation = {
  nulls: number;
  improvement: number;
  degradation: number
};
const createMutationStackEvaluation = (): MutationStackEvaluation => ({
  nulls: 0,
  improvement: 0,
  degradation: 0,
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
  errorsChanged: null;
  crashed: true;
} & CommonMutationEvaluation;
export type NormalMutationEvaluation = {
  stackEvaluation: MutationStackEvaluation;
  testsWorsened: number;
  testsImproved: number;
  errorsChanged: number;
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
  testAstMap: Map<string, t.File>,
  originalResultErrorDistanceFromStart: Map<string, number | null>,
  instructions: Instruction<any>[],
): MutationEvaluation => {
  const notSeen = new Set(originalResults.testResults.keys());
  let testsWorsened = 0;
  let testsImproved = 0;
  const stackEvaluation: MutationStackEvaluation = createMutationStackEvaluation();
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
    const testEvaluation = evaluateModifiedTestResult(oldResult, newResult, testAstMap, originalResultErrorDistanceFromStart);
    // End result scores
    if (testEvaluation.endResultChange === EndResult.BETTER) {
      testsImproved++;
    } else if (testEvaluation.endResultChange === EndResult.WORSE) {
      testsWorsened++;
    } else if (
      testEvaluation.errorChanged && (testEvaluation.stackScore === 0 || testEvaluation.stackScore === null)
    ) {
      errorsChanged++;
    }

    if (testEvaluation.stackScore === null) {
      stackEvaluation.nulls++;
    } else if (testEvaluation.stackScore > 0) {
      stackEvaluation.improvement++;
    } else if(testEvaluation.stackScore < 0) {
      stackEvaluation.degradation++;
    }
  }
  return {
    instructions,
    testsWorsened,
    testsImproved,
    stackEvaluation,
    errorsChanged,
    crashed: false,
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
  a: MutationEvaluation,
  b: MutationEvaluation,
) => {
  const instructionLengthComparison = b.instructions.length - a.instructions.length;
  if (instructionLengthComparison !== 0) {
    return instructionLengthComparison;
  }

  return compareMutationEvaluations(a, b);
};

export const compareFinalInstructionEvaluations = (
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  instructions1: Instruction<any>[],
  instructions2: Instruction<any>[],
): number => {
  if (instructions1.length >= 1 && instructions2.length >= 1) {
    const comparisonFn = (a, b) =>
      compareInstruction(nodeEvaluations, instructionEvaluations, a, b);

    const best1 = instructions1.sort(comparisonFn)[instructions1.length - 1];
    const best2 = instructions2.sort(comparisonFn)[instructions2.length - 1];

    const comparison = comparisonFn(best1, best2);
    if (comparison !== 0) {
      return comparison;
    }

    // TODO: More evaluations = less good at this point. Add that in
  } else if (instructions1.length <= 0 && instructions2.length >= 1) {
    return 1;
  } else if (instructions1.length >= 1 && instructions2.length <= 0) {
    return -1;
  }

  return 0;
};

type InstructionCategory = {
  filePath: string;
  location: t.SourceLocation;
  instructions: Instruction<any>[];
};
export const categoriseInstructionsIntoCloestParentPaths = (
  instructions: Instruction<any>[],
  parentPaths: Map<string, NodePath[]>,
): Map<t.Node, InstructionCategory> => {
  const pathWithLocation = path => {
    return path.find(path => path.node.loc !== null);
  };
  const categorisedMap: Map<t.Node, InstructionCategory> = new Map();
  for (const instruction of instructions) {
    for (const [filePath, fileDependencies] of instruction.dependencies) {
      const fileCoverageNodes = parentPaths.get(filePath)!.map(pathWithLocation).map(path => path.node);
      for (const dependency of fileDependencies.writes) {
        const selectedParentPath = dependency.find(parentPath =>
          fileCoverageNodes.includes(parentPath.node),
        );
        const selectedFinalPath =
          selectedParentPath === null
            ? dependency
            : selectedParentPath.find(pathWithLocation);
        if (selectedFinalPath !== null) {
          const selectedNode = selectedFinalPath.node;
          if (categorisedMap.has(selectedNode)) {
            categorisedMap.get(selectedNode)!.instructions.push(instruction);
          } else {
            categorisedMap.set(selectedNode, {
              filePath,
              location: selectedNode.loc!,
              instructions: [instruction],
            });
          }
        }
      }
    }
  }
  return categorisedMap;
};

export const mutationEvalatuationMapToFaults = (
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  instructionCategories: InstructionCategory[],
): Fault[] => {
  const faults = [...instructionCategories]
    .sort((a, b) =>
      compareFinalInstructionEvaluations(
        nodeEvaluations,
        instructionEvaluations,
        a.instructions,
        b.instructions,
      ),
    )
    .map(
      ({ filePath, location }, i): Fault => {
        return {
          score: i,
          sourcePath: filePath,
          location: {
            start: location.start,
            end: location.end,
          },
          other: {},
        };
      },
    );
  return faults;
};

type IsFinishedFunction = (
  instructions: Heap<Instruction<any>>,
  testerResults: TesterResults,
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  nodeToInstructions: Map<string, Instruction<any>[]>,
  mutationCount: number,
) => boolean;

export type PluginOptions = {
  faultFileDir?: string;
  babelOptions?: ParserOptions;
  ignoreGlob?: string[] | string;
  onMutation?: (mutatatedFiles: string[]) => any;
  isFinishedFn?: IsFinishedFunction;
  mapToIstanbul?: boolean;
};

type DefaultIsFinishedOptions = {
  mutationThreshold?: number;
  durationThreshold?: number;
};

export const createDefaultIsFinishedFn = ({
  mutationThreshold,
  durationThreshold,
}: DefaultIsFinishedOptions = {}): IsFinishedFunction => {
  const isFinishedFn: IsFinishedFunction = (
    instructions,
    testerResults,
    nodeEvaluations,
    instructionEvaluations,
    nodeToInstructions,
    mutationCount,
  ): boolean => {
    if (durationThreshold !== undefined && testerResults.duration >= durationThreshold) {
      console.log('a');
      return true;
    }

    if (mutationThreshold !== undefined && mutationCount >= mutationThreshold) {
      console.log('b');
      return true;
    }

    const instructionArr = [...instructions];
    const hasPromisingEvaluation = (evaluations: Heap<MutationEvaluation>) => {
      if (evaluations.length <= 0) {
        return true;
      }
      const bestEvaluation = evaluations.peek();
      return (
        didSomethingGood(bestEvaluation) ||
        (bestEvaluation.crashed && bestEvaluation.instructions.length >= 2)
      );
    };

    if (
      !instructionArr
        .map(instruction => instructionEvaluations.get(instruction)!)
        .some(hasPromisingEvaluation)
    ) {
      return true;
    }

    const allWriteDependencies = [...new Set(instructionArr.map(instruction => instruction.writeDependencyKeys).flat())];
    const allDependencyEvaluations = allWriteDependencies.map(
      key => nodeEvaluations.get(key)!.mutationEvaluations,
    );
    if (!allDependencyEvaluations.some(hasPromisingEvaluation)) {
      return true;
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

const getAffectedFilePaths = (instructions: Heap<Instruction<any>>) => {
  return [
    ...new Set(
      [...instructions]
        .map(instruction => [...instruction.dependencies.keys()])
        .flat(),
    ),
  ];
};

const resetMutationsInInstruction = async (instructions: Heap<Instruction<any>>) => {
  const filePathsToReset = getAffectedFilePaths(instructions);
  await Promise.all(filePathsToReset.map(resetFile));
};

let solutionCounter = 0;

type LocationKey = string;
const faultFileName = 'faults.json';

export function* iteratorWithNoDuplicates<T>(iterable: Iterable<T>, getKey: (item: T) => any = item => item) {
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
    .map(key => typeof key === 'string' ? `${key}` : `[${key}]`)
    .join('.');
};
export const pathToPrimaryKey = (filePath: string, path: NodePath) => {
  return `${filePath}=>${pathToKey(path)}`;
};

export const compareNodeEvaluations = (
  evaluation1: NodeEvaluation,
  evaluation2: NodeEvaluation,
) => {
  const nodeMutationEvaluations1 = evaluation1.mutationEvaluations;
  const nodeMutationEvaluations2 = evaluation2.mutationEvaluations;
  if (nodeMutationEvaluations1.length <= 0 && nodeMutationEvaluations2.length >= 1) {
    if (didSomethingGood(nodeMutationEvaluations2.peek())) {
      return -1;
    } else {
      return 1;
    }
  } else if (
    nodeMutationEvaluations1.length >= 1 &&
    nodeMutationEvaluations2.length <= 0
  ) {
    if (didSomethingGood(nodeMutationEvaluations1.peek())) {
      return 1;
    } else {
      return -1;
    }
  } else if (
    nodeMutationEvaluations1.length >= 1 &&
    nodeMutationEvaluations2.length >= 1
  ) {
    const nodeMutationComparison = compareMutationEvaluations(
      nodeMutationEvaluations1.peek(),
      nodeMutationEvaluations2.peek(),
    );
    if (nodeMutationComparison !== 0) {
      return nodeMutationComparison;
    }
  }

  const initialComparison = evaluation1.initial - evaluation2.initial;
  if (initialComparison !== 0) {
    return initialComparison;
  }

  return 0;
};

export const compareInstruction = (
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  instruction1: Instruction<any>,
  instruction2: Instruction<any>,
) => {
  const instructionEvaluations1 = instructionEvaluations.get(instruction1)!;
  const instructionEvaluations2 = instructionEvaluations.get(instruction2)!;

  if (instructionEvaluations1.length <= 0 && instructionEvaluations2.length >= 1) {
    const evaluation2 = instructionEvaluations2.peek();
    if (didSomethingGood(evaluation2)) {
      return -1;
    } else {
      return 1;
    }
  } else if (instructionEvaluations1.length >= 1 && instructionEvaluations2.length <= 0) {
    const evaluation1 = instructionEvaluations1.peek();
    if (didSomethingGood(evaluation1)) {
      return 1;
    } else {
      return -1;
    }
  } else if (instructionEvaluations1.length >= 1 && instructionEvaluations2.length >= 1) {
    const instructionEvaluationComparison = compareMutationEvaluations(
      instructionEvaluations1.peek(),
      instructionEvaluations2.peek(),
    );
    if (instructionEvaluationComparison !== 0) {
      return instructionEvaluationComparison;
    }
  }

  const relevantKeys1 = instruction1.writeDependencyKeys;
  const relevantKeys2 = instruction2.writeDependencyKeys;

  const nodeEvaluations1 = relevantKeys1
    .map(node => nodeEvaluations.get(node)!)
    .sort(compareNodeEvaluations);
  const nodeEvaluations2 = relevantKeys2
    .map(node => nodeEvaluations.get(node)!)
    .sort(compareNodeEvaluations);
  
  const bestNodeEvaluation1 = nodeEvaluations1[nodeEvaluations1.length - 1];
  const bestNodeEvaluation2 = nodeEvaluations2[nodeEvaluations2.length - 1];

  const nodeEvaluationComparison = compareNodeEvaluations(
    bestNodeEvaluation1,
    bestNodeEvaluation2,
  );
  if (nodeEvaluationComparison !== 0) {
    return nodeEvaluationComparison;
  }

  return 0;
};

export const compareInstructionBlocks = (
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  block1: Heap<Instruction<any>>,
  block2: Heap<Instruction<any>>,
): number => {
  const bestInstruction1 = block1.peek();
  const bestInstruction2 = block2.peek();
  const instructionComparison = compareInstruction(
    nodeEvaluations,
    instructionEvaluations,
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

type NodeEvaluation = {
  initial: number;
  mutationEvaluations: Heap<MutationEvaluation>;
};

export const initialiseEvaluationMaps = (
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  nodeToInstructions: Map<string, Instruction<any>[]>,
  instructions: Instruction<any>[],
) => {
  const allDependencyKeys = new Set(instructions.map(instruction => instruction.indirectDependencyKeys).flat());
  for (const key of allDependencyKeys) {
    nodeEvaluations.set(key, {
      initial: 0,
      mutationEvaluations: new Heap(
        compareMutationEvaluationsWithLargeMutationCountsFirst,
      ),
    });
    nodeToInstructions.set(key, []);
  }
  for (const instruction of instructions) {
    for(const key of instruction.indirectDependencyKeys) {
      nodeToInstructions.get(key)!.push(instruction);
    }
    instructionEvaluations.set(
      instruction,
      new Heap(compareMutationEvaluationsWithLargeMutationCountsFirst),
    );
  }
};

const blockLengthToTotalDivisions = (n: number) => n * 2 - 1;
const instructionBlocksToMaxInstructionsLeft = (
  blocks: Iterable<Heap<Instruction<any>>>,
) => {
  let total = 0;
  for (const block of blocks) {
    total += blockLengthToTotalDivisions(block.length);
    for (const instruction of block) {
      total += instruction.variants === undefined ? 0 : instruction.variants.length - 1;
    }
  }
  return total;
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
  return path.find(path => {
    if (path.isStatement() || path.isBlockParent()) {
      return true;
    }
    const parent = path.parentPath;
    if (parent.isIfStatement() || parent.isFor() || parent.isCallExpression() || parent.isFunction()) {
      return true;
    };
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

    collectedPaths.push(aPath);
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
      enter: subPath => {
        if (!checkAndAddPath(subPath)) {
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

export const getDependencyPathMap = (pathMap: Map<string, DependencyInfo>): Map<string, NodePath[]> => {
  const map = new Map();

  for(const [filePath, fileDependencies] of pathMap) {
    map.set(filePath, getDependencyPaths(fileDependencies.writes));
  }

  return map;
};

const addMutationEvaluation = (
  nodeEvaluations: Map<string, NodeEvaluation>,
  instructionEvaluations: Map<Instruction<any>, Heap<MutationEvaluation>>,
  instructionQueue: Heap<Heap<Instruction<any>>>,
  nodeToInstructions: Map<string, Instruction<any>[]>,
  instructions: Heap<Instruction<any>>,
  mutationEvaluation: MutationEvaluation,
) => {
  const dependencyKeys = new Set([...instructions].map(instruction => instruction.indirectDependencyKeys).flat());

  for (const key of dependencyKeys) {
    nodeEvaluations.get(key)!.mutationEvaluations.push(mutationEvaluation);
  }

  for (const instruction of instructions) {
    instructionEvaluations.get(instruction)!.push(mutationEvaluation);
  }

  const instructionsAffected: Set<Instruction<any>> = new Set(
    [...dependencyKeys]
      .map(key => nodeToInstructions.get(key)!)
      .flat()
  );
  for (const instruction of instructionsAffected) {
    for (const block of instructionQueue) {
      if (block.some(blockInstruction => blockInstruction === instruction)) {
        instructionQueue.update(block);
      }
    }
  }
};

const widenCoveragePath = (path: NodePath) =>
  path.find(subPath => subPath.isStatement() || subPath.isFunction());

const addSplittedInstructionBlock = (
  queue: Heap<Heap<Instruction<any>>>,
  block: Heap<Instruction<any>>,
) => {
  const mid = Math.trunc(block.length / 2);
  const part1: Heap<Instruction<any>> = new Heap(block.compareFn);
  for (let i = 0; i < mid; i++) {
    part1.push(block.pop()!);
  }
  queue.push(part1);
  // TODO: Consider keeping things immutable
  queue.push(block);
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

export const createPlugin = ({
  faultFileDir = './faults/',
  babelOptions,
  ignoreGlob = [],
  onMutation = () => {},
  isFinishedFn = createDefaultIsFinishedFn(),
  mapToIstanbul = false,
}: PluginOptions): PartialTestHookOptions => {
  const solutionsDir = resolve(faultFileDir, 'solutions');

  const faultFilePath = resolve(faultFileDir, faultFileName);

  const nodeEvaluations: Map<string, NodeEvaluation> = new Map();
  const nodeToInstructions: Map<string, Instruction<any>[]> = new Map();
  const instructionEvaluations: Map<
    Instruction<any>,
    Heap<MutationEvaluation>
  > = new Map();

  const heapComparisonFn = (a: Heap<Instruction<any>>, b: Heap<Instruction<any>>) =>
    compareInstructionBlocks(nodeEvaluations, instructionEvaluations, a, b);

  let previousInstructions: Heap<Instruction<any>> = null!;
  let codeMap: Map<string, string> = null!;
  let originalAstMap: Map<string, t.File> = null!;
  let testAstMap: Map<string, t.File> = null!;
  const originalDistanceFromStartMap: Map<string, number> = new Map();
  let coveragePaths: Map<string, NodePath[]> = null!;
  let finished = false;
  const instructionQueue: Heap<Heap<Instruction<any>>> = new Heap(heapComparisonFn);
  let firstRun = true;
  let firstTesterResults: TesterResults;
  const failingTestFiles: Set<string> = new Set();
  const failingLocationKeys: Set<string> = new Set();

  let mutationCount = 0;

  const resolvedIgnoreGlob = (Array.isArray(ignoreGlob)
    ? ignoreGlob
    : [ignoreGlob]
  ).map(glob => resolve('.', glob).replace(/\\+/g, '/'));
  const analyzeEvaluation = async (mutationEvaluation: MutationEvaluation) => {
    if (previousInstructions !== null) {
      console.log({ ...mutationEvaluation, instructions: undefined });
      if (previousInstructions.length >= 2) {
        if (evaluationDidSomethingGoodOrCrashed(mutationEvaluation)) {
          addSplittedInstructionBlock(instructionQueue, previousInstructions);
        }
      } else {
        if (evaluationDidSomethingGoodOrCrashed(mutationEvaluation)) {
          const instruction = previousInstructions.peek();
          const previousEvaluations = instructionEvaluations.get(instruction)!;
          if (
            previousEvaluations.length <= 0 ||
            compareMutationEvaluations(mutationEvaluation, previousEvaluations.peek()) > 0
          ) {
            instruction.variants?.pop();
            if (instruction.variants !== undefined && instruction.variants.length >= 1) {
              instructionQueue.push(previousInstructions);
            }
          }
        }
      }
      addMutationEvaluation(
        nodeEvaluations,
        instructionEvaluations,
        instructionQueue,
        nodeToInstructions,
        previousInstructions,
        mutationEvaluation,
      );
    }
  };

  const runInstruction = async (tester: TesterResults) => {
    console.log('Processing instruction');
    const count = instructionBlocksToMaxInstructionsLeft(
      instructionQueue,
    );
    let instructionCount = 0;
    for (const block of instructionQueue) {
      instructionCount += block.length;
    }
    console.log(
      `Left: ${count} mutations, ${instructionCount} instructions, ${instructionQueue.length} blocks`,
    );

    if (instructionQueue.length <= 0) {
      finished = true;
      return false;
    }

    console.log('set peaking');
    const instructions = instructionQueue.pop()!;
    console.log(
      [...instructions].map(instruction =>
        instruction.type.toString(),
      ),
    );
    previousInstructions = instructions;

    //console.log('processing')

    const newAstMap = codeMapToAstMap(codeMap, babelOptions);
    executeInstructions(newAstMap, instructions);

    if (
      isFinishedFn(
        instructions,
        tester,
        nodeEvaluations,
        instructionEvaluations,
        nodeToInstructions,
        mutationCount,
      )
    ) {
      console.log('finished');
      // Avoids evaluation the same instruction twice if another addon requires a rerun of tests
      finished = true;
      return false;
    }

    mutationCount++;

    const mutatedFilePaths = getAffectedFilePaths(instructions);
    console.log(mutatedFilePaths);
    await Promise.all(
      mutatedFilePaths.map(filePath => createTempCopyOfFileIfItDoesntExist(filePath)),
    );

    await Promise.all(
      mutatedFilePaths.map(async filePath => {
        const originalCodeText = await readFile(filePath, 'utf8');
        const ast = newAstMap.get(filePath)!;
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
        //console.log('finished all files')
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
          const failedCoverage = failedCoverageMap.data as Coverage;
          console.log('failing coverage');
          const locations: Location[] = [];
          for (const [coveragePath, fileCoverage] of Object.entries(failedCoverage)) {
            //console.log('failing', coveragePath, micromatch.isMatch(coveragePath, resolvedIgnoreGlob));
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
          codeMap = await createFilePathToCodeMap([
            ...new Set(locations.map(location => location.filePath)),
          ]);
          originalAstMap = codeMapToAstMap(codeMap, babelOptions);
          const testCodeMap = await createFilePathToCodeMap([
            ...new Set([
              ...tester.testResults.values()
            ].map(testResult => testResult.file))
          ]);
          testAstMap = codeMapToAstMap(testCodeMap, babelOptions);
          for(const testResult of tester.testResults.values()) {
            if (testResult.passed) {
              continue;
            }
            const ast = testAstMap.get(testResult.file)!;
            if ((testResult as any).stack == null) {
              continue;
            }
            const stackError = ErrorStackParser.parse({
              stack: (testResult as any).stack,
            } as Error);
            const stackFrame = stackError[0];
            console.log(stackFrame);
            const distance = executionDistanceFromStart(ast, stackFrame.lineNumber, stackFrame.columnNumber);
            console.log('distance', distance);
            originalDistanceFromStartMap.set(testResult.key, distance);
          }
          const allInstructions = [
            ...gatherInstructions(instructionFactories, originalAstMap),
          ];
          console.log(
            'instructions',
            allInstructions.map(a => a.type),
          );

          coveragePaths = findWidenedCoveragePaths(originalAstMap, locations);

          const relevantInstructions = allInstructions.filter(instruction => {
            for(const [filePath, fileDependencies] of instruction.dependencies) {
              const fileCoveragePaths = coveragePaths.get(filePath);
              if(fileCoveragePaths === undefined) {
                continue;
              }

              for(const writePath of fileDependencies.writes) {
                for(const coveragePath of fileCoveragePaths) {
                  const potentialParent = writePath.find(path => path.node === coveragePath.node);
                  if (potentialParent !== null) {
                    return true;
                  }
                }
              }
            }

            return false;              
          });
          console.log(
            'relevant instructions',
            relevantInstructions.map(a => a.type),
          );

          initialiseEvaluationMaps(
            nodeEvaluations,
            instructionEvaluations,
            nodeToInstructions,
            relevantInstructions,
          );

          relevantInstructions.sort((a, b) =>
            compareInstruction(nodeEvaluations, instructionEvaluations, a, b),
          );

          const organizedInstructions = organizeInstructions(relevantInstructions);
          console.log(
            'organized instructions',
            organizedInstructions.map(a => a.map(b => b.type)),
          );
          const subHeapCompareFn = (a: Instruction<any>, b: Instruction<any>) =>
            compareInstruction(nodeEvaluations, instructionEvaluations, a, b);
          instructionQueue.push(
            ...organizedInstructions.map(
              instructions => new Heap(subHeapCompareFn, instructions),
            ),
          );
          if (instructionQueue.length > 0) {
            console.log('Pushing instruction');
          } else {
            console.log('Skipping instruction');
          }
        } else {
          const mutationEvaluation = evaluateNewMutation(firstTesterResults, tester, testAstMap, originalDistanceFromStartMap, [
            ...previousInstructions,
          ]);

          if (
            mutationEvaluation.testsImproved ===
              [...firstTesterResults.testResults.values()].filter(a => !a.passed)
                .length &&
            mutationEvaluation.testsWorsened === 0 &&
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

          await analyzeEvaluation(mutationEvaluation);
        }

        const rerun = await runInstruction(tester);
        if (!rerun) {
          return;
        }
        // TODO: DRY
        const testsToBeRerun = [...firstTesterResults.testResults.values()].map(
          result => result.file,
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
          crashed: true,
        };

        if (previousInstructions !== null) {
          await resetMutationsInInstruction(previousInstructions);
        }
        await analyzeEvaluation(mutationEvaluation);

        // TODO: Would be better if the exit hook could be told which tests to rerun. Maybe :P
        const rerun = await runInstruction(tester);

        return { rerun, allow: true };
      },
      complete: async (tester: FinalTesterResults) => {
        console.log('complete');
        console.log(`Mutations attempted: ${mutationsAttempted}`);
        await writeFile(
          resolve(faultFileDir, 'mutations-attempted.txt'),
          mutationsAttempted.toString(),
        );
        Promise.all(
          [...originalPathToCopyPath.values()].map(copyPath => unlink(copyPath)),
        ).then(() => rmdir(copyTempDir));

        console.log(failingLocationKeys);

        const categorisedInstructions = categoriseInstructionsIntoCloestParentPaths(
          [...instructionEvaluations.keys()],
          coveragePaths,
        );
        const faults = mutationEvalatuationMapToFaults(
          nodeEvaluations,
          instructionEvaluations,
          [...categorisedInstructions.values()],
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
