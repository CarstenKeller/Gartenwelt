import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { PointCloud } from '../services/pointCloudGenerator';
import type { JoystickOutput } from './JoystickControls';

interface Props {
  cloud: PointCloud;
  controlRef: React.MutableRefObject<JoystickOutput>;
}

const MOVE_SPEED = 0.05;
const LOOK_SPEED = 0.03;

export default function GardenViewer({ cloud, controlRef }: Props) {
  const animFrameRef = useRef<number>(0);

  function onContextCreate(gl: ExpoWebGLRenderingContext) {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0x0d1f0d);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d1f0d, 0.08);

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.01,
      50
    );
    camera.position.set(0, 0, 2);

    // Punktwolke aufbauen
    const geometry = new THREE.BufferGeometry();
    const stride = 6; // x,y,z,r,g,b
    const positions = new Float32Array(cloud.pointCount * 3);
    const colors = new Float32Array(cloud.pointCount * 3);

    for (let i = 0; i < cloud.pointCount; i++) {
      positions[i * 3]     = cloud.buffer[i * stride];
      positions[i * 3 + 1] = cloud.buffer[i * stride + 1];
      positions[i * 3 + 2] = cloud.buffer[i * stride + 2];
      colors[i * 3]        = cloud.buffer[i * stride + 3];
      colors[i * 3 + 1]    = cloud.buffer[i * stride + 4];
      colors[i * 3 + 2]    = cloud.buffer[i * stride + 5];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Ambiente Beleuchtung für zukünftige Mesh-Elemente
    scene.add(new THREE.AmbientLight(0x7ec87e, 0.3));

    const yaw = { value: 0 };
    const pitch = { value: 0 };

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);

      const ctrl = controlRef.current;

      // Kamera-Rotation
      yaw.value   -= ctrl.lookX * LOOK_SPEED;
      pitch.value -= ctrl.lookY * LOOK_SPEED;
      pitch.value  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch.value));

      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw.value;
      camera.rotation.x = pitch.value;

      // Bewegung relativ zur Blickrichtung
      const forward = new THREE.Vector3(0, 0, -1)
        .applyEuler(new THREE.Euler(0, yaw.value, 0));
      const right = new THREE.Vector3(1, 0, 0)
        .applyEuler(new THREE.Euler(0, yaw.value, 0));

      camera.position.addScaledVector(forward, -ctrl.moveZ * MOVE_SPEED);
      camera.position.addScaledVector(right, ctrl.moveX * MOVE_SPEED);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    }

    animate();
  }

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <GLView
      style={{ flex: 1 }}
      onContextCreate={onContextCreate}
    />
  );
}
