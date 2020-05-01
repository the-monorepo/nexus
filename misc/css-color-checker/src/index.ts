import * as cssColors from 'named-css-colors';
import {
  isValidAlphaValue,
  isValidPercentageString,
  isValidPercentage,
  isValidHue,
  isValidRgbVal,
} from './value-checks';

const cssColorNames = Object.keys(cssColors);

function isValidRgbValues(...values: string[]): boolean {
  for (const value of values) {
    if (!isValidRgbVal(value)) {
      return false;
    }
  }
  return true;
}

export function isColorName(value?: unknown | null) {
  for (const name of cssColorNames) {
    if (name === value) {
      return true;
    }
  }
  return false;
}

export function isHexColor(value?: unknown | null): boolean {
  return (
    typeof value === 'string' &&
    value.match(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i) !== null
  );
}

export function isRgbColor(value?: unknown | null): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const rgbMatches: RegExpMatchArray | null = value.match(
    /^rgb\s*\(\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*,\s*(\d+|\d*\.\d+)\s*\)$/,
  );
  if (rgbMatches && rgbMatches.length >= 4) {
    const [rgb, r, g, b] = rgbMatches;
    if (isValidRgbValues(r, g, b)) {
      return true;
    }
  }
  return false;
}

export function isRgbaColor(value?: unknown | null): boolean {
  if (typeof value !== 'string') {
    return false;
  }
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
}

export function isHslColor(value?: unknown | null): boolean {
  if (typeof value !== 'string') {
    return false;
  }
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
}

export function isHslaColor(value?: unknown | null): boolean {
  if (typeof value !== 'string') {
    return false;
  }
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
}

export function isHwbColor(value?: unknown | null): boolean {
  if (typeof value !== 'string') {
    return false;
  }
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
}

export type ColorType = 'hsla' | 'hsl' | 'rgb' | 'rgba' | 'hex' | 'named' | 'hwb' | null;
export function cssColorFormat(value?: unknown | null): ColorType {
  if (typeof value !== 'string') {
    return null;
  }
  const colorTypeCheckers: [(s: unknown) => boolean, ColorType][] = [
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

export default cssColorFormat;
