import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export interface Control {
  moveX: number; moveZ: number;
  lookX: number; lookY: number;
}

const MOVE  = 0.07;
const LOOK  = 0.024;
const DRACO = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

export class GardenViewer {
  private renderer: THREE.WebGLRenderer;
  private scene   = new THREE.Scene();
  private camera  : THREE.PerspectiveCamera;
  private raf     = 0;
  private yaw     = 0;
  private pitch   = 0;

  // Keyboard state
  private keys = { w: false, a: false, s: false, d: false };

  constructor(
    canvas:  HTMLCanvasElement,
    private ctrl: () => Control
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.01, 1000);

    // Beleuchtung
    this.scene.add(new THREE.AmbientLight(0xffeedd, 1.2));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
    sun.position.set(10, 20, 10);
    this.scene.add(sun);
    this.scene.add(new THREE.HemisphereLight(0x87ceeb, 0x4a7c59, 0.6));

    this.resize();
    window.addEventListener('resize',   this.onResize);
    window.addEventListener('keydown',  this.onKeyDown);
    window.addEventListener('keyup',    this.onKeyUp);
    this.animate();
  }

  async loadGLB(file: File, onProgress: (pct: number) => void): Promise<void> {
    const url = URL.createObjectURL(file);
    try {
      const gltf = await this.loadGLTF(url, onProgress);
      const model = gltf.scene;
      this.scene.add(model);

      // Kamera automatisch auf das Modell ausrichten
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Spieler-Perspektive: auf Augenhöhe am Rand des Modells starten
      const startDist = Math.max(size.x, size.z) * 0.6;
      this.camera.position.set(
        center.x,
        box.min.y + size.y * 0.15, // ~Kniehöhe / Bodennähe
        center.z + startDist
      );
      this.camera.lookAt(center.x, center.y * 0.3, center.z);
      this.yaw   = 0;
      this.pitch = 0;

      // Nebel proportional zur Modellgröße
      const fogDist = Math.max(size.x, size.y, size.z) * 3;
      this.scene.fog = new THREE.Fog(0x87ceeb, fogDist * 0.5, fogDist * 1.5);
      this.scene.background = new THREE.Color(0x87ceeb);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private loadGLTF(url: string, onProgress: (pct: number) => void) {
    return new Promise<{ scene: THREE.Group }>((resolve, reject) => {
      const draco = new DRACOLoader();
      draco.setDecoderPath(DRACO);

      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);

      loader.load(
        url,
        (gltf) => resolve(gltf as unknown as { scene: THREE.Group }),
        (e) => { if (e.total) onProgress(e.loaded / e.total); },
        reject
      );
    });
  }

  private onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private resize() { this.onResize(); }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp')    this.keys.w = true;
    if (e.key === 's' || e.key === 'ArrowDown')  this.keys.s = true;
    if (e.key === 'a' || e.key === 'ArrowLeft')  this.keys.a = true;
    if (e.key === 'd' || e.key === 'ArrowRight') this.keys.d = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w' || e.key === 'ArrowUp')    this.keys.w = false;
    if (e.key === 's' || e.key === 'ArrowDown')  this.keys.s = false;
    if (e.key === 'a' || e.key === 'ArrowLeft')  this.keys.a = false;
    if (e.key === 'd' || e.key === 'ArrowRight') this.keys.d = false;
  };

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const c = this.ctrl();

    // Tastatur-Input
    const kx = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
    const kz = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);

    const mx = c.moveX + kx;
    const mz = c.moveZ + kz;

    // Rotation
    this.yaw    -= c.lookX * LOOK;
    this.pitch   = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45,
                    this.pitch - c.lookY * LOOK));

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Bewegung
    const fwd   = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    const right = new THREE.Vector3(1, 0,  0).applyEuler(new THREE.Euler(0, this.yaw, 0));
    this.camera.position.addScaledVector(fwd,   -mz * MOVE);
    this.camera.position.addScaledVector(right,  mx * MOVE);

    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize',  this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
    this.renderer.dispose();
  }
}
