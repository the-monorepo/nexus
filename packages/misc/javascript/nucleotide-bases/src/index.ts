export const GUANINE = 'g';
export const URACIL = 'u';
export const THYMINE = 't';
export const ADENINE = 'a';
export const CYTOSINE = 'c';

export type RNABases = typeof ADENINE | typeof URACIL | typeof CYTOSINE | typeof GUANINE;
export type DNABases = typeof ADENINE | typeof THYMINE | typeof CYTOSINE | typeof GUANINE;
export type Bases = DNABases | RNABases;
