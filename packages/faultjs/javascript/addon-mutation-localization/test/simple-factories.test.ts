import { parse, ParserOptions } from '@babel/parser';

import {
  AbstractSimpleInstructionFactory,
  InstructionFactory,
  deleteStatementFactory,
  forceConsequentFactory,
  forceAlternateFactory,
  replaceIdentifierFactory,
  replaceBooleanFactory,
  replaceStringFactory,
  swapFunctionDeclarationParametersFactory,
  swapFunctionCallArgumentsFactory,
  replaceNumberFactory,
  replaceBinaryOrLogicalOperatorFactory,
  replaceAssignmentOperatorFactory,
  leftNullifyBinaryOrLogicalOperatorFactory,
  rightNullifyBinaryOrLogicalOperatorFactory,
} from '../src/index.ts';
type Code = string;
type Factory = AbstractSimpleInstructionFactory<any, any>;
type ExpectedInstructionCount = number;
type TestData =
  | [Factory, Code, ExpectedInstructionCount]
  | [Factory, Code, ExpectedInstructionCount, ParserOptions];

const dataSet: TestData[] = [
  [deleteStatementFactory, 'const a = 0; const b = 0;', 0],
  [deleteStatementFactory, 'a = 0; b = 0;', 2],
  [deleteStatementFactory, 'if(Math.random() > 0.5) {}', 0],
  [deleteStatementFactory, 'fn1(); fn2(); a += 1;', 3],
  [deleteStatementFactory, 'function fm() { return false; }', 0],
  [forceConsequentFactory, 'if(Math.random() > 0.5) { console.log("hello") }', 1],
  [forceConsequentFactory, 'if(true) { console.log("hello") }', 0],
  [forceAlternateFactory, 'if(Math.random() > 0.5) { console.log("hello")}', 1],
  [forceAlternateFactory, 'if(false) { console.log("hello")}', 0],
  [replaceIdentifierFactory, 'const a = 0; a = 5; const b = a;', 0],
  [replaceIdentifierFactory, 'const a = 0; a = 5; const b = a; const c = a + b', 2],
  [
    replaceIdentifierFactory,
    'const arr = []; arr.fn1(1, 2); arr.fn2(1); arr.fn2(1, 2)',
    1,
  ],
  [replaceIdentifierFactory, 'const arr1 = [], arr2 = []; arr1.fn1(); arr2.fn1();', 1],
  [replaceIdentifierFactory, 'const arr1 = []; new Rawr();', 0],
  [replaceIdentifierFactory, 'const arr1 = rawr;', 0],
  [replaceIdentifierFactory, 'undefined; arr = a;', 1],
  [replaceIdentifierFactory, 'const a = [].rawr(); rawr.push([b, q])', 2],
  [
    replaceIdentifierFactory,
    "import module1 from 'string1'; import * as module2 from 'string2'; import { a, b, c } from 'string3'; const d = e",
    1,
    { sourceType: 'module' },
  ],
  [
    replaceIdentifierFactory,
    "import * as module1 from 'string1'; import * as module2 from 'string2'; module1.a(); module2.a()",
    1,
    { sourceType: 'module' },
  ],
  [replaceBooleanFactory, 'true', 1],
  [replaceStringFactory, '["hello", "my", "name", "is"]', 4],
  [
    replaceStringFactory,
    "import * as module1 from 'string1'; import * as module2 from 'string2'; a = 'string3';",
    0,
    { sourceType: 'module' },
  ],
  [swapFunctionDeclarationParametersFactory, 'const fn = (a, b, c) => {}', 2],
  [swapFunctionDeclarationParametersFactory, 'function fn(a, b, c) {}', 2],
  [swapFunctionCallArgumentsFactory, 'fn(1, 2, 3)', 2],
  [replaceNumberFactory, '1;2;3;4;', 4],
  [replaceBinaryOrLogicalOperatorFactory, '1 + 2; 1 === 2;', 2],
  [replaceAssignmentOperatorFactory, '1 + 1; b += 2; a %= 3', 2],
  [replaceAssignmentOperatorFactory, '[c[0], c[1]] = [c[1], c[0]]', 0],
  [replaceAssignmentOperatorFactory, 'test().a = 1', 1],
  [replaceAssignmentOperatorFactory, 'const a = 1', 0],
  [leftNullifyBinaryOrLogicalOperatorFactory, '1 + 2 % 4;', 2],
  [rightNullifyBinaryOrLogicalOperatorFactory, '1 + 2 % 4', 2],
];

let i = 0;

describe('simple factories', () => {
  for (const [factory, code, expectedInstructionCount, options] of dataSet) {
    // TODO: Needs better test names
    const id = i;
    it(`${id.toString()} - ${code}`, () => {
      console.log(id, id, id, id);
      const filePath = '';

      const ast = parse(code, options);
      const astMap = new Map([[filePath, ast]]);

      const factoryWrapper = new InstructionFactory([factory]);
      factoryWrapper.setup(astMap);
      const instructions = [...factoryWrapper.createInstructions(astMap)];

      expect(
        instructions.map((instruction) => ({
          keys: instruction.conflictWriteDependencyKeys,
          variantLength: instruction.variants?.length,
        })),
      ).toHaveLength(expectedInstructionCount);
    });

    i++;
  }
});
