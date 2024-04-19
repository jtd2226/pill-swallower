/**
 * Image utility.
 * @static
 * @constructor
 */
const ImageProcessor = {};

/**
 * Computes gaussian blur. Adapted from
 * https://github.com/kig/canvasfilters.
 * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {number} diameter Gaussian blur diameter, must be greater than 1.
 * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
 */
ImageProcessor.blur = function (pixels, width, height, diameter) {
  diameter = Math.abs(diameter);
  if (diameter <= 1) {
    throw new Error('Diameter should be greater than 1.');
  }
  let radius = diameter / 2;
  let len = Math.ceil(diameter) + (1 - (Math.ceil(diameter) % 2));
  let weights = new Float32Array(len);
  let rho = (radius + 0.5) / 3;
  let rhoSq = rho * rho;
  let gaussianFactor = 1 / Math.sqrt(2 * Math.PI * rhoSq);
  let rhoFactor = -1 / (2 * rho * rho);
  let wsum = 0;
  let middle = Math.floor(len / 2);
  for (let i = 0; i < len; i++) {
    let x = i - middle;
    let gx = gaussianFactor * Math.exp(x * x * rhoFactor);
    weights[i] = gx;
    wsum += gx;
  }
  for (let j = 0; j < weights.length; j++) {
    weights[j] /= wsum;
  }
  return this.separableConvolve(pixels, width, height, weights, weights, false);
};

/**
 * Computes the integral image for summed, squared, rotated and sobel pixels.
 * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
 *     through.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {array} opt_integralImage Empty array of size `width * height` to
 *     be filled with the integral image values. If not specified compute sum
 *     values will be skipped.
 * @param {array} opt_integralImageSquare Empty array of size `width *
 *     height` to be filled with the integral image squared values. If not
 *     specified compute squared values will be skipped.
 * @param {array} opt_tiltedIntegralImage Empty array of size `width *
 *     height` to be filled with the rotated integral image values. If not
 *     specified compute sum values will be skipped.
 * @param {array} opt_integralImageSobel Empty array of size `width *
 *     height` to be filled with the integral image of sobel values. If not
 *     specified compute sobel filtering will be skipped.
 * @static
 */
ImageProcessor.computeIntegralImage = function (pixels, width, height, opt_integralImage, opt_integralImageSquare, opt_tiltedIntegralImage, opt_integralImageSobel) {
  if (arguments.length < 4) {
    throw new Error('You should specify at least one output array in the order: sum, square, tilted, sobel.');
  }
  let pixelsSobel;
  if (opt_integralImageSobel) {
    pixelsSobel = ImageProcessor.sobel(pixels, width, height);
  }
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let w = i * width * 4 + j * 4;
      let pixel = ~~(pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114);
      if (opt_integralImage) {
        this.computePixelValueSAT_(opt_integralImage, width, i, j, pixel);
      }
      if (opt_integralImageSquare) {
        this.computePixelValueSAT_(opt_integralImageSquare, width, i, j, pixel * pixel);
      }
      if (opt_tiltedIntegralImage) {
        let w1 = w - width * 4;
        let pixelAbove = ~~(pixels[w1] * 0.299 + pixels[w1 + 1] * 0.587 + pixels[w1 + 2] * 0.114);
        this.computePixelValueRSAT_(opt_tiltedIntegralImage, width, i, j, pixel, pixelAbove || 0);
      }
      if (opt_integralImageSobel) {
        this.computePixelValueSAT_(opt_integralImageSobel, width, i, j, pixelsSobel[w]);
      }
    }
  }
};

/**
 * Helper method to compute the rotated summed area table (RSAT) by the
 * formula:
 *
 * RSAT(x, y) = RSAT(x-1, y-1) + RSAT(x+1, y-1) - RSAT(x, y-2) + I(x, y) + I(x, y-1)
 *
 * @param {number} width The image width.
 * @param {array} RSAT Empty array of size `width * height` to be filled with
 *     the integral image values. If not specified compute sum values will be
 *     skipped.
 * @param {number} i Vertical position of the pixel to be evaluated.
 * @param {number} j Horizontal position of the pixel to be evaluated.
 * @param {number} pixel Pixel value to be added to the integral image.
 * @static
 * @private
 */
ImageProcessor.computePixelValueRSAT_ = function (RSAT, width, i, j, pixel, pixelAbove) {
  let w = i * width + j;
  RSAT[w] = (RSAT[w - width - 1] || 0) + (RSAT[w - width + 1] || 0) - (RSAT[w - width - width] || 0) + pixel + pixelAbove;
};

/**
 * Helper method to compute the summed area table (SAT) by the formula:
 *
 * SAT(x, y) = SAT(x, y-1) + SAT(x-1, y) + I(x, y) - SAT(x-1, y-1)
 *
 * @param {number} width The image width.
 * @param {array} SAT Empty array of size `width * height` to be filled with
 *     the integral image values. If not specified compute sum values will be
 *     skipped.
 * @param {number} i Vertical position of the pixel to be evaluated.
 * @param {number} j Horizontal position of the pixel to be evaluated.
 * @param {number} pixel Pixel value to be added to the integral image.
 * @static
 * @private
 */
ImageProcessor.computePixelValueSAT_ = function (SAT, width, i, j, pixel) {
  let w = i * width + j;
  SAT[w] = (SAT[w - width] || 0) + (SAT[w - 1] || 0) + pixel - (SAT[w - width - 1] || 0);
};

/**
 * Converts a color from a color-space based on an RGB color model to a
 * grayscale representation of its luminance. The coefficients represent the
 * measured intensity perception of typical trichromat humans, in
 * particular, human vision is most sensitive to green and least sensitive
 * to blue.
 * @param {Uint8Array|Uint8ClampedArray|Array} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {boolean} fillRGBA If the result should fill all RGBA values with the gray scale
 *  values, instead of returning a single value per pixel.
 * @return {Uint8Array} The grayscale pixels in a linear array ([p,p,p,a,...] if fillRGBA
 *  is true and [p1, p2, p3, ...] if fillRGBA is false).
 * @static
 */
ImageProcessor.grayscale = function (pixels, width, height, fillRGBA = false) {
  /*
      Performance result (rough EST. - image size, CPU arch. will affect):
      https://jsperf.com/tracking-new-image-to-grayscale

      Firefox v.60b:
            fillRGBA  Gray only
      Old      11       551     OPs/sec
      New    3548      6487     OPs/sec
      ---------------------------------
              322.5x     11.8x  faster

      Chrome v.67b:
            fillRGBA  Gray only
      Old     291       489     OPs/sec
      New    6975      6635     OPs/sec
      ---------------------------------
              24.0x      13.6x  faster

      - Ken Nilsen / epistemex
     */

  let len = pixels.length >> 2;
  let gray = fillRGBA ? new Uint32Array(len) : new Uint8Array(len);
  let data32 = new Uint32Array(pixels.buffer || new Uint8Array(pixels).buffer);
  let i = 0;
  let c = 0;
  let luma = 0;

  // unrolled loops to not have to check fillRGBA each iteration
  if (fillRGBA) {
    while (i < len) {
      // Entire pixel in little-endian order (ABGR)
      c = data32[i];

      // Using the more up-to-date REC/BT.709 approx. weights for luma instead: [0.2126, 0.7152, 0.0722].
      //   luma = ((c>>>16 & 0xff) * 0.2126 + (c>>>8 & 0xff) * 0.7152 + (c & 0xff) * 0.0722 + 0.5)|0;
      // But I'm using scaled integers here for speed (x 0xffff). This can be improved more using 2^n
      //   close to the factors allowing for shift-ops (i.e. 4732 -> 4096 => .. (c&0xff) << 12 .. etc.)
      //   if "accuracy" is not important (luma is anyway an visual approx.):
      luma = (((c >>> 16) & 0xff) * 13933 + ((c >>> 8) & 0xff) * 46871 + (c & 0xff) * 4732) >>> 16;
      gray[i++] = (luma * 0x10101) | (c & 0xff000000);
    }
  } else {
    while (i < len) {
      c = data32[i];
      luma = (((c >>> 16) & 0xff) * 13933 + ((c >>> 8) & 0xff) * 46871 + (c & 0xff) * 4732) >>> 16;
      // ideally, alpha should affect value here: value * (alpha/255) or with shift-ops for the above version
      gray[i++] = luma;
    }
  }

  // Consolidate array view to byte component format independent of source view
  return new Uint8Array(gray.buffer);
};

/**
 * Fast horizontal separable convolution. A point spread function (PSF) is
 * said to be separable if it can be broken into two one-dimensional
 * signals: a vertical and a horizontal projection. The convolution is
 * performed by sliding the kernel over the image, generally starting at the
 * top left corner, so as to move the kernel through all the positions where
 * the kernel fits entirely within the boundaries of the image. Adapted from
 * https://github.com/kig/canvasfilters.
 * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
 * @param {number} opaque
 * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
 */
ImageProcessor.horizontalConvolve = function (pixels, width, height, weightsVector, opaque) {
  let side = weightsVector.length;
  let halfSide = Math.floor(side / 2);
  let output = new Float32Array(width * height * 4);
  let alphaFac = opaque ? 1 : 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sy = y;
      let sx = x;
      let offset = (y * width + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let cx = 0; cx < side; cx++) {
        let scy = sy;
        let scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
        let poffset = (scy * width + scx) * 4;
        let wt = weightsVector[cx];
        r += pixels[poffset] * wt;
        g += pixels[poffset + 1] * wt;
        b += pixels[poffset + 2] * wt;
        a += pixels[poffset + 3] * wt;
      }
      output[offset] = r;
      output[offset + 1] = g;
      output[offset + 2] = b;
      output[offset + 3] = a + alphaFac * (255 - a);
    }
  }
  return output;
};

/**
 * Fast vertical separable convolution. A point spread function (PSF) is
 * said to be separable if it can be broken into two one-dimensional
 * signals: a vertical and a horizontal projection. The convolution is
 * performed by sliding the kernel over the image, generally starting at the
 * top left corner, so as to move the kernel through all the positions where
 * the kernel fits entirely within the boundaries of the image. Adapted from
 * https://github.com/kig/canvasfilters.
 * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
 * @param {number} opaque
 * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
 */
ImageProcessor.verticalConvolve = function (pixels, width, height, weightsVector, opaque) {
  let side = weightsVector.length;
  let halfSide = Math.floor(side / 2);
  let output = new Float32Array(width * height * 4);
  let alphaFac = opaque ? 1 : 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sy = y;
      let sx = x;
      let offset = (y * width + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let cy = 0; cy < side; cy++) {
        let scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
        let scx = sx;
        let poffset = (scy * width + scx) * 4;
        let wt = weightsVector[cy];
        r += pixels[poffset] * wt;
        g += pixels[poffset + 1] * wt;
        b += pixels[poffset + 2] * wt;
        a += pixels[poffset + 3] * wt;
      }
      output[offset] = r;
      output[offset + 1] = g;
      output[offset + 2] = b;
      output[offset + 3] = a + alphaFac * (255 - a);
    }
  }
  return output;
};

/**
 * Fast separable convolution. A point spread function (PSF) is said to be
 * separable if it can be broken into two one-dimensional signals: a
 * vertical and a horizontal projection. The convolution is performed by
 * sliding the kernel over the image, generally starting at the top left
 * corner, so as to move the kernel through all the positions where the
 * kernel fits entirely within the boundaries of the image. Adapted from
 * https://github.com/kig/canvasfilters.
 * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @param {array} horizWeights The horizontal weighting vector, e.g [-1,0,1].
 * @param {array} vertWeights The vertical vector, e.g [-1,0,1].
 * @param {number} opaque
 * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
 */
ImageProcessor.separableConvolve = function (pixels, width, height, horizWeights, vertWeights, opaque) {
  let vertical = this.verticalConvolve(pixels, width, height, vertWeights, opaque);
  return this.horizontalConvolve(vertical, width, height, horizWeights, opaque);
};

/**
 * Compute image edges using Sobel operator. Computes the vertical and
 * horizontal gradients of the image and combines the computed images to
 * find edges in the image. The way we implement the Sobel filter here is by
 * first grayscaling the image, then taking the horizontal and vertical
 * gradients and finally combining the gradient images to make up the final
 * image. Adapted from https://github.com/kig/canvasfilters.
 * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
 */
ImageProcessor.sobel = function (pixels, width, height) {
  const gray = this.grayscale(pixels, width, height, true);
  let output = new Float32Array(width * height * 4);
  let sobelSignVector = new Float32Array([-1, 0, 1]);
  let sobelScaleVector = new Float32Array([1, 2, 1]);
  let vertical = this.separableConvolve(gray, width, height, sobelSignVector, sobelScaleVector);
  let horizontal = this.separableConvolve(gray, width, height, sobelScaleVector, sobelSignVector);

  for (let i = 0; i < output.length; i += 4) {
    let v = vertical[i];
    let h = horizontal[i];
    let p = Math.sqrt(h * h + v * v);
    output[i] = p;
    output[i + 1] = p;
    output[i + 2] = p;
    output[i + 3] = 255;
    pixels[i] = p;
    pixels[i + 1] = p;
    pixels[i + 2] = p;
    pixels[i + 3] = 255;
  }

  return output;
};

/**
 * Equalizes the histogram of a grayscale image, normalizing the
 * brightness and increasing the contrast of the image.
 * @param {pixels} pixels The grayscale pixels in a linear array.
 * @param {number} width The image width.
 * @param {number} height The image height.
 * @return {array} The equalized grayscale pixels in a linear array.
 */
ImageProcessor.equalizeHist = function (pixels, width, height) {
  let equalized = new Uint8ClampedArray(pixels.length);

  let histogram = new Array(256);
  for (let i = 0; i < 256; i++) histogram[i] = 0;

  for (let i = 0; i < pixels.length; i++) {
    equalized[i] = pixels[i];
    histogram[pixels[i]]++;
  }

  let prev = histogram[0];
  for (let i = 0; i < 256; i++) {
    histogram[i] += prev;
    prev = histogram[i];
  }

  let norm = 255 / pixels.length;
  for (let i = 0; i < pixels.length; i++) equalized[i] = (histogram[pixels[i]] * norm + 0.5) | 0;

  return equalized;
};

export default ImageProcessor;
