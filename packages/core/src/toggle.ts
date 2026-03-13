export class ToggleController {
  private btn: HTMLButtonElement | null = null;
  private isActive = false;
  private onToggle: (() => void) | null = null;

  mount(container: Element) {
    this.btn = document.createElement('button');
    this.btn.className = 'dm-toggle';
    this.btn.setAttribute('data-designer-mode', 'toggle');
    Object.assign(this.btn.style, {
      position: 'fixed', bottom: '20px', right: '20px', width: '44px', height: '44px',
      borderRadius: '50%', border: 'none', background: '#2c2c2c', cursor: 'pointer',
      fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)', zIndex: '2147483644',
      transition: 'transform 0.15s, box-shadow 0.15s',
    });
    this.btn.textContent = '🎨';
    this.btn.title = 'Toggle Designer Mode (Ctrl+Shift+D)';
    this.btn.onmouseenter = () => { if (this.btn) { this.btn.style.transform = 'scale(1.1)'; this.btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)'; } };
    this.btn.onmouseleave = () => { if (this.btn) { this.btn.style.transform = ''; this.btn.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)'; } };
    this.btn.onclick = () => this.onToggle?.();
    container.appendChild(this.btn);
  }

  setActive(active: boolean) {
    this.isActive = active;
    if (this.btn) {
      this.btn.style.background = active ? '#037DD6' : '#2c2c2c';
      this.btn.style.outline = active ? '2px solid rgba(3,125,214,0.4)' : 'none';
    }
  }

  setOnToggle(cb: () => void) { this.onToggle = cb; }
  unmount() { this.btn?.remove(); }
}
