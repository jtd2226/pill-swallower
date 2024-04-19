import { Color, compareRGB } from './colorprocessing';

type ObjectBoundary = {
  id: number;
  depth: number;
  x: number;
  y: number;
  color: Color.rgb;
};

export class ColorTracker {
  /**
   * Holds the maximum dimension to classify a rectangle.
   * @default Infinity
   * @type {number}
   */
  maxGroupSize = Infinity;
  width = 0;
  height = 0;

  /**
   * Holds the minimum group size to be classified as a rectangle.
   * @default 30
   * @type {number}
   */
  minGroupSize = 200;

  /**
   * Find the given color in the given matrix of pixels using Flood fill
   * algorithm to determines the area connected to a given node in a
   * multi-dimensional array.
   * @param {Uint8ClampedArray} pixels The pixels data to track.
   * @param {number} width The pixels canvas width.
   * @param {number} height The pixels canvas height.
   * @param {string} color The color to be found
   * @private
   */
  trackColor_ = (pixels: Uint8ClampedArray, context: CanvasRenderingContext2D) => {
    const { height, width } = this;
    function neighbors(id: number) {
      const x = 4;
      const y = 4 * width;
      return [
        //
        id - x,
        id - x - y,
        id - y,
        id - x + y,
        id - y + x,
        id + x,
        id + x + y,
        id + y
      ].filter(id => id > 0 && id < pixels.length);
    }

    function drawPoint({ id, radius, color }: { id: number; radius?: number; color?: string }) {
      color ??= 'red';
      radius ??= 10;
      const y = Math.floor(id / (4 * width));
      const x = Math.floor((id - y * 4 * width) / 4);
      context.fillStyle = color;
      context.strokeStyle = color;
      context.beginPath();
      context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fill();
    }

    const marked: Record<string, boolean> = {};
    const queue = Array<number | null>();
    const bounds: ObjectBoundary[][] = [];
    const thresholds = {
      color: 40,
      depth: 8
    };
    const current: { id: number; depth: number; bounds: ObjectBoundary[] } = {
      id: 0,
      depth: 0,
      bounds: []
    };

    const hist: Record<string, number> = {};

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (marked[current.id]) {
          current.id += 4;
          continue;
        }
        const color: Color.rgb = {
          r: pixels[current.id],
          g: pixels[current.id + 1],
          b: pixels[current.id + 2]
        };
        queue.push(current.id, null);
        current.bounds = [];
        current.depth = 0;
        let nomatchcount = 0;

        while (queue.length) {
          const id = queue.shift();

          if (id === null) {
            current.depth++;
            nomatchcount = 0;
            // if (current.depth > Math.max(width, height) * 0.2) break;
            continue;
          }
          if (id === undefined) break;
          if (marked[id]) continue;

          marked[id] = true;

          const nextcolor = {
            r: pixels[id],
            g: pixels[id + 1],
            b: pixels[id + 2]
          };
          const distance = compareRGB(color, nextcolor);

          const isMatch = distance < thresholds.color;
          if (!isMatch) {
            hist[id] ??= 0;
            hist[id]++;
            drawPoint({ id, radius: 0.5, color: 'blue' });
            // debugger;
            nomatchcount++;
            if (nomatchcount > thresholds.depth) break;
            continue;
          }

          // color.r = (nextcolor.r + color.r) * 0.5;
          // color.b = (nextcolor.r + color.r) * 0.5;
          // color.g = (nextcolor.r + color.r) * 0.5;

          // drawPoint({ id, radius: 0.5, color: 'red' });

          if (current.bounds.length > this.maxGroupSize) {
            current.bounds = [];
            break;
          }

          const y = Math.floor(id / (4 * width));
          const x = Math.floor((id - y * 4 * width) / 4);
          current.bounds.push({
            id,
            depth: current.depth,
            x,
            y,
            color
          });

          neighbors(id).forEach(n => {
            if (marked[n]) return;
            queue.push(n);
          });
          queue.push(null);
        }

        if (current.bounds.length < this.minGroupSize) {
          continue;
        }

        bounds.push(current.bounds);
      }
    }

    return bounds;
  };

  floodfill = (pixels: Uint8ClampedArray, context: CanvasRenderingContext2D) => {
    const { width, height } = this;
    function neighbors(id: number) {
      const x = 4;
      const y = 4 * width;
      return [
        //
        id - x - y,
        id - x + y,
        id - y + x,
        id + x + y,
        id - y,
        id + y,
        id + x,
        id - x
      ].filter(id => (pixels[id] ?? null) !== null);
    }

    function drawPoint({ id, x, y, radius, color }: { id?: number; x?: number; y?: number; radius?: number; color?: string }) {
      color ??= 'red';
      radius ??= 10;
      const yPos = y === undefined ? Math.floor(id! / (4 * width)) : y;
      const xPos = x === undefined ? Math.floor((id! - yPos * 4 * width) / 4) : x;
      context.fillStyle = color;
      context.strokeStyle = color;
      context.beginPath();
      context.arc(xPos, yPos, radius, 0, 2 * Math.PI);
      context.fill();
    }

    const getId = ({ x, y }: { x: number; y: number }) => {
      return y * 4 * width + x * 4;
    };

    const getXY = (id: number) => {
      const y = Math.floor(id / (4 * width));
      const x = Math.floor((id - y * 4 * width) / 4);
      return {
        x,
        y
      };
    };

    const marked: Record<number, boolean> = {};
    const bg: Record<string, Color.rgb> = {};
    const shapes: number[][] = [];

    const findShapes = () => {
      const isEdge = (id: number) => [pixels[id], pixels[id + 1], pixels[id + 2]].every(c => c > 200);
      for (let id = 0; id < pixels.length; id += 4) {
        // const { x, y } = getXY(id);
        const q = [id];
        const bounds = [];

        // follow edges neighbors and add to bounds until they are marked or no longer white
        while (q.length) {
          const node = q.pop() ?? null;
          if (node === null) continue;
          if (marked[node]) continue;
          marked[node] = true;
          if (!isEdge(node)) continue;
          bounds.push(node);
          const cracker = neighbors(node).find(n => {
            if (marked[n]) return;
            if (!isEdge(n)) return;
            return neighbors(node).some(n => {
              if (marked[n]) return;
              if (!isEdge(n)) return;
              return true;
            });
          });
          if (cracker) q.push(cracker);
          // Do rect calculations
        }

        if (!bounds.length) continue;
        if (bounds.length < 100) continue;
        bounds.forEach(id => {
          drawPoint({ id, radius: 0.5, color: 'red' });
        });
        shapes.push(bounds);
        debugger;
      }
    };
    findShapes();
    debugger;
    if (shapes.length) return shapes;

    const findBG = ({ x, y }: { x: number; y: number }) => {
      const id = getId({ x, y });
      const q = [id];
      const color = {
        r: pixels[id],
        g: pixels[id + 1],
        b: pixels[id + 2]
      };

      while (q.length) {
        const pixel = {
          id: q.shift(),
          color: {
            r: 0,
            b: 0,
            g: 0
          }
        };
        if (pixel.id === null) break;
        if (pixel.id === undefined) break;
        if (marked[pixel.id]) continue;
        pixel.color = {
          r: pixels[pixel.id],
          g: pixels[pixel.id + 1],
          b: pixels[pixel.id + 2]
        };
        const distance = compareRGB(color, pixel.color);
        if (distance > 45) {
          drawPoint({ id: pixel.id, radius: 0.5, color: 'blue' });
          continue;
        }

        marked[pixel.id] = true;
        neighbors(pixel.id).forEach(n => {
          if (marked[n]) return;
          q.push(n);
        });
        bg[`R:${color.r} B:${color.b} G:${color.g}`] = color;
      }
    };

    // for (let i = 0; i < width; i++) {
    //   findBG({ x: i, y: 0 });
    //   findBG({ x: i, y: height - 8 });
    // }
    // for (let i = 0; i < height; i++) {
    //   findBG({ x: 0, y: i });
    //   findBG({ x: width - 8, y: i });
    // }

    const getPills = () => {
      for (let id = 0; id < pixels.length; id += 4) {
        if (marked[id]) continue;
        const q = [id, null];
        const points: number[] = [];

        const { x, y } = getXY(id);
        const rect = {
          max: {
            x,
            y
          },
          min: {
            x,
            y
          },
          center: {
            x,
            y
          },
          width: 0,
          height: 0
        };

        while (q.length) {
          const first = q.shift();
          if (first === null) {
            continue;
          }
          if (first === undefined) break;
          if (marked[first]) continue;
          if (points.length > this.maxGroupSize) break;

          // const isInside = Object.values(bg).every(color => {
          //   const distance = compareRGB(color, {
          //     r: pixels[first],
          //     g: pixels[first + 1],
          //     b: pixels[first + 2]
          //   });
          //   return distance > 40;
          // });

          // if (!isInside) continue;

          const xy = getXY(first);
          rect.max.x = Math.max(xy.x, rect.max.x);
          rect.max.y = Math.max(xy.y, rect.max.y);
          rect.min.x = Math.min(xy.x, rect.min.x);
          rect.min.y = Math.min(xy.y, rect.min.y);
          rect.width = rect.max.x - rect.min.x;
          rect.height = rect.max.y - rect.min.y;
          rect.center.x = rect.width * 0.5 + rect.min.x;
          rect.center.y = rect.height * 0.5 + rect.min.y;
          marked[first] = true;
          neighbors(first).forEach(n => {
            if (marked[n]) return;
            q.push(n);
          });
          q.push(null);
          points.push(first);
        }
        if (points.length < this.minGroupSize) continue;
        if (points.length > this.maxGroupSize) continue;

        debugger;
        points.forEach(id => {
          drawPoint({ id, radius: 0.5, color: 'red' });
        });
        shapes.push(points);
      }
    };

    return shapes;
  };

  /**
   * Tracks the `Video` frames. This method is called for each video frame in
   * order to emit `track` event.
   */
  track = ({ canvas, handler }: { canvas: HTMLCanvasElement; handler: (rects: number[][]) => unknown }) => {
    const { width, height } = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    const pixels = context.getImageData(0, 0, width, height).data;
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    // const perimeter = width * 2 + height * 2;
    // this.maxGroupSize = perimeter * 0.2;
    // this.minGroupSize = Math.ceil(perimeter * 0.1);

    this.maxGroupSize = width * height * 0.2;
    this.minGroupSize = width * height * 0.0005;

    // handler(this.trackColor_(pixels, canvas));
    // this.trackColor_(pixels, canvas);
    handler(this.floodfill(pixels, context));
  };
}
