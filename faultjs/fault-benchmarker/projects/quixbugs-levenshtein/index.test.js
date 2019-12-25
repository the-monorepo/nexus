import expect from 'expect';
import { levenshtein } from './index';

describe('levenshtein', () => {
  it('1', () => expect(levenshtein("electron", "neutron")).toBe(3));
  it('2', () => expect(levenshtein("kitten", "sitting")).toBe(3));
  it('3', () => expect(levenshtein("rosettacode", "raisethysword")).toBe(8));
  // TODO: it('4', () => expect(levenshtein("amanaplanacanalpanama", "docnoteidissentafastneverpreventsafatnessidietoncod")).toBe(42));
  it('5', () => expect(levenshtein("abcdefg", "gabcdef")).toBe(2));
  it('6', () => expect(levenshtein("", "")).toBe(0));
  it('7', () => expect(levenshtein("hello", "olleh")).toBe(4));
});
