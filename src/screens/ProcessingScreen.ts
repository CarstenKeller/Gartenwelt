import { extractFrames } from '../services/frameExtractor';
import { estimateDepth }  from '../services/depthEstimator';
import { buildScene, type SceneData } from '../services/sceneBuilder';

type Phase = 'frames' | 'depth' | 'scene' | 'error';

export class ProcessingScreen {
  private el: HTMLElement;
  private cancelled = false;

  constructor(
    container: HTMLElement,
    file: File,
    onDone: (scene: SceneData) => void,
    onBack: () => void
  ) {
    this.el = document.createElement('div');
    this.el.className = 'screen processing-screen';
    this.el.innerHTML = `
      <h2>Verarbeitung</h2>
      <div class="file-label">${file.name}</div>
      <div class="steps">
        ${['Frames', 'Tiefe', 'Szene'].map((l, i) => `
          <div class="step">
            <div class="step-circle" id="step-${i}"><span>${i + 1}</span></div>
            <div class="step-label">${l}</div>
          </div>`).join('')}
      </div>
      <div class="progress-track"><div class="progress-fill" id="prog" style="width:0%"></div></div>
      <div class="phase-label" id="phase-label">Starte…</div>
      <div class="count-label" id="count-label"></div>
      <div class="error-box" id="error-box" style="display:none">
        <div class="error-title">Fehler</div>
        <div class="error-msg" id="error-msg"></div>
        <button class="back-btn">Zurück</button>
      </div>
    `;
    container.appendChild(this.el);
    this.el.querySelector('.back-btn')?.addEventListener('click', onBack);
    this.run(file, onDone, onBack);
  }

  private setPhase(phase: Phase, step: number) {
    this.el.querySelectorAll('.step-circle').forEach((el, i) => {
      el.className = 'step-circle' + (i < step ? ' done' : i === step ? ' active' : '');
    });
    const labels: Record<Phase, string> = {
      frames: 'Frames extrahieren…',
      depth:  'Tiefenschätzung…',
      scene:  '3D-Szene aufbauen…',
      error:  'Fehler',
    };
    (this.el.querySelector('#phase-label') as HTMLElement).textContent = labels[phase];
  }

  private setProgress(cur: number, total: number) {
    (this.el.querySelector('#prog') as HTMLElement).style.width =
      `${total > 0 ? (cur / total) * 100 : 0}%`;
    (this.el.querySelector('#count-label') as HTMLElement).textContent =
      total > 1 ? `${cur} / ${total}` : '';
  }

  private async run(file: File, onDone: (s: SceneData) => void, _onBack: () => void) {
    try {
      this.setPhase('frames', 0);
      const frames = await extractFrames(file, (c, t) => {
        if (this.cancelled) throw new Error('Abgebrochen');
        this.setProgress(c, t);
      });

      this.setPhase('depth', 1);
      this.setProgress(0, frames.length);
      const depths: Float32Array[] = [];
      for (let i = 0; i < frames.length; i++) {
        if (this.cancelled) throw new Error('Abgebrochen');
        depths.push(await estimateDepth(frames[i].imageData));
        this.setProgress(i + 1, frames.length);
      }

      this.setPhase('scene', 2);
      this.setProgress(0, 1);
      const scene = buildScene(frames, depths);
      this.setProgress(1, 1);

      onDone(scene);
    } catch (e) {
      if (this.cancelled) return;
      (this.el.querySelector('#error-msg') as HTMLElement).textContent =
        e instanceof Error ? e.message : String(e);
      (this.el.querySelector('#error-box') as HTMLElement).style.display = 'flex';
    }
  }

  destroy() { this.cancelled = true; this.el.remove(); }
}
