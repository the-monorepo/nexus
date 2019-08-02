import { subtractCoverage, cloneCoverage } from '../src';
describe('subtractCoverage', () => {
  const populatedCoverage1 = {
    aPath: {
      path: 'aPath',
      statementMap: {
        '0': {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 2,
          },
        },
        '1': {
          start: {
            line: 3,
            column: 1,
          },
          end: {
            line: 4,
            column: 2,
          },
        },
      },
      fnMap: {},
      branchMap: {},
      s: {
        '0': 1,
        '1': 2,
      },
      f: {},
      b: {},
      _coverageSchema: 'schema',
      hash: 'hash',
    },
  };
  const populatedCoverage2 = cloneCoverage(populatedCoverage1);
  populatedCoverage2.aPath.s['1'] = 5;
  const differenceBetween1And2 = {
    aPath: {
      path: 'aPath',
      statementMap: {
        '0': {
          start: {
            line: 1,
            column: 1,
          },
          end: {
            line: 1,
            column: 2,
          },
        },
        '1': {
          start: {
            line: 3,
            column: 1,
          },
          end: {
            line: 4,
            column: 2,
          },
        },
      },
      fnMap: {},
      branchMap: {},
      s: {
        '0': 0,
        '1': 3,
      },
      f: {},
      b: {},
      _coverageSchema: 'schema',
      hash: 'hash',
    },
  };

  it('{} - {}', () => {
    expect(subtractCoverage({}, {})).to.deep.equal({});
  });
  const emptyCoverage = {
    aPath: {
      path: 'aPath',
      statementMap: {},
      fnMap: {},
      branchMap: {},
      s: {},
      f: {},
      b: {},
      _coverageSchema: 'schema',
      hash: 'hash',
    },
  };
  it('empty coverage - undefined', () => {
    expect(subtractCoverage(emptyCoverage, undefined)).to.deep.equal(emptyCoverage);
  });
  it('empty coverage - empty coverage', () => {
    expect(subtractCoverage(emptyCoverage, emptyCoverage)).to.deep.equal({});
  });
  it('populated1 - {}', () => {
    expect(subtractCoverage(populatedCoverage1, {})).to.deep.equal(populatedCoverage1);
  });
  it('populated1 - undefined', () => {
    expect(subtractCoverage(populatedCoverage1, undefined)).to.deep.equal(populatedCoverage1);
  });
  it('undefined - undefined', () => {
    expect(subtractCoverage(undefined, undefined)).to.deep.equal({});
  })
  it('populated1 - populated1', () => {
    expect(subtractCoverage(populatedCoverage2, populatedCoverage1)).to.deep.equal(
      differenceBetween1And2,
    );
  });
});
