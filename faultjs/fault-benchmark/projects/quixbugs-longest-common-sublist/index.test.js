import { longestCommonSubsequence } from './index';
import expect from 'expect';

describe('longestCommonSubsequence', () => {
  it('1', () => expect(longestCommonSubsequence("headache", "pentadactyl")).toBe("eadac"));
  it('2', () => expect(longestCommonSubsequence("daenarys", "targaryen")).toBe("aary"));
  it('3', () => expect(longestCommonSubsequence("XMJYAUZ", "MZJAWXU")).toBe("MJAU"));
  it('4', () => expect(longestCommonSubsequence("thisisatest", "testing123testing")).toBe("tsitest"));
  it('5', () => expect(longestCommonSubsequence("1234", "1224533324")).toBe("1234"));
  it('6', () => expect(longestCommonSubsequence("abcbdab", "bdcaba")).toBe("bcba"));
  it('7', () => expect(longestCommonSubsequence("TATAGC", "TAGCAG")).toBe("TAAG"));
  it('8', () => expect(longestCommonSubsequence("ABCBDAB", "BDCABA")).toBe("BCBA"));
  it('9', () => expect(longestCommonSubsequence("ABCD", "XBCYDQ")).toBe("BCD"));
  it('10', () => expect(longestCommonSubsequence("acbdegcedbg", "begcfeubk")).toBe("begceb"));
});
