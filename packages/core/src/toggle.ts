export class ToggleController {
  private btn: HTMLButtonElement | null = null;
  private isActive = false;
  private onToggle: (() => void) | null = null;
  private label: HTMLSpanElement | null = null;

  mount(container: Element) {
    this.btn = document.createElement('button');
    this.btn.className = 'dm-toggle';
    this.btn.setAttribute('data-designer-mode', 'toggle');
    Object.assign(this.btn.style, {
      position: 'fixed', bottom: '20px', right: '20px', width: '44px', height: '44px',
      borderRadius: '22px', border: 'none', background: '#037DD6', cursor: 'pointer',
      fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(3, 125, 214, 0.4)', zIndex: '2147483644',
      transition: 'all 0.2s ease-out', overflow: 'hidden', gap: '8px',
      padding: '0', whiteSpace: 'nowrap',
    });

    const emoji = document.createElement('span');
    emoji.textContent = '🎨';
    emoji.style.flexShrink = '0';

    this.label = document.createElement('span');
    Object.assign(this.label.style, {
      fontSize: '13px', fontWeight: '600', color: '#fff',
      display: 'none', whiteSpace: 'nowrap',
    });
    this.label.textContent = 'Designer Mode';

    this.btn.appendChild(emoji);
    this.btn.appendChild(this.label);

    this.btn.title = 'Toggle Designer Mode (Ctrl+Shift+D)';
    this.btn.onmouseenter = () => {
      if (this.btn && this.label) {
        this.label.style.display = 'inline';
        this.btn.style.width = 'auto';
        this.btn.style.padding = '0 16px';
      }
    };
    this.btn.onmouseleave = () => {
      if (this.btn && this.label) {
        this.label.style.display = 'none';
        this.btn.style.width = '44px';
        this.btn.style.padding = '0';
      }
    };
    this.btn.onclick = () => this.onToggle?.();
    container.appendChild(this.btn);
  }

  setActive(active: boolean) {
    this.isActive = active;
    if (this.btn) {
      this.btn.style.display = active ? 'none' : 'flex';
    }
  }

  setOnToggle(cb: () => void) { this.onToggle = cb; }
  unmount() { this.btn?.remove(); }
}
