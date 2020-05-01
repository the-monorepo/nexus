export function nullCounts(values: any[]): number {
  return values.filter((value) => value === null).length;
}

export function undefinedCounts(values: any[]): number {
  return values.filter((value) => value === undefined).length;
}

export function allAreIntegers(values: any[]): boolean {
  for (const value of values) {
    if (!Number.isInteger(value)) {
      return false;
    }
  }
  return true;
}
