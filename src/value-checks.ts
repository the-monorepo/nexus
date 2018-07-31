export function isValidRgbVal(magnitudeString: string): boolean {
  try {
    const magnitude: number = Number.parseFloat(magnitudeString);
    return magnitude >= 0 && magnitude <= 255;
  } catch (err) {
    return false;
  }
}

export function isValidAlphaValue(magnitudeString: string): boolean {
  try {
    const magnitude: number = Number.parseFloat(magnitudeString);
    return magnitude <= 1 && magnitude >= 0;
  } catch (err) {
    return false;
  }
}

export function isValidPercentageString(magnitudeString: string): boolean {
  try {
    const magnitude: number = Number.parseFloat(magnitudeString);
    return isValidPercentage(magnitude);
  } catch (err) {
    return false;
  }
}
export function isValidPercentage(magnitude: number): boolean {
  return magnitude >= 0 && magnitude <= 100;
}

export function isValidHue(valueString: string): boolean {
  try {
    const value: number = Number.parseFloat(valueString);
    return value >= 0 && value <= 360;
  } catch (err) {
    return false;
  }
}
