import type { Frame } from './frameExtractor';

export interface PointCloud {
  positions: Float32Array;
  colors: Float32Array;
  count: number;
}

const SIZE = 256;
const FOCAL = 0.8;
const MAX_DEPTH = 8;
const STEP = 3; // jeden 3. Pixel samplen

export function buildPointCloud(
  frames: Frame[],
  depthMaps: Float32Array[]
): PointCloud {
  const pointsPerFrame = Math.floor(SIZE / STEP) ** 2;
  const total = frames.length * pointsPerFrame;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  let idx = 0;

  const fx = FOCAL * SIZE;
  const fy = FOCAL * SIZE;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  frames.forEach((frame, fi) => {
    const depth = depthMaps[fi];
    const img = frame.imageData.data;
    const offsetX = (fi / Math.max(frames.length - 1, 1)) * 8 - 4;

    for (let py = 0; py < SIZE; py += STEP) {
      for (let px = 0; px < SIZE; px += STEP) {
        const di = py * SIZE + px;
        const d = depth[di] * MAX_DEPTH;
        if (d < 0.1) continue;

        positions[idx * 3]     = ((px - cx) / fx) * d + offsetX;
        positions[idx * 3 + 1] = -((py - cy) / fy) * d;
        positions[idx * 3 + 2] = -d - fi * 0.4;

        const pi = (py * SIZE + px) * 4;
        colors[idx * 3]     = img[pi]     / 255;
        colors[idx * 3 + 1] = img[pi + 1] / 255;
        colors[idx * 3 + 2] = img[pi + 2] / 255;
        idx++;
      }
    }
  });

  return {
    positions: positions.slice(0, idx * 3),
    colors: colors.slice(0, idx * 3),
    count: idx,
  };
}
