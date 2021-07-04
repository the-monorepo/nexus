import {
  getReplacementIdentifierNode,
  AccessInfo,
  MEMBER_ACCESS,
  FUNCTION_ACCESS,
  CONSTRUCTOR_ACCESS,
  UNKNOWN_ACCESS,
  MemberAccessInfo,
} from '../src/index.ts';
const accessInfoToString = (info: AccessInfo) => {
  switch (info.type) {
    case MEMBER_ACCESS:
      return `.${info.name}`;
    case FUNCTION_ACCESS:
      return `.${info.name}(${info.argCount})`;
    case CONSTRUCTOR_ACCESS:
      return `.new ${info.name}`;
    case UNKNOWN_ACCESS:
      return '.?';
  }
};
const runTest = (
  index: number,
  match: AccessInfo[],
  sequence: AccessInfo[],
  expected: AccessInfo | null,
) => {
  it(`[${index}], ${match.map(accessInfoToString).join('')} vs ${sequence
    .map(accessInfoToString)
    .join('')} = ${expected === null ? 'null' : accessInfoToString(expected)}`, () => {
    expect(getReplacementIdentifierNode({ index, sequence: match }, sequence)).toBe(
      expected,
    );
  });
};
describe('replace identifier', () => {
  const mA: MemberAccessInfo = {
    type: MEMBER_ACCESS,
    name: 'a',
  };
  const mB: MemberAccessInfo = {
    type: MEMBER_ACCESS,
    name: 'b',
  };
  runTest(0, [mA], [mA, mB], null);

  runTest(0, [mA, mB], [mA], null);

  runTest(1, [mA, mB], [mA], null);

  runTest(0, [mA], [mB, mA], mB);
});
