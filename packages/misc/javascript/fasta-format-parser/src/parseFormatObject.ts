import { ok, failure, isOk, valueOf } from 'resultful';

import * as ErrorTypes from './ErrorTypes.ts';
import * as FormatTypes from './FormatTypes.ts';
import * as FormatMetadata from './FormatMetadata.ts';

const defaultDelimiters = new Set(['|', '\n']);
const nextString = async (
  reader: AsyncIterableIterator<string>,
  delimiters: Set<string> = defaultDelimiters,
) => {
  let aString = '';
  let current = await reader.next();

  if (current.done) {
    return failure({
      type: ErrorTypes.INVALID_FASTA_FORMAT,
      error: new Error(`Expected a string but iterable was already done`),
      userFriendlyMessage: 'FASTA finished early',
      currentReaderResult: current,
    });
  }

  while (!current.done && !delimiters.has(current.value)) {
    aString += current.value;
    current = await reader.next();
  }

  return ok({
    value: aString,
    currentReaderResult: current,
  });
};

export const parsePartialStringOnlyFormatObject = async <
  MetadataType extends FormatMetadata.FormatMetadata,
>(
  formatMetadata: MetadataType,
  initialReaderResult: IteratorResult<string>,
  fastaReaderAfterType: AsyncIterableIterator<string>,
) => {
  const sequenceMetadataEntries: [string, string][] = [];

  const currentReaderResult = initialReaderResult;
  for (const key of formatMetadata.keys) {
    // Note: this HAS to be sequential since we're dealing with streams
    const result = await nextString(fastaReaderAfterType);
    if (!isOk(result)) {
      return result;
    }
    sequenceMetadataEntries.push([key, result.ok.value]);
  }

  const sequenceMetadata = Object.fromEntries(sequenceMetadataEntries);

  return ok({
    formatMetadata,
    sequenceMetadata,
    currentReaderResult,
  });
};

export const typeToMetadata = (
  type: FormatTypes.FormatType,
  initialReaderResult: IteratorResult<string>,
) => {
  switch (type) {
    case FormatTypes.LCL:
      return ok(FormatMetadata.LCL);

    case FormatTypes.BBS:
      return ok(FormatMetadata.BBS);

    case FormatTypes.BBM:
      return ok(FormatMetadata.BBM);

    case FormatTypes.GIM:
      return ok(FormatMetadata.GIM);

    case FormatTypes.GB:
      return ok(FormatMetadata.GB);

    case FormatTypes.EMB:
      return ok(FormatMetadata.EMB);

    case FormatTypes.PIR:
      return ok(FormatMetadata.PIR);

    case FormatTypes.SP:
      return ok(FormatMetadata.SP);

    case FormatTypes.PAT:
      return ok(FormatMetadata.PAT);

    case FormatTypes.PGP:
      return ok(FormatMetadata.PGP);

    case FormatTypes.REF:
      return ok(FormatMetadata.REF);

    case FormatTypes.GNL:
      return ok(FormatMetadata.GNL);

    case FormatTypes.GI:
      return ok(FormatMetadata.GI);

    case FormatTypes.DBJ:
      return ok(FormatMetadata.DBJ);

    case FormatTypes.PRF:
      return ok(FormatMetadata.PRF);

    case FormatTypes.PDB:
      return ok(FormatMetadata.PDB);

    case FormatTypes.TPG:
      return ok(FormatMetadata.TPG);

    case FormatTypes.TPE:
      return ok(FormatMetadata.TPE);

    case FormatTypes.TPD:
      return ok(FormatMetadata.TPD);

    case FormatTypes.TR:
      return ok(FormatMetadata.TR);
    default: {
      const errorMessage = `${type} is not a recongized FASTA format`;
      return failure({
        type: ErrorTypes.UNKNOWN_FASTA_FORMAT,
        error: new Error(errorMessage),
        message: errorMessage,
        currentReaderResult: initialReaderResult,
      });
    }
  }
};

export const parseFormatObject = async (
  fastaReaderStart: AsyncIterableIterator<string>,
) => {
  const typeResult = await nextString(fastaReaderStart);
  if (!isOk(typeResult)) {
    return typeResult;
  }
  const typeInfo = valueOf(typeResult);

  const type = typeInfo.value as FormatTypes.FormatType;

  // TODO: remove currentReaderReslt from this function
  const metadataResult = typeToMetadata(type, typeInfo.currentReaderResult);

  if (!isOk(metadataResult)) {
    return metadataResult;
  }

  const metadataInfo = valueOf(metadataResult);

  return parsePartialStringOnlyFormatObject(
    metadataInfo,
    typeInfo.currentReaderResult,
    fastaReaderStart,
  );
};
