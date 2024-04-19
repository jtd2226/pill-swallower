export namespace Color {
  export type rgb = { r: number; b: number; g: number };
  export type xyz = { x: number; y: number; z: number };
  export type lab = { l: number; a: number; b: number };
}

export function rbgTosRGB({ r, g, b }: Color.rgb) {
  return { r: r / 255, g: g / 255, b: b / 255 };
}

export function rbgTolinearRGB(rgb: Color.rgb) {
  const { r, g, b } = rbgTosRGB(rgb);
  return {
    r: sRGBtoLinearRGB(r),
    g: sRGBtoLinearRGB(g),
    b: sRGBtoLinearRGB(b)
  };
}

/**
 * Converts RGB color to CIE 1931 XYZ color space.
 * https://www.image-engineering.de/library/technotes/958-how-to-convert-between-srgb-and-ciexyz
 */
export function rgbToXyz(rgb: Color.rgb) {
  const { r, g, b } = rbgTolinearRGB(rgb);
  const X = 0.4124 * r + 0.3576 * g + 0.1805 * b;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
  // For some reason, X, Y and Z are multiplied by 100.
  const [x, y, z] = [X, Y, Z].map(c => c * 100);
  return { x, y, z };
}

/**
 * Undoes gamma-correction from an RGB-encoded color.
 * https://en.wikipedia.org/wiki/SRGB#Specification_of_the_transformation
 * https://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
 * @param  {number}
 * @return {number}
 */
export function sRGBtoLinearRGB(color: number) {
  // Send this function a decimal sRGB gamma encoded color value
  // between 0.0 and 1.0, and it returns a linearized value.
  if (color <= 0.04045) {
    return color / 12.92;
  } else {
    return Math.pow((color + 0.055) / 1.055, 2.4);
  }
}

/**
 * Converts CIE 1931 XYZ colors to CIE L*a*b*.
 * The conversion formula comes from <http://www.easyrgb.com/en/math.php>.
 * https://github.com/cangoektas/xyz-to-lab/blob/master/src/index.js
 *
 *  accepts the CIE 1931 XYZ color to convert which refers to the D65/2° standard illuminant.
 *  returns the color in the CIE L*a*b* color space.
 */
// X, Y, Z of a "D65" light source.
// "D65" is a standard 6500K Daylight light source.
// https://en.wikipedia.org/wiki/Illuminant_D65
const D65 = [95.047, 100, 108.883];
export function xyzToLab({ x, y, z }: Color.xyz) {
  [x, y, z] = [x, y, z].map((v, i) => {
    v = v / D65[i];
    return v > 0.008856 ? Math.pow(v, 1 / 3) : v * 7.787 + 16 / 116;
  });
  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return { l, a, b };
}

export function rgbToLab(rgb: Color.rgb) {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Converts Lab color space to Luminance-Chroma-Hue color space.
 * http://www.brucelindbloom.com/index.html?Eqn_Lab_to_LCH.html
 */
export function labToLch({ l, a, b }: Color.lab) {
  const c = Math.sqrt(a * a + b * b);
  const h = abToHue({ a, b });
  return { l, c, h };
}

/**
 * Converts a and b of Lab color space to Hue of LCH color space.
 * https://stackoverflow.com/questions/53733379/conversion-of-cielab-to-cielchab-not-yielding-correct-result
 * @param  {number} a
 * @param  {number} b
 * @return {number}
 */
export function abToHue({ a, b }: { a: number; b: number }) {
  if (a >= 0 && b === 0) {
    return 0;
  }
  if (a < 0 && b === 0) {
    return 180;
  }
  if (a === 0 && b > 0) {
    return 90;
  }
  if (a === 0 && b < 0) {
    return 270;
  }
  let xBias = 0;
  if (a > 0 && b > 0) {
    xBias = 0;
  } else if (a < 0) {
    xBias = 180;
  } else if (a > 0 && b < 0) {
    xBias = 360;
  }
  return radiansToDegrees(Math.atan(b / a)) + xBias;
}

export function radiansToDegrees(radians: number) {
  return radians * (180 / Math.PI);
}

export function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

//calculate the differences in each of the three dimensions, square them, add them and take the square root.
export function euclidianDistance(a: Color.lab, b: Color.lab) {
  const dl = Math.pow(a.l - b.l, 2);
  const da = Math.pow(a.a - b.a, 2);
  const db = Math.pow(a.b - b.b, 2);
  return Math.sqrt(dl + da + db);
}

export function hue(rgb: Color.rgb) {
  return abToHue(rgbToLab(rgb));
}

export function compareRGB(a: Color.rgb, b: Color.rgb) {
  const aLab = rgbToLab(a);
  const bLab = rgbToLab(b);
  return euclidianDistance(aLab, bLab);
}
