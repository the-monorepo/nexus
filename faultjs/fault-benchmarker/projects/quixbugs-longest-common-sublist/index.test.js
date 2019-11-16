import { longestCommonSubsequence } from './index';
import { expect } from 'chai';

describe('longestCommonSubsequence', () => {
  it('1', () => expect(longestCommonSubsequence("headache", "pentadactyl")).to.equal("eadac"));
  it('2', () => expect(longestCommonSubsequence("daenarys", "targaryen")).to.equal("aary"));
  it('3', () => expect(longestCommonSubsequence("XMJYAUZ", "MZJAWXU")).to.equal("MJAU"));
  it('4', () => expect(longestCommonSubsequence("thisisatest", "testing123testing")).to.equal("tsitest"));
  it('5', () => expect(longestCommonSubsequence("1234", "1224533324")).to.equal("1234"));
  it('6', () => expect(longestCommonSubsequence("abcbdab", "bdcaba")).to.equal("bcba"));
  it('7', () => expect(longestCommonSubsequence("TATAGC", "TAGCAG")).to.equal("TAAG"));
  it('8', () => expect(longestCommonSubsequence("ABCBDAB", "BDCABA")).to.equal("BCBA"));
  it('9', () => expect(longestCommonSubsequence("ABCD", "XBCYDQ")).to.equal("BCD"));
  it('10', () => expect(longestCommonSubsequence("acbdegcedbg", "begcfeubk")).to.equal("begceb"));
});
