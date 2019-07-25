'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.localize = void 0;

var _parser = _interopRequireDefault(require('@babel/parser'));

var _fs = require('mz/fs');

var _types = require('@babel/types');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

const localizeDeclarator = async (declarator, dependencies, assertion) => {
  declarator.expression;
};

const localizeVariableDeclarator = async (
  variableDeclarator,
  dependencies,
  assertion,
) => {
  const id = variableDeclarator.id;

  if ((0, _types.isIdentifier)(id)) {
    dependencies.set(id.name, new Set());

    if (id.decorators !== null) {
      for (const declarator of id.decorators) {
        await localizeVariableDeclarator(declarator, dependencies, assertion);
      }
    }
  }
};

const localizeVariableDeclaration = async (
  variableDeclaration,
  dependencies,
  assertion,
) => {
  for (const declarator of variableDeclaration.declarations) {
    await localizeVariableDeclarator(declarator);
  }
};

const localizeBlockStatement = async (blockStatement, assertion) => {
  for (const statement of blockStatement.body) {
    await localizeStatement(statement, assertion);
  }
};

const localizeEmptyStatement = async (statement, assertion) => {};

const localizeStatement = async (statement, dependencies, assertion) => {};

const localizeStatements = async (statements, dependencies, assertion) => {
  const reversedStatements = statements.slice().reverse();

  for (const statement of reversedStatements) {
    await localizeStatement(statement, dependencies, assertion);
  }
};

const localize = async (rootFile, assertions) => {
  const fileAsts = new Map();
  const code = await (0, _fs.readFile)(rootFile, 'utf8');

  const ast = _parser.default.parse(code, {
    sourceType: 'unambiguous',
  });

  fileAsts.set(rootFile, ast.program.body);
  const faults = localizeTree(ast);
  console.log(faults);
};

exports.localize = localize;
//# sourceMappingURL=index.js.map
