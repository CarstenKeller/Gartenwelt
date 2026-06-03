import { GardenViewer } from '../components/GardenViewer';
import { Controls } from '../components/Controls';
import type { PointCloud } from '../services/pointCloudGenerator';

export class ViewerScreen {
  private el: HTMLElement;
  private viewer: GardenViewer;
  private controls: Controls;
  private hudVisible = true;

  constructor(container: HTMLElement, cloud: PointCloud, onBack: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'screen viewer-screen';
    this.el.innerHTML = `
      <canvas id="three-canvas"></canvas>
      <div class="hud" id="hud">
        <button class="hud-btn" id="back-btn">✕</button>
        <div class="hud-info">${cloud.count.toLocaleString('de')} Punkte</div>
        <button class="hud-btn" id="mode-btn">🕹️</button>
      </div>
    `;
    container.appendChild(this.el);

    const canvas = this.el.querySelector('#three-canvas') as HTMLCanvasElement;
    this.controls = new Controls(this.el, () => {});
    this.viewer   = new GardenViewer(canvas, cloud, () => this.controls.getState());

    this.el.querySelector('#back-btn')!.addEventListener('click', onBack);

    let mode: 'joystick' | 'gyro' = 'joystick';
    const modeBtn = this.el.querySelector('#mode-btn') as HTMLButtonElement;
    modeBtn.addEventListener('click', () => {
      mode = mode === 'joystick' ? 'gyro' : 'joystick';
      this.controls.setMode(mode);
      modeBtn.textContent = mode === 'joystick' ? '🕹️' : '📱';
    });

    // HUD ein/ausblenden beim Tippen auf Canvas
    canvas.addEventListener('click', () => {
      this.hudVisible = !this.hudVisible;
      (this.el.querySelector('#hud') as HTMLElement).style.opacity =
        this.hudVisible ? '1' : '0';
    });
  }

  destroy() {
    this.viewer.destroy();
    this.controls.destroy();
    this.el.remove();
  }
}
