import type { CameraControl } from './GardenViewer';

type Mode = 'joystick' | 'gyro';

export class Controls {
  private el: HTMLElement;
  private state: CameraControl = { moveX: 0, moveZ: 0, lookX: 0, lookY: 0 };
  private mode: Mode = 'joystick';
  private sticks: [StickTracker, StickTracker];

  constructor(container: HTMLElement, private onToggle: (mode: Mode) => void) {
    this.el = document.createElement('div');
    this.el.className = 'joysticks';
    this.el.innerHTML = `
      <div class="joystick-base" id="stick-left"><div class="joystick-knob"></div></div>
      <div class="joystick-base" id="stick-right"><div class="joystick-knob"></div></div>
    `;
    container.appendChild(this.el);

    const left  = this.el.querySelector('#stick-left')  as HTMLElement;
    const right = this.el.querySelector('#stick-right') as HTMLElement;

    this.sticks = [
      new StickTracker(left,  (dx, dy) => { this.state.moveX = dx; this.state.moveZ = dy; }),
      new StickTracker(right, (dx, dy) => { this.state.lookX = dx; this.state.lookY = dy; }),
    ];
  }

  setMode(mode: Mode) {
    this.mode = mode;
    const show = mode === 'joystick';
    this.el.style.display = show ? 'flex' : 'none';
    if (mode === 'gyro') this.startGyro();
    else this.stopGyro();
  }

  getState(): CameraControl { return { ...this.state }; }

  private gyroHandler = (e: DeviceOrientationEvent) => {
    this.state.lookX = ((e.gamma ?? 0) / 45);
    this.state.lookY = ((e.beta  ?? 0) / 90);
  };

  private startGyro() {
    this.state.moveX = 0; this.state.moveZ = 0;
    window.addEventListener('deviceorientation', this.gyroHandler);
  }
  private stopGyro() {
    window.removeEventListener('deviceorientation', this.gyroHandler);
    this.state.lookX = 0; this.state.lookY = 0;
  }

  destroy() {
    this.sticks.forEach(s => s.destroy());
    this.stopGyro();
    this.el.remove();
  }
}

class StickTracker {
  private touchId: number | null = null;
  private originX = 0;
  private originY = 0;
  private readonly R = 60;

  constructor(private base: HTMLElement, private onDelta: (dx: number, dy: number) => void) {
    base.addEventListener('touchstart',  this.onStart, { passive: false });
    base.addEventListener('touchmove',   this.onMove,  { passive: false });
    base.addEventListener('touchend',    this.onEnd);
    base.addEventListener('touchcancel', this.onEnd);
  }

  private onStart = (e: TouchEvent) => {
    e.preventDefault();
    if (this.touchId !== null) return;
    const t = e.changedTouches[0];
    this.touchId = t.identifier;
    const r = this.base.getBoundingClientRect();
    this.originX = r.left + r.width  / 2;
    this.originY = r.top  + r.height / 2;
  };

  private onMove = (e: TouchEvent) => {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier !== this.touchId) continue;
      const dx = Math.max(-1, Math.min(1, (t.clientX - this.originX) / this.R));
      const dy = Math.max(-1, Math.min(1, (t.clientY - this.originY) / this.R));
      this.onDelta(dx, dy);
      const knob = this.base.querySelector('.joystick-knob') as HTMLElement;
      knob.style.transform = `translate(calc(-50% + ${dx * this.R}px), calc(-50% + ${dy * this.R}px))`;
    }
  };

  private onEnd = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier !== this.touchId) continue;
      this.touchId = null;
      this.onDelta(0, 0);
      const knob = this.base.querySelector('.joystick-knob') as HTMLElement;
      knob.style.transform = 'translate(-50%, -50%)';
    }
  };

  destroy() {
    this.base.removeEventListener('touchstart',  this.onStart);
    this.base.removeEventListener('touchmove',   this.onMove);
    this.base.removeEventListener('touchend',    this.onEnd);
    this.base.removeEventListener('touchcancel', this.onEnd);
  }
}
