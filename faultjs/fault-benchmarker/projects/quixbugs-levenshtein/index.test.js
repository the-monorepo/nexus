import { expect } from 'chai';
import { levenshtein } from './index';

describe('levenshtein', () => {
  it('1', () => expect(levenshtein("electron", "neutron")).to.equal(3));
  it('2', () => expect(levenshtein("kitten", "sitting")).to.equal(3));
  it('3', () => expect(levenshtein("rosettacode", "raisethysword")).to.equal(8));
  //it('4', () => expect(levenshtein("amanaplanacanalpanama", "docnoteidissentafastneverpreventsafatnessidietoncod")).to.equal(42));
  it('5', () => expect(levenshtein("abcdefg", "gabcdef")).to.equal(2));
  it('6', () => expect(levenshtein("", "")).to.equal(0));
  it('7', () => expect(levenshtein("hello", "olleh")).to.equal(4));
});
