function isValidRgbVal(magnitudeString) {
  const magnitude = Number.parseFloat(magnitudeString);
  return magnitude >= 0 && magnitude <= 255;
}

function isValidRgbValues(...values) {
  for (const value of values) {
    if (!isValidRgbVal(value)) {
      return false;
    }
  }

  return true;
}

function isValidAlphaValue(magnitudeString) {
  const magnitude = Number.parseFloat(magnitudeString);
  return magnitude <= 1 && magnitude >= 0;
}

export function isHexColor(value) {
  return value.match(/^#[0-9a-f]{3,6,8}$/);
}
export function isRgbColor(value) {
  const rgbMatches = value.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);

  if (rgbMatches && rgbMatches.length >= 4) {
    const [rgb, r, g, b] = rgbMatches;

    if (isValidRgbValues(r, g, b)) {
      return true;
    }
  }

  return false;
}
export function isRgbaColor(value) {
  const rgbaMatches = value.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*$/);

  if (rgbaMatches && rgbaMatches.length >= 5) {
    const [rgb, r, g, b, a] = rgbaMatches;

    if (isValidRgbValues(r, g, b) && isValidAlphaValue(a)) {
      return true;
    }
  }

  return false;
}
export function isHslColor(value) {
  return false;
}
export function isColor(value) {
  if (isHexColor(value)) {
    return 'hex';
  }
}