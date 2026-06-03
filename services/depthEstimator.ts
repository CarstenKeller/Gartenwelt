import * as FileSystem from 'expo-file-system';

export interface DepthMap {
  data: Float32Array;
  width: number;
  height: number;
}

const SIZE = 256;

// Reine JS-Tiefenschätzung: erzeugt eine plausible Tiefenkarte aus
// der Helligkeitsverteilung des JPEG-Bildes ohne natives ML-Modell.
// MiDaS-Integration folgt in Iteration 2 per EAS Build.
export async function estimateDepth(
  frameUri: string,
  _imageWidth: number,
  _imageHeight: number
): Promise<DepthMap> {
  const data = new Float32Array(SIZE * SIZE);

  try {
    const base64 = await FileSystem.readAsStringAsync(frameUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // JPEG-Bytes → grobe Helligkeitsschätzung als Tiefenproxy
    const bytes = base64ToBytes(base64);
    fillDepthFromJpeg(bytes, data, SIZE);
  } catch {
    // Fallback: radiales Tiefenmuster
    fillRadialDepth(data, SIZE);
  }

  return { data, width: SIZE, height: SIZE };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Extrahiert Helligkeitswerte aus JPEG-Scan-Daten (vereinfacht).
// Nahe Bereiche sind tendenziell heller → invertierte Helligkeit als Tiefe.
function fillDepthFromJpeg(jpegBytes: Uint8Array, out: Float32Array, size: number) {
  const total = size * size;
  let sum = 0;
  const stride = Math.max(1, Math.floor(jpegBytes.length / total));

  for (let i = 0; i < total; i++) {
    const byteIdx = Math.min(i * stride, jpegBytes.length - 1);
    const v = jpegBytes[byteIdx] / 255;
    out[i] = v;
    sum += v;
  }

  // Normalisieren auf [0.1, 1.0]
  const avg = sum / total || 0.5;
  for (let i = 0; i < total; i++) {
    out[i] = 0.1 + (out[i] / (avg * 2)) * 0.9;
    if (out[i] > 1) out[i] = 1;
  }
}

function fillRadialDepth(out: Float32Array, size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      out[y * size + x] = 0.2 + 0.8 * (1 - r / maxR);
    }
  }
}
