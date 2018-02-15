import cssColors from 'css-color-names';

function isValidRgbVal(magnitudeString: string): boolean {
  const magnitude: number = Number.parseFloat(magnitudeString);
  return magnitude >= 0 && magnitude <= 255;
}

function isValidRgbValues(...values: string[]): boolean {
  for(const value of values) {
    if (!isValidRgbVal(value)) {
      return false;
    }
  }
  return true;
}

function isValidAlphaValue(magnitudeString: string): boolean {
  const magnitude: number = Number.parseFloat(magnitudeString);
  return magnitude <= 1 && magnitude >= 0;
}

export function isHexColor(value: string): RegExpMatchArray | null {
  return value.match(/^#[0-9a-f]{3,6,8}$/);
}

export function isRgbColor(value: string) {
  const rgbMatches: RegExpMatchArray = value.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatches && rgbMatches.length >= 4) {
    const [rgb, r, g, b] = rgbMatches;
    if (isValidRgbValues(r, g, b)) {
      return true;
    }
  }
  return false;
}

export function isRgbaColor(value: string) {
  const rgbaMatches: RegExpMatchArray | null = value.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*$/);
  if (rgbaMatches && rgbaMatches.length >= 5) {
    const [rgb, r, g, b, a] = rgbaMatches;
    if (isValidRgbValues(r, g, b) && isValidAlphaValue(a)) {
      return true;
    }
  }
  return false;
}

export function isHslColor(value: string): boolean {
  return false;
}

export function isColor(value: string) {
  if (isHexColor(value)) {
    return 'hex';
  }
}
