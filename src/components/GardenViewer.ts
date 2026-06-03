import * as THREE from 'three';
import type { SceneData } from '../services/sceneBuilder';

export interface CameraControl {
  moveX: number; moveZ: number;
  lookX: number; lookY: number;
}

const MOVE_SPEED = 0.08;
const LOOK_SPEED = 0.022;

export class GardenViewer {
  private renderer: THREE.WebGLRenderer;
  private scene   = new THREE.Scene();
  private camera  : THREE.PerspectiveCamera;
  private raf     = 0;
  private yaw     = 0;
  private pitch   = 0;

  constructor(
    canvas:  HTMLCanvasElement,
    data:    SceneData,
    private ctrl: () => CameraControl
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0d1f0d);

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 300);

    // Kamera vor dem ersten Mesh, leicht zurückversetzt
    this.camera.position.set(0, 0, 2.5);

    this.scene.fog = new THREE.FogExp2(0x0d1f0d, 0.018);

    this.buildMeshes(data);
    this.resize();
    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private buildMeshes(data: SceneData) {
    for (const m of data.meshes) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(m.vertices, 3));
      geo.setAttribute('uv',       new THREE.Float32BufferAttribute(m.uvs, 2));
      geo.setIndex(new THREE.Uint32BufferAttribute(m.indices, 1));
      geo.computeVertexNormals();

      // ImageData → Canvas → Texture
      const c = document.createElement('canvas');
      c.width  = m.image.width;
      c.height = m.image.height;
      c.getContext('2d')!.putImageData(m.image, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;

      const mat  = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = m.zPos;
      this.scene.add(mesh);
    }
  }

  private onResize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private resize() { this.onResize(); }

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const c = this.ctrl();

    this.yaw    -= c.lookX * LOOK_SPEED;
    this.pitch   = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5,
                    this.pitch - c.lookY * LOOK_SPEED));

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    const fwd   = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    const right = new THREE.Vector3(1, 0,  0).applyEuler(new THREE.Euler(0, this.yaw, 0));

    this.camera.position.addScaledVector(fwd,   -c.moveZ * MOVE_SPEED);
    this.camera.position.addScaledVector(right,  c.moveX * MOVE_SPEED);

    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
