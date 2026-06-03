import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';

// MiDaS Small: Eingabe 256x256 RGB float32, Ausgabe 256x256 float32 Tiefenwerte
const MODEL_INPUT_SIZE = 256;

let model: TensorflowModel | null = null;

async function getModel(): Promise<TensorflowModel> {
  if (model) return model;
  // Das Modell liegt im assets-Ordner und wird durch expo-asset gebündelt
  model = await loadTensorflowModel(require('../assets/models/midas_small.tflite'));
  return model;
}

export interface DepthMap {
  data: Float32Array;
  width: number;
  height: number;
}

export async function estimateDepth(
  frameUri: string,
  imageWidth: number,
  imageHeight: number
): Promise<DepthMap> {
  const tflite = await getModel();

  // JPEG → base64 → Uint8Array
  const base64 = await FileSystem.readAsStringAsync(frameUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // Bild auf 256x256 skalieren + normalisieren → Float32Array
  const input = await decodeAndResizeToFloat32(bytes, imageWidth, imageHeight);

  const output = await tflite.run([input]);
  const rawDepth = output[0] as Float32Array;

  // Tiefenwerte normalisieren auf [0, 1]
  const normalized = normalizeDepth(rawDepth);

  return { data: normalized, width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE };
}

function normalizeDepth(raw: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] < min) min = raw[i];
    if (raw[i] > max) max = raw[i];
  }
  const range = max - min || 1;
  const out = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = (raw[i] - min) / range;
  }
  return out;
}

// Dekodiert JPEG-Bytes und skaliert bilinear auf 256x256, gibt Float32Array zurück.
// Da wir kein natives Image-Decoding haben, nutzen wir eine vereinfachte
// Nearest-Neighbor-Interpolation auf den JPEG-Rohdaten über Canvas (in RN via expo-gl).
// Für den ersten Build: Dummy-Implementierung, die durch echte ersetzt wird.
async function decodeAndResizeToFloat32(
  jpegBytes: Uint8Array,
  srcWidth: number,
  srcHeight: number
): Promise<Float32Array> {
  // Platzhalter: gibt zufällige Tiefe zurück bis die echte Dekodierung eingebunden ist.
  // In Schritt 4 wird dies durch ImageDecoder via expo-gl ersetzt.
  const size = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3;
  return new Float32Array(size).fill(0.5);
}
