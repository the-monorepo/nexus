import { success, error, isSuccess, valueOf } from 'resultful';

import * as ErrorTypes from './ErrorTypes';
import * as FormatTypes from './FormatTypes';
import * as FormatMetadata from './FormatMetadata';

const defaultDelimiters = new Set(['|', '\n']);
const nextString = async (reader: AsyncIterableIterator<string>, delimiters: Set<string> = defaultDelimiters) => {
  let aString = '';
  let current = await reader.next();

  if (current.done) {
    return error({
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

  return success({
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

  let currentReaderResult = initialReaderResult;
  for (const key of formatMetadata.keys) {
    // Note: this HAS to be sequential since we're dealing with streams
    const result = await nextString(fastaReaderAfterType);
    if (!isSuccess(result)) {
      return result;
    }
    sequenceMetadataEntries.push([key, result.payload.value]);
  }

  const sequenceMetadata = Object.fromEntries(sequenceMetadataEntries);

  return success({
    formatMetadata,
    sequenceMetadata,
    currentReaderResult
  });
};

export const typeToMetadata = (type: FormatTypes.FormatType, initialReaderResult: IteratorResult<string>) => {
  switch (type) {
    case FormatTypes.LCL:
        return success(FormatMetadata.LCL);

    case FormatTypes.BBS:
        return success(FormatMetadata.BBS);

    case FormatTypes.BBM:
        return success(FormatMetadata.BBM);

    case FormatTypes.GIM:
        return success(FormatMetadata.GIM);

    case FormatTypes.GB:
        return success(FormatMetadata.GB);

    case FormatTypes.EMB:
        return success(FormatMetadata.EMB);

    case FormatTypes.PIR:
        return success(FormatMetadata.PIR);

    case FormatTypes.SP:
        return success(FormatMetadata.SP);

    case FormatTypes.PAT:
        return success(FormatMetadata.PAT);

    case FormatTypes.PGP:
        return success(FormatMetadata.PGP);

    case FormatTypes.REF:
        return success(FormatMetadata.REF);

    case FormatTypes.GNL:
        return success(FormatMetadata.GNL);

    case FormatTypes.GI:
        return success(FormatMetadata.GI);

    case FormatTypes.DBJ:
        return success(FormatMetadata.DBJ);

    case FormatTypes.PRF:
        return success(FormatMetadata.PRF);

    case FormatTypes.PDB:
        return success(FormatMetadata.PDB);

    case FormatTypes.TPG:
        return success(FormatMetadata.TPG);

    case FormatTypes.TPE:
        return success(FormatMetadata.TPE);

    case FormatTypes.TPD:
        return success(FormatMetadata.TPD);

    case FormatTypes.TR:
        return success(FormatMetadata.TR);
    default:
      const errorMessage = `${type} is not a recongized FASTA format`;
      return error({
        type: ErrorTypes.UNKNOWN_FASTA_FORMAT,
        error: new Error(errorMessage),
        message: errorMessage,
        currentReaderResult: initialReaderResult,
      });
  }
};

export const parseFormatObject = async (fastaReaderStart: AsyncIterableIterator<string>) => {
  console.log('type');
  const typeResult = await nextString(fastaReaderStart);
  if (!isSuccess(typeResult)) {
    return typeResult;
  }
  console.log('type info', typeResult)
  const typeInfo = valueOf(typeResult);

  const type = typeInfo.value as FormatTypes.FormatType;

  console.log(type);
  // TODO: remove currentReaderReslt from this function
  const metadataResult = typeToMetadata(type, typeInfo.currentReaderResult);
  console.log('metadata', metadataResult)
 
  if (!isSuccess(metadataResult)) {
    return metadataResult;
  }

  console.log('parse');
  const metadataInfo = valueOf(metadataResult);

  return parsePartialStringOnlyFormatObject(metadataInfo, typeInfo.currentReaderResult, fastaReaderStart);
};
