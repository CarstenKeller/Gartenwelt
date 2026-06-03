import { GardenViewer } from '../components/GardenViewer';
import { Controls }      from '../components/Controls';
import type { SceneData } from '../services/sceneBuilder';

export class ViewerScreen {
  private el      : HTMLElement;
  private viewer  : GardenViewer;
  private controls: Controls;
  private hudVisible = true;

  constructor(container: HTMLElement, scene: SceneData, onBack: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'screen viewer-screen';
    this.el.innerHTML = `
      <canvas id="three-canvas"></canvas>
      <div class="hud" id="hud">
        <button class="hud-btn" id="back-btn">✕</button>
        <div class="hud-info">${scene.meshes.length} Ansichten</div>
        <button class="hud-btn" id="mode-btn" title="Steuerung wechseln">🕹️</button>
      </div>
    `;
    container.appendChild(this.el);

    const canvas = this.el.querySelector('#three-canvas') as HTMLCanvasElement;
    this.controls = new Controls(this.el, () => {});
    this.viewer   = new GardenViewer(canvas, scene, () => this.controls.getState());

    this.el.querySelector('#back-btn')!.addEventListener('click', onBack);

    let mode: 'joystick' | 'gyro' = 'joystick';
    const modeBtn = this.el.querySelector('#mode-btn') as HTMLButtonElement;
    modeBtn.addEventListener('click', () => {
      mode = mode === 'joystick' ? 'gyro' : 'joystick';
      this.controls.setMode(mode);
      modeBtn.textContent = mode === 'joystick' ? '🕹️' : '📱';
    });

    canvas.addEventListener('click', () => {
      this.hudVisible = !this.hudVisible;
      (this.el.querySelector('#hud') as HTMLElement).style.opacity =
        this.hudVisible ? '1' : '0';
    });
  }

  destroy() { this.viewer.destroy(); this.controls.destroy(); this.el.remove(); }
}
