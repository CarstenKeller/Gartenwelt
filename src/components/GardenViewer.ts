import * as THREE from 'three';
import type { PointCloud } from '../services/pointCloudGenerator';

export interface CameraControl {
  moveX: number; moveZ: number;
  lookX: number; lookY: number;
}

const MOVE_SPEED = 0.06;
const LOOK_SPEED = 0.025;

export class GardenViewer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raf = 0;
  private yaw = 0;
  private pitch = 0;

  constructor(canvas: HTMLCanvasElement, cloud: PointCloud, private ctrl: () => CameraControl) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0d1f0d);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0d1f0d, 0.06);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.01, 60);
    this.camera.position.set(0, 0, 3);

    this.buildPointCloud(cloud);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  private buildPointCloud(cloud: PointCloud) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(cloud.positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cloud.colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.025, vertexColors: true, sizeAttenuation: true });
    this.scene.add(new THREE.Points(geo, mat));
  }

  private resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const c = this.ctrl();

    this.yaw   -= c.lookX * LOOK_SPEED;
    this.pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch - c.lookY * LOOK_SPEED));

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    const fwd   = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    const right = new THREE.Vector3(1, 0,  0).applyEuler(new THREE.Euler(0, this.yaw, 0));
    this.camera.position.addScaledVector(fwd, -c.moveZ * MOVE_SPEED);
    this.camera.position.addScaledVector(right, c.moveX * MOVE_SPEED);

    this.renderer.render(this.scene, this.camera);
  };

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }
}
