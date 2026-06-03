import type { Frame } from './frameExtractor';

// Pro Frame ein texturiertes Tiefenmesh.
// Jede "Karte" ist ein echtes Gartenfoto mit 3D-Tiefenverzerrung.

export interface DepthMesh {
  vertices: Float32Array;  // x,y,z pro Vertex
  uvs:      Float32Array;  // u,v pro Vertex
  indices:  Uint32Array;
  image:    ImageData;
  zPos:     number;        // Position der Karte im 3D-Raum
}

export interface SceneData {
  meshes: DepthMesh[];
}

// Auflösung des Meshes (Spalten × Zeilen)
const COLS = 48;
const ROWS = 27; // 16:9
const W = 2.8;   // Breite in Welteinheiten
const H = W * (9 / 16);
const MAX_DISP = 0.6; // Maximale Tiefenverschiebung in Metern
const Z_STEP   = 2.0; // Abstand zwischen Karten
const FRAME_EVERY = 5; // Jeden 5. Frame nehmen (~36 Karten bei 3min)

export function buildScene(frames: Frame[], depthMaps: Float32Array[]): SceneData {
  const meshes: DepthMesh[] = [];
  const vCount = (COLS + 1) * (ROWS + 1);

  for (let fi = 0; fi < frames.length; fi += FRAME_EVERY) {
    const depth = depthMaps[fi];
    const imgW  = frames[fi].imageData.width;
    const imgH  = frames[fi].imageData.height;

    const vertices = new Float32Array(vCount * 3);
    const uvs      = new Float32Array(vCount * 2);

    let vi = 0;
    for (let row = 0; row <= ROWS; row++) {
      for (let col = 0; col <= COLS; col++) {
        const u = col / COLS;
        const v = row / ROWS;

        // Tiefenwert bilinear sampeln
        const sx = Math.floor(u * (imgW  - 1));
        const sy = Math.floor(v * (imgH - 1));
        const d  = depth[sy * imgW + sx] ?? 0.5;

        vertices[vi * 3]     = (u - 0.5) * W;
        vertices[vi * 3 + 1] = (0.5 - v) * H;
        vertices[vi * 3 + 2] = -d * MAX_DISP; // Nah = nach vorne, Fern = zurück

        uvs[vi * 2]     = u;
        uvs[vi * 2 + 1] = 1 - v;
        vi++;
      }
    }

    // Indizes
    const faceCount = COLS * ROWS * 2;
    const indices   = new Uint32Array(faceCount * 3);
    let ii = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const a = row * (COLS + 1) + col;
        const b = a + 1;
        const c = a + (COLS + 1);
        const d2 = c + 1;
        indices[ii++] = a; indices[ii++] = c; indices[ii++] = b;
        indices[ii++] = b; indices[ii++] = c; indices[ii++] = d2;
      }
    }

    meshes.push({
      vertices,
      uvs,
      indices,
      image: frames[fi].imageData,
      zPos: -(meshes.length * Z_STEP),
    });
  }

  return { meshes };
}
