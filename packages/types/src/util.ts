export function nullCounts(values: any[]): number {
  return values.filter(value => value === null).length;
}

export function undefinedCounts(values: any[]): number {
  return values.filter(value => value === undefined).length;
}
