export class HomeScreen {
  private el: HTMLElement;
  private fileInput: HTMLInputElement;

  constructor(container: HTMLElement, onStart: (file: File) => void) {
    this.el = document.createElement('div');
    this.el.className = 'screen';
    this.el.innerHTML = `
      <div class="hero">
        <div class="icon">🌿</div>
        <h1>Gartenwelt</h1>
        <p>Verwandle dein Gartenvideo in ein begehbares 3D-Modell</p>
      </div>
      <div class="card" id="pick-card">
        <button class="pick-btn" id="pick-btn">
          <span class="pick-icon">📂</span>
          <span class="pick-label">Video auswählen</span>
          <span class="pick-hint">MP4-Format, 1–5 Minuten empfohlen</span>
        </button>
      </div>
      <button class="start-btn" id="start-btn" disabled>3D-Modell erstellen</button>
      <div class="info-box">
        ℹ️ Die Verarbeitung dauert bei 3 Minuten Video ca. 2–3 Minuten.
        Bildschirm dabei bitte aktiv lassen.
      </div>
    `;
    container.appendChild(this.el);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'video/mp4,video/*';

    let selectedFile: File | null = null;

    const pickBtn  = this.el.querySelector('#pick-btn')  as HTMLButtonElement;
    const startBtn = this.el.querySelector('#start-btn') as HTMLButtonElement;
    const card     = this.el.querySelector('#pick-card') as HTMLElement;

    pickBtn.onclick = () => this.fileInput.click();

    this.fileInput.onchange = () => {
      const f = this.fileInput.files?.[0];
      if (!f) return;
      selectedFile = f;
      const mb = (f.size / 1024 / 1024).toFixed(1);
      card.innerHTML = `
        <div class="video-info">
          <div class="video-name">${f.name}</div>
          <div class="video-size">${mb} MB</div>
          <button class="change-btn">Anderes Video wählen</button>
        </div>
      `;
      card.querySelector('.change-btn')!.addEventListener('click', () => this.fileInput.click());
      startBtn.disabled = false;
    };

    startBtn.onclick = () => { if (selectedFile) onStart(selectedFile); };
  }

  destroy() { this.el.remove(); }
}
