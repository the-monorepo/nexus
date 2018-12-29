import * as FormatTypes from './FormatTypes.ts';

type BaseFormatMetadata<
  Type extends FormatTypes.FormatType,
  Keys extends Readonly<string[]>,
> = {
  type: Type;
  name: string;
  keys: Keys;
};

const createMetadata = <
  Type extends FormatTypes.FormatType,
  Keys extends Readonly<string[]>,
>(
  type: Type,
  name: string,
  keys: Keys,
): BaseFormatMetadata<Type, Keys> => ({
  type,
  name,
  keys,
});

export const LCL = createMetadata(FormatTypes.LCL, 'local (i.e. no database reference)', [
  'identifier',
] as const);
export const BBS = createMetadata(FormatTypes.BBS, 'GenInfo backbone seqid', [
  'identifier',
] as const);
export const BBM = createMetadata(FormatTypes.BBM, 'GenInfo backbone moltype', [
  'identifier',
] as const);
export const GIM = createMetadata(FormatTypes.GIM, 'GenInfo import ID', [
  'identifier',
] as const);
export const GB = createMetadata(FormatTypes.GB, 'GenBank', [
  'accession',
  'locus',
] as const);
export const EMB = createMetadata(FormatTypes.EMB, 'EMBL', [
  'accession',
  'locus',
] as const);
export const PIR = createMetadata(FormatTypes.PIR, 'PIR', ['accession', 'name'] as const);
export const SP = createMetadata(FormatTypes.SP, 'SWISS-PROT', [
  'accession',
  'name',
] as const);
export const PAT = createMetadata(FormatTypes.PAT, 'patent', [
  'countryCode',
  'patent',
  'sequenceNumber',
] as const);
export const PGP = createMetadata(FormatTypes.PGP, 'pre-grant patent', [
  'countryCode',
  'applicationNumber',
  'sequenceNumber',
] as const);
export const REF = createMetadata(FormatTypes.REF, 'RefSeq', [
  'accession',
  'name',
] as const);
export const GNL = createMetadata(FormatTypes.GNL, 'general database reference', [
  'database',
  'identifier',
] as const);
export const GI = createMetadata(FormatTypes.GI, 'GenInfo integrated database', [
  'identifier',
] as const);
export const DBJ = createMetadata(FormatTypes.DBJ, 'DDBJ', [
  'accession',
  'locus',
] as const);
export const PRF = createMetadata(FormatTypes.PRF, 'PRF', ['accession', 'name'] as const);
export const PDB = createMetadata(FormatTypes.PDB, 'PDB', ['entry', 'chain'] as const);
export const TPG = createMetadata(FormatTypes.TPG, 'third-party GenBank', [
  'accession',
  'name',
] as const);
export const TPE = createMetadata(FormatTypes.TPE, 'third-party EMBL', [
  'accession',
  'name',
] as const);
export const TPD = createMetadata(FormatTypes.TPD, 'third-party DDBJ', [
  'accession',
  'name',
] as const);
export const TR = createMetadata(FormatTypes.TR, 'TrEMBL', [
  'accession',
  'name',
] as const);

export type FormatMetadata =
  | typeof LCL
  | typeof BBS
  | typeof BBM
  | typeof GIM
  | typeof GB
  | typeof EMB
  | typeof PIR
  | typeof SP
  | typeof PAT
  | typeof PGP
  | typeof REF
  | typeof GNL
  | typeof GI
  | typeof DBJ
  | typeof PRF
  | typeof PDB
  | typeof TPG
  | typeof TPE
  | typeof TPD
  | typeof TR;
