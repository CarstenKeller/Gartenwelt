export class HomeScreen {
  private el: HTMLElement;
  private fileInput: HTMLInputElement;

  constructor(container: HTMLElement, onOpen: (file: File) => void) {
    this.el = document.createElement('div');
    this.el.className = 'screen';
    this.el.innerHTML = `
      <div class="hero">
        <div class="icon">🌿</div>
        <h1>Gartenwelt</h1>
        <p>Begehbares 3D-Modell deines Gartens</p>
      </div>

      <div class="card">
        <h2>Schritt 1 – Garten mit Luma AI erfassen</h2>
        <div class="steps-list">
          <div class="step-row">
            <div class="step-num">1</div>
            <div class="step-text"><strong>Luma AI</strong> App installieren (kostenlos, iOS &amp; Android)</div>
          </div>
          <div class="step-row">
            <div class="step-num">2</div>
            <div class="step-text">Neues Capture starten – langsam durch den Garten gehen, viel Überlappung</div>
          </div>
          <div class="step-row">
            <div class="step-num">3</div>
            <div class="step-text">Verarbeitung abwarten (~5–15 Min. in der Cloud)</div>
          </div>
          <div class="step-row">
            <div class="step-num">4</div>
            <div class="step-text">Im Luma-Portal: <strong>Export → GLB</strong> herunterladen</div>
          </div>
          <div class="step-row">
            <div class="step-num">5</div>
            <div class="step-text">Datei auf dieses Gerät übertragen (Drive, Mail, …)</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Schritt 2 – Modell öffnen</h2>
        <button class="pick-btn" id="pick-btn">
          <span class="pick-icon">📁</span>
          <span class="pick-label">GLB-Datei auswählen</span>
          <span class="pick-hint">.glb · .gltf · von Luma AI, Polycam o.ä.</span>
        </button>
        <div id="file-ready" style="display:none" class="file-ready">
          <span class="file-icon">✅</span>
          <div class="file-info">
            <div class="file-name" id="fname"></div>
            <div class="file-size" id="fsize"></div>
          </div>
          <button class="file-change" id="file-change">ändern</button>
        </div>
      </div>

      <button class="open-btn" id="open-btn" disabled>3D-Garten betreten</button>
    `;
    container.appendChild(this.el);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.glb,.gltf';

    let chosen: File | null = null;

    const pickBtn   = this.el.querySelector('#pick-btn')   as HTMLButtonElement;
    const openBtn   = this.el.querySelector('#open-btn')   as HTMLButtonElement;
    const fileReady = this.el.querySelector('#file-ready') as HTMLElement;
    const changeBtn = this.el.querySelector('#file-change') as HTMLButtonElement;
    const fname     = this.el.querySelector('#fname')      as HTMLElement;
    const fsize     = this.el.querySelector('#fsize')      as HTMLElement;

    const pick = () => this.fileInput.click();
    pickBtn.addEventListener('click', pick);
    changeBtn.addEventListener('click', pick);

    this.fileInput.onchange = () => {
      const f = this.fileInput.files?.[0];
      if (!f) return;
      chosen = f;
      fname.textContent = f.name;
      fsize.textContent = (f.size / 1024 / 1024).toFixed(1) + ' MB';
      pickBtn.style.display  = 'none';
      fileReady.style.display = 'flex';
      openBtn.disabled = false;
    };

    openBtn.addEventListener('click', () => { if (chosen) onOpen(chosen); });
  }

  destroy() { this.el.remove(); }
}
