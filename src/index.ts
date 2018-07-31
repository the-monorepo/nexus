import cssColors from 'css-color-names';
const cssColorNames = Object.keys(cssColors);
function isValidRgbVal(magnitudeString: string): boolean {
  try {
    const magnitude: number = Number.parseFloat(magnitudeString);
    return magnitude >= 0 && magnitude <= 255;
  } catch (err) {
    return false;
  }
}

function isValidRgbValues(...values: string[]): boolean {
  for (const value of values) {
    if (!isValidRgbVal(value)) {
      return false;
    }
  }
  return true;
}

function isValidAlphaValue(magnitudeString: string): boolean {
  try {
    const magnitude: number = Number.parseFloat(magnitudeString);
    return magnitude <= 1 && magnitude >= 0;
  } catch (err) {
    return false;
  }
}

export type IsColorFunction = (aString: string) => boolean;

export function isColorName(value: string) {
  for (const name of cssColorNames) {
    if (name === value) {
      return true;
    }
  }
  return false;
}

export const isHexColor: IsColorFunction = value => {
  return value.match(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i) !== null;
};

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

export const isRgbColor: IsColorFunction = value => {
  const rgbMatches: RegExpMatchArray = value.match(
    /^rgb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  );
  if (rgbMatches && rgbMatches.length >= 4) {
    const [rgb, r, g, b] = rgbMatches;
    if (isValidRgbValues(r, g, b)) {
      return true;
    }
  }
  return false;
};

export const isRgbaColor: IsColorFunction = value => {
  const rgbaMatches: RegExpMatchArray | null = value.match(
    /^rgba\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  );
  if (rgbaMatches && rgbaMatches.length >= 5) {
    const [rgb, r, g, b, a] = rgbaMatches;
    if (isValidRgbValues(r, g, b) && isValidAlphaValue(a)) {
      return true;
    }
  }
  return false;
};

export const isHslColor: IsColorFunction = value => {
  const hslMatches: RegExpMatchArray | null = value.match(
    /^hsl\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)%\s*,\s*(\d+|\d*\.\d+)%\s*\)$/,
  );
  if (hslMatches && hslMatches.length >= 4) {
    const [hsl, h, s, l] = hslMatches;
    if (isValidHue(h) && isValidPercentageString(s) && isValidPercentageString(l)) {
      return true;
    }
  }
  return false;
};

export const isHslaColor: IsColorFunction = value => {
  const hslaMatches: RegExpMatchArray | null = value.match(
    /^hsla\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)%\s*,\s*(\d+|\d*\.\d+)%\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  );
  if (hslaMatches && hslaMatches.length >= 5) {
    const [hsl, h, s, l, a] = hslaMatches;
    if (
      isValidHue(h) &&
      isValidPercentageString(s) &&
      isValidPercentageString(l) &&
      isValidAlphaValue(a)
    ) {
      return true;
    }
  }
  return false;
};

export const isHwbColor: IsColorFunction = value => {
  const hwbMatches: RegExpMatchArray | null = value.match(
    /^hwb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)%\s*,\s*(\d+|\d*\.\d+)%\s*\)$/,
  );
  if (hwbMatches && hwbMatches.length >= 4) {
    const [hwb, h, w, b] = hwbMatches;
    try {
      const whiteness: number = Number.parseFloat(w);
      const blackness: number = Number.parseFloat(b);
      if (
        isValidHue(h) &&
        isValidPercentage(whiteness + blackness) &&
        isValidPercentage(whiteness) &&
        isValidPercentage(blackness)
      ) {
        return true;
      }
    } catch (err) {
      return false;
    }
  }
  return false;
};

export type ColorType = 'hsla' | 'hsl' | 'rgb' | 'rgba' | 'hex' | 'named' | 'hwb' | null;
export function cssColorFormat(value: string): ColorType {
  const colorTypeCheckers: [IsColorFunction, ColorType][] = [
    [isHexColor, 'hex'],
    [isHslaColor, 'hsla'],
    [isHslColor, 'hsl'],
    [isRgbColor, 'rgb'],
    [isRgbaColor, 'rgba'],
    [isColorName, 'named'],
    [isHwbColor, 'hwb'],
  ];
  for (const [colorCheckingFunction, typeName] of colorTypeCheckers) {
    if (colorCheckingFunction(value)) {
      return typeName;
    }
  }
  return null;
}

export function isCssColor(value: string): boolean {
  if (cssColorFormat(value)) {
    return true;
  } else {
    return false;
  }
}
