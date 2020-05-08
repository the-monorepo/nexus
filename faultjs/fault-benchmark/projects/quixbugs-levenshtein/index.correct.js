export const levenshtein = (source, target) => {
  if(source.length === 0 || target.length === 0) {
    return source.length || target.length;
  } else if (source[0] === target[0]) {
    return levenshtein(source.slice(1), target.slice(1));
  } else {
    return 1 + Math.min(
      levenshtein(source, target.slice(1)),
      levenshtein(source.slice(1), target.slice(1)),
      levenshtein(source.slice(1), target),
    )
  }
}

/*
export const levenshtein = (source, target) => {
  if(source.length === 0 || target.length === 0) {
    return source.length || target.length;
  } else if (source[0] === target[0]) {
    return levenshtein(source.slice(1), target.slice(1));
  } else {
    return 1 + Math.min(
      levenshtein(source, target.slice(1)),
      levenshtein(source.slice(1), target.slice(1)),
      levenshtein(source.slice(1), target),
    )
  }
}
*/