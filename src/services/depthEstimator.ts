import * as tf from '@tensorflow/tfjs';

const SIZE = 256;
let model: tf.GraphModel | null = null;

// MiDaS Small via TensorFlow.js (WebGL-beschleunigt im Browser)
const MODEL_URL = 'https://tfhub.dev/intel/lite-model/midas/v2_1_small/1/lite/1';

async function getModel(): Promise<tf.GraphModel> {
  if (model) return model;
  model = await tf.loadGraphModel(MODEL_URL, { fromTFHub: true });
  return model;
}

export async function estimateDepth(imageData: ImageData): Promise<Float32Array> {
  try {
    const m = await getModel();
    const depth = tf.tidy(() => {
      const img = tf.browser.fromPixels(imageData)
        .toFloat()
        .div(255)
        .resizeBilinear([256, 256])
        .expandDims(0);
      const out = m.predict(img) as tf.Tensor;
      return out.squeeze();
    });
    const raw = await (depth as tf.Tensor).data() as Float32Array;
    tf.dispose(depth);
    return normalizeDepth(raw);
  } catch {
    // Fallback wenn Modell nicht lädt: Helligkeitsbasierte Schätzung
    return brightnessDepth(imageData);
  }
}

function normalizeDepth(raw: Float32Array): Float32Array {
  let min = Infinity, max = -Infinity;
  for (const v of raw) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min || 1;
  return raw.map(v => (v - min) / range) as Float32Array;
}

function brightnessDepth(img: ImageData): Float32Array {
  const out = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const r = img.data[i * 4] / 255;
    const g = img.data[i * 4 + 1] / 255;
    const b = img.data[i * 4 + 2] / 255;
    out[i] = 1 - (0.299 * r + 0.587 * g + 0.114 * b);
  }
  return out;
}
