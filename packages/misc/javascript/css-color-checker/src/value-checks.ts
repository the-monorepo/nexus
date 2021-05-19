export function isValidRgbVal(magnitudeString: string): boolean {
  const magnitude: number = Number.parseFloat(magnitudeString);
  return magnitude >= 0 && magnitude <= 255;
}

export function isValidAlphaValue(magnitudeString: string): boolean {
  const magnitude: number = Number.parseFloat(magnitudeString);
  return magnitude <= 1 && magnitude >= 0;
}

export function isValidPercentage(magnitude: number): boolean {
  return magnitude >= 0 && magnitude <= 100;
}

export function isValidPercentageString(magnitudeString: string): boolean {
  const magnitude: number = Number.parseFloat(magnitudeString);
  return isValidPercentage(magnitude);
}

export function isValidHue(valueString: string): boolean {
  const value: number = Number.parseFloat(valueString);
  return value >= 0 && value <= 360;
}
