import * as FileSystem from 'expo-file-system';
import { DepthMap } from './depthEstimator';

export interface PointCloud {
  // Interleaved: x, y, z, r, g, b pro Punkt (Float32)
  buffer: Float32Array;
  pointCount: number;
}

// Virtuelle Kameraparameter (geschätzt, da keine Kalibrierung vorliegt)
const FOCAL_LENGTH = 0.8; // Anteil der Bildbreite
const MAX_DEPTH = 10;     // Maximale Szenenentfernung in "Welteinheiten"
const SUBSAMPLE = 4;      // Jeden N-ten Pixel nehmen (Performance)

export function generatePointCloudFromFrame(
  rgbData: Uint8ClampedArray,
  imageWidth: number,
  imageHeight: number,
  depthMap: DepthMap,
  cameraOffset: [number, number, number]
): Float32Array {
  const depthW = depthMap.width;
  const depthH = depthMap.height;
  const points: number[] = [];

  const fx = FOCAL_LENGTH * depthW;
  const fy = FOCAL_LENGTH * depthH;
  const cx = depthW / 2;
  const cy = depthH / 2;

  for (let py = 0; py < depthH; py += SUBSAMPLE) {
    for (let px = 0; px < depthW; px += SUBSAMPLE) {
      const depthIdx = py * depthW + px;
      const depth = depthMap.data[depthIdx] * MAX_DEPTH;

      if (depth < 0.05) continue; // Nahe Null = ungültig

      const x = ((px - cx) / fx) * depth + cameraOffset[0];
      const y = -((py - cy) / fy) * depth + cameraOffset[1];
      const z = -depth + cameraOffset[2];

      // Farbe aus dem skalierten RGB-Bild interpolieren
      const imgX = Math.floor((px / depthW) * imageWidth);
      const imgY = Math.floor((py / depthH) * imageHeight);
      const rgbIdx = (imgY * imageWidth + imgX) * 4;

      const r = (rgbData[rgbIdx] ?? 128) / 255;
      const g = (rgbData[rgbIdx + 1] ?? 128) / 255;
      const b = (rgbData[rgbIdx + 2] ?? 128) / 255;

      points.push(x, y, z, r, g, b);
    }
  }

  return new Float32Array(points);
}

export function mergePointClouds(chunks: Float32Array[]): PointCloud {
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const buffer = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return { buffer, pointCount: totalLength / 6 };
}

export async function savePointCloud(cloud: PointCloud): Promise<string> {
  const path = FileSystem.cacheDirectory + 'gartenwelt_pointcloud.bin';
  // Float32Array als Base64 speichern
  const uint8 = new Uint8Array(cloud.buffer.buffer);
  const base64 = btoa(String.fromCharCode(...uint8));
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

export async function loadPointCloud(path: string): Promise<PointCloud> {
  const base64 = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const uint8 = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const buffer = new Float32Array(uint8.buffer);
  return { buffer, pointCount: buffer.length / 6 };
}
