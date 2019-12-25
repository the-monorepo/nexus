import { 
  instructionToWriteNodePathDependencies,
  getAstPath
} from '../src/index';
import { parse } from '@babel/parser';

const ast = parse('(1 + 2) - 3');
const astPath = getAstPath(ast);
it('getAstPath', () => {
  expect(astPath.isProgram()).to.equal(true);
});
