import type { InspectorAdapter, ComponentInfo } from './types.js';

const IGNORED_SELECTORS = ['[data-designer-mode]', '.dm-overlay', '.dm-panel', '.dm-highlight', '.dm-toggle'];

export class OverlayController {
  private adapter: InspectorAdapter;
  private isActive = false;
  private isLocked = false;
  private hoveredEl: HTMLElement | null = null;
  private selectedEl: HTMLElement | null = null;
  private highlight: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private onSelect: ((info: ComponentInfo, el: HTMLElement) => void) | null = null;
  private onHover: ((info: ComponentInfo | null) => void) | null = null;

  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(adapter: InspectorAdapter) {
    this.adapter = adapter;
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  mount(container: HTMLElement) {
    this.highlight = document.createElement('div');
    this.highlight.className = 'dm-highlight';
    Object.assign(this.highlight.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483640',
      border: '2px dashed #037DD6', borderRadius: '2px',
      display: 'none', boxSizing: 'border-box',
    });

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'dm-tooltip';
    Object.assign(this.tooltip.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483641',
      background: '#037DD6', color: '#fff', fontSize: '11px', fontFamily: 'monospace',
      padding: '2px 6px', borderRadius: '3px', display: 'none', whiteSpace: 'nowrap',
    });

    container.appendChild(this.highlight);
    container.appendChild(this.tooltip);
  }

  activate() {
    this.isActive = true;
    this.adapter.onActivate();
    document.addEventListener('mousemove', this.boundMouseMove, true);
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('keydown', this.boundKeyDown, true);
  }

  deactivate() {
    this.isActive = false;
    this.isLocked = false;
    this.adapter.onDeactivate();
    document.removeEventListener('mousemove', this.boundMouseMove, true);
    document.removeEventListener('click', this.boundClick, true);
    document.removeEventListener('keydown', this.boundKeyDown, true);
    if (this.highlight) this.highlight.style.display = 'none';
    if (this.tooltip) this.tooltip.style.display = 'none';
  }

  setOnSelect(cb: (info: ComponentInfo, el: HTMLElement) => void) { this.onSelect = cb; }
  setOnHover(cb: (info: ComponentInfo | null) => void) { this.onHover = cb; }

  private shouldIgnore(el: HTMLElement): boolean {
    return IGNORED_SELECTORS.some(s => el.closest(s) !== null);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isActive || this.isLocked) return;
    const el = e.target as HTMLElement;
    if (this.shouldIgnore(el)) return;
    this.hoveredEl = el;
    this.showHighlight(el, false);
    const info = this.adapter.getComponentInfo(el);
    this.onHover?.(info);
    if (this.tooltip && info) {
      this.tooltip.textContent = `${info.componentName}${info.testId ? ` [${info.testId}]` : ''}`;
      this.tooltip.style.display = 'block';
      this.tooltip.style.top = `${e.clientY - 28}px`;
      this.tooltip.style.left = `${e.clientX}px`;
    }
  }

  private handleClick(e: MouseEvent) {
    if (!this.isActive) return;
    const el = e.target as HTMLElement;
    if (this.shouldIgnore(el)) return;
    e.preventDefault();
    e.stopPropagation();
    if (this.isLocked && this.selectedEl === el) {
      this.unlock();
    } else {
      this.isLocked = true;
      this.selectedEl = el;
      this.showHighlight(el, true);
      if (this.tooltip) this.tooltip.style.display = 'none';
      const info = this.adapter.getComponentInfo(el);
      if (info) this.onSelect?.(info, el);
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { this.unlock(); }
    if (e.key === 'c' || e.key === 'C') {
      const el = this.selectedEl || this.hoveredEl;
      if (el) {
        const info = this.adapter.getComponentInfo(el);
        if (info) navigator.clipboard.writeText(JSON.stringify(info, null, 2)).catch(() => {});
      }
    }
  }

  unlock() {
    this.isLocked = false;
    this.selectedEl = null;
    if (this.highlight) this.highlight.style.display = 'none';
    if (this.tooltip) this.tooltip.style.display = 'none';
    this.onSelect?.(null as any, null as any);
  }

  private showHighlight(el: HTMLElement, locked: boolean) {
    if (!this.highlight) return;
    const rect = el.getBoundingClientRect();
    Object.assign(this.highlight.style, {
      display: 'block',
      top: `${rect.top - 2}px`,
      left: `${rect.left - 2}px`,
      width: `${rect.width + 4}px`,
      height: `${rect.height + 4}px`,
      border: `2px ${locked ? 'solid' : 'dashed'} #037DD6`,
    });
  }
}
