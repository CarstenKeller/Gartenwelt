import { GardenViewer } from '../components/GardenViewer';
import { Controls }      from '../components/Controls';

export class ViewerScreen {
  private el      : HTMLElement;
  private viewer  : GardenViewer | null = null;
  private controls: Controls;
  private hudVisible = true;

  constructor(container: HTMLElement, file: File, onBack: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'screen viewer-screen';
    this.el.innerHTML = `
      <canvas id="three-canvas"></canvas>

      <!-- Lade-Overlay -->
      <div id="load-overlay" style="position:absolute;inset:0;display:flex;flex-direction:column;
           align-items:center;justify-content:center;gap:16px;background:#0d1f0d">
        <span style="font-size:1.2rem;color:#7ec87e">Lade Garten…</span>
        <div style="font-size:.8rem;color:#5a7a5a;max-width:80%;text-align:center;
             white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${file.name}</div>
        <div class="progress-track" style="width:260px">
          <div class="progress-fill" id="prog" style="width:0%"></div>
        </div>
      </div>

      <!-- HUD (anfangs versteckt) -->
      <div class="hud" id="hud" style="display:none">
        <button class="hud-btn" id="back-btn">✕</button>
        <div class="hud-center">
          <div class="hud-title">🌿 ${file.name.replace(/\.\w+$/, '')}</div>
          <div class="hud-hint">Tap zum Ein-/Ausblenden des HUD</div>
        </div>
        <button class="hud-btn" id="mode-btn">🕹️</button>
      </div>
    `;
    container.appendChild(this.el);

    const canvas = this.el.querySelector('#three-canvas') as HTMLCanvasElement;
    const ctrl   = { moveX: 0, moveZ: 0, lookX: 0, lookY: 0 };
    this.controls = new Controls(this.el, () => {});

    this.viewer = new GardenViewer(canvas, () => this.controls.getState());

    this.viewer.loadGLB(file, (pct) => {
      (this.el.querySelector('#prog') as HTMLElement).style.width = `${pct * 100}%`;
    }).then(() => {
      (this.el.querySelector('#load-overlay') as HTMLElement).style.display = 'none';
      (this.el.querySelector('#hud') as HTMLElement).style.display = 'flex';
    }).catch((err) => {
      alert('Fehler: ' + (err instanceof Error ? err.message : String(err)));
      onBack();
    });

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
      const hud = this.el.querySelector('#hud') as HTMLElement;
      hud.style.opacity = this.hudVisible ? '1' : '0';
    });
  }

  destroy() {
    this.viewer?.destroy();
    this.controls.destroy();
    this.el.remove();
  }
}
