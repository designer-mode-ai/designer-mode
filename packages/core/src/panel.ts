import type { ComponentInfo, ChangesetEntry, RelayStatus } from './types.js';
import { getDirectTextContent } from './utils.js';

const C = {
  bg: '#2c2c2c', surface: '#383838', input: '#1e1e1e', inputFocus: '#0d99ff',
  text: '#ffffff', textSecondary: '#adadad', textTertiary: '#777777',
  accent: '#0d99ff', success: '#30d158', error: '#ff453a', divider: '#404040',
} as const;
const F = `Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
const M = `ui-monospace,SFMono-Regular,Menlo,monospace`;

function css(strings: TemplateStringsArray, ...vals: any[]) {
  return strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');
}

const PANEL_CSS = css`
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :host { all: initial; }
  .panel {
    position: fixed; right: 16px; top: 60px; width: 300px; max-height: calc(100vh - 80px);
    background: ${C.bg}; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    display: flex; flex-direction: column; font-family: ${F}; font-size: 12px;
    color: ${C.text}; z-index: 2147483645; overflow: hidden; user-select: none;
  }
  .header {
    display: flex; align-items: center; gap: 6px; padding: 8px 10px;
    border-bottom: 1px solid ${C.divider}; cursor: move; flex-shrink: 0;
  }
  .drag-handle { color: ${C.textTertiary}; font-size: 14px; cursor: grab; flex-shrink: 0; }
  .header-info { flex: 1; min-width: 0; }
  .component-name { font-weight: 600; font-size: 12px; color: ${C.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .file-path { font-size: 10px; color: ${C.textTertiary}; font-family: ${M}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
  .header-actions { display: flex; gap: 4px; flex-shrink: 0; }
  .icon-btn {
    background: none; border: none; color: ${C.textSecondary}; cursor: pointer;
    padding: 2px 4px; border-radius: 3px; font-size: 11px; line-height: 1;
  }
  .icon-btn:hover { background: ${C.surface}; color: ${C.text}; }
  .body { flex: 1; overflow-y: auto; min-height: 0; }
  .body::-webkit-scrollbar { width: 4px; }
  .body::-webkit-scrollbar-track { background: transparent; }
  .body::-webkit-scrollbar-thumb { background: ${C.divider}; border-radius: 2px; }
  .section { border-bottom: 1px solid ${C.divider}; }
  .section-header {
    display: flex; align-items: center; gap: 6px; padding: 7px 10px;
    background: none; border: none; width: 100%; color: ${C.textSecondary};
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    cursor: pointer; font-family: ${F};
  }
  .section-header:hover { background: ${C.surface}; }
  .chevron { font-size: 8px; transition: transform 0.15s; color: #666; }
  .chevron.open { transform: rotate(90deg); }
  .section-body { padding: 4px 10px 8px; }
  .prop-row { display: flex; align-items: flex-start; min-height: 24px; gap: 6px; margin: 1px 0; }
  .prop-label { font-size: 10px; color: ${C.textTertiary}; width: 88px; flex-shrink: 0; padding-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .prop-value { flex: 1; min-width: 0; }
  .editable {
    display: flex; align-items: center; gap: 4px; padding: 2px 5px; border-radius: 3px;
    cursor: pointer; font-size: 11px; font-family: ${M}; color: ${C.text};
    border: 1px solid transparent; min-height: 20px; word-break: break-all;
    transition: background 0.1s;
  }
  .editable:hover { background: #2a2a2a; border-color: ${C.divider}; }
  .editable input {
    width: 100%; background: ${C.input}; color: ${C.text}; border: 1px solid ${C.inputFocus};
    border-radius: 3px; padding: 2px 5px; font-size: 11px; font-family: ${M}; outline: none;
  }
  .color-swatch { width: 12px; height: 12px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; cursor: pointer; }
  .readonly { font-size: 11px; font-family: ${M}; color: ${C.text}; padding: 2px 5px; word-break: break-all; }
  .text-input {
    width: 100%; background: ${C.input}; color: ${C.text}; border: 1px solid ${C.divider};
    border-radius: 3px; padding: 4px 6px; font-size: 11px; font-family: ${F};
    outline: none; resize: vertical; min-height: 40px;
  }
  .text-input:focus { border-color: ${C.inputFocus}; }
  .pill-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .pill {
    display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px;
    background: ${C.surface}; border-radius: 10px; font-size: 10px; font-family: ${M};
    color: ${C.textSecondary}; max-width: 100%; overflow: hidden;
  }
  .pill-x { color: ${C.textTertiary}; cursor: pointer; padding: 0 1px; font-size: 10px; }
  .pill-x:hover { color: ${C.error}; }
  .add-btn { font-size: 10px; color: ${C.accent}; background: none; border: none; cursor: pointer; padding: 2px 4px; }
  .add-input { font-size: 10px; font-family: ${M}; background: ${C.input}; color: ${C.text}; border: 1px solid ${C.inputFocus}; border-radius: 3px; padding: 2px 5px; outline: none; width: 100%; margin-top: 4px; }
  .spacing-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto auto; gap: 2px; align-items: center; justify-items: center; }
  .footer { flex-shrink: 0; border-top: 1px solid ${C.divider}; }
  .status-bar { display: flex; align-items: center; gap: 5px; padding: 5px 10px; font-size: 10px; color: ${C.textSecondary}; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: ${C.textTertiary}; flex-shrink: 0; }
  .status-dot.connected { background: ${C.success}; }
  .status-dot.disconnected { background: ${C.error}; }
  .edits-banner { display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: rgba(13,153,255,0.12); font-size: 10px; color: ${C.accent}; }
  .apply-btn { background: ${C.accent}; color: #fff; border: none; border-radius: 3px; padding: 2px 8px; font-size: 10px; cursor: pointer; }
  .chat-area { padding: 6px 10px; display: flex; flex-direction: column; gap: 5px; }
  .response-bubble { background: ${C.surface}; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: ${C.textSecondary}; line-height: 1.4; }
  .response-label { font-size: 9px; font-weight: 600; color: ${C.textTertiary}; text-transform: uppercase; margin-bottom: 2px; }
  .chat-input-row { display: flex; gap: 5px; align-items: flex-end; }
  .chat-input {
    flex: 1; background: ${C.input}; color: ${C.text}; border: 1px solid ${C.divider};
    border-radius: 6px; padding: 6px 8px; font-size: 11px; font-family: ${F};
    outline: none; resize: none; min-height: 32px; max-height: 80px;
  }
  .chat-input:focus { border-color: ${C.inputFocus}; }
  .send-btn {
    background: ${C.accent}; color: #fff; border: none; border-radius: 6px;
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; flex-shrink: 0;
  }
  .send-btn:disabled { opacity: 0.4; cursor: default; }
  .copy-btn { font-size: 9px; background: ${C.surface}; color: ${C.textSecondary}; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; }
  .copy-btn:hover { color: ${C.text}; }
  .minimized .body, .minimized .footer { display: none; }
`;

type EditState = {
  original: string;
  current: string;
};

export class PanelController {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private relay: any;
  private options: any;
  private info: ComponentInfo | null = null;
  private originalSnapshot: Record<string, string> = {};
  private editLog: Map<string, EditState> = new Map();
  private agentResponse: string | null = null;
  private relayStatus: RelayStatus = 'checking';
  private isMinimized = false;
  private isVisible = false;
  private pos = { x: 0, y: 60 };

  constructor(relay: any, options: any) {
    this.relay = relay;
    this.options = options;
  }

  mount(container: Element) {
    this.host = document.createElement('div');
    this.host.className = 'dm-panel';
    this.host.setAttribute('data-designer-mode', 'panel');
    this.shadow = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    this.shadow.appendChild(style);

    this.pos = { x: window.innerWidth - 316, y: 60 };
    this.render();
    container.appendChild(this.host);

    this.relay.onResponse((r: string) => {
      this.agentResponse = r;
      this.render();
    });

    // Health check
    this.checkHealth();
    setInterval(() => this.checkHealth(), 10000);
  }

  show(info: ComponentInfo, el: HTMLElement) {
    this.info = info;
    // Snapshot styles at selection time
    const snap: Record<string, string> = {};
    for (const group of Object.values(info.computedStyles)) {
      for (const [k, v] of Object.entries(group as Record<string, string>)) snap[k] = v;
    }
    if (info.textContent) snap['__textContent'] = info.textContent;
    this.originalSnapshot = snap;
    this.editLog.clear();
    this.agentResponse = null;
    this.isVisible = true;
    this.render();
  }

  hide() {
    this.info = null;
    this.isVisible = false;
    this.editLog.clear();
    this.render();
  }

  applyEdit(property: string, newValue: string, el: HTMLElement) {
    const original = this.originalSnapshot[property] ?? '';
    if (newValue === original) {
      this.editLog.delete(property);
    } else {
      const existing = this.editLog.get(property);
      this.editLog.set(property, { original: existing?.original ?? original, current: newValue });
    }
    // Apply to DOM
    if (!property.startsWith('__')) {
      const camel = property.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      (el.style as any)[camel] = newValue;
    }
    this.render();
  }

  private getChangeset(): ChangesetEntry[] {
    return Array.from(this.editLog.entries()).map(([property, { original, current }]) => ({ property, original, current }));
  }

  private async checkHealth() {
    this.relayStatus = 'checking';
    this.relayStatus = await this.relay.checkHealth();
    this.render();
  }

  private async sendToAgent(message: string) {
    if (!this.info) return;
    const { formatAgentPrompt } = await import('./prompt.js');
    const prompt = formatAgentPrompt(this.info, this.getChangeset(), message);
    await this.relay.sendMessage(prompt);
    this.agentResponse = null;
    this.render();
  }

  unmount() {
    this.host?.remove();
  }

  private render() {
    if (!this.shadow) return;
    // Remove old panel div if present
    const old = this.shadow.querySelector('.panel');
    if (old) old.remove();

    if (!this.isVisible) return;

    const panel = document.createElement('div');
    panel.className = `panel${this.isMinimized ? ' minimized' : ''}`;
    panel.style.cssText = `left:${this.pos.x}px;top:${this.pos.y}px;`;

    panel.appendChild(this.renderHeader());
    if (!this.isMinimized) {
      panel.appendChild(this.renderBody());
      panel.appendChild(this.renderFooter());
    }

    this.shadow.appendChild(panel);
    this.setupDrag(panel);
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'header';

    const drag = document.createElement('span');
    drag.className = 'drag-handle';
    drag.textContent = '⠿';

    const info = document.createElement('div');
    info.className = 'header-info';

    const name = document.createElement('div');
    name.className = 'component-name';
    name.textContent = this.info?.componentName ?? '—';

    const path = document.createElement('div');
    path.className = 'file-path';
    path.textContent = this.info?.filePath
      ? `${this.info.filePath.split('/').slice(-2).join('/')}${this.info.lineNumber ? `:${this.info.lineNumber}` : ''}`
      : (this.info?.testId ?? '');

    info.appendChild(name);
    info.appendChild(path);

    const actions = document.createElement('div');
    actions.className = 'header-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy for AI';
    copyBtn.onclick = () => {
      if (!this.info) return;
      import('./prompt.js').then(({ formatForClipboard: f }) => {
        navigator.clipboard.writeText(f(this.info!, this.getChangeset())).catch(() => {});
      });
    };

    const minBtn = document.createElement('button');
    minBtn.className = 'icon-btn';
    minBtn.textContent = this.isMinimized ? '▢' : '▁';
    minBtn.onclick = () => { this.isMinimized = !this.isMinimized; this.render(); };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'icon-btn';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => { this.options.onClose?.(); };

    actions.appendChild(copyBtn);
    actions.appendChild(minBtn);
    actions.appendChild(closeBtn);

    header.appendChild(drag);
    header.appendChild(info);
    header.appendChild(actions);
    return header;
  }

  private renderBody(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'body';

    // Text content section
    if (this.info?.textContent !== null && this.info?.textContent !== undefined) {
      body.appendChild(this.renderTextSection());
    }

    // Style sections
    const sections: [string, Record<string, string>][] = [
      ['Layout', this.info?.computedStyles.layout ?? {}],
      ['Typography', this.info?.computedStyles.typography ?? {}],
      ['Spacing', this.info?.computedStyles.spacing ?? {}],
      ['Borders', this.info?.computedStyles.border ?? {}],
      ['Effects', this.info?.computedStyles.effects ?? {}],
    ];

    for (const [title, styles] of sections) {
      const entries = Object.entries(styles).filter(([, v]) => v);
      if (entries.length) body.appendChild(this.renderStyleSection(title, entries));
    }

    // Component section (read-only)
    if (this.info) body.appendChild(this.renderComponentSection());

    // Classes section
    if (this.info?.classes.length) body.appendChild(this.renderClassesSection());

    return body;
  }

  private renderTextSection(): HTMLElement {
    return this.renderSection('Text Content', '✏', true, (body) => {
      const ta = document.createElement('textarea');
      ta.className = 'text-input';
      ta.value = this.info?.textContent ?? '';
      ta.rows = 2;
      body.appendChild(ta);
    });
  }

  private renderStyleSection(title: string, entries: [string, string][]): HTMLElement {
    return this.renderSection(title, '', true, (body) => {
      for (const [prop, val] of entries) {
        const row = document.createElement('div');
        row.className = 'prop-row';

        const label = document.createElement('span');
        label.className = 'prop-label';
        label.textContent = prop;
        label.title = prop;

        const valueWrap = document.createElement('div');
        valueWrap.className = 'prop-value';

        const currentVal = this.editLog.get(prop)?.current ?? val;
        const isColor = prop.includes('color') || prop === 'background';
        valueWrap.appendChild(this.makeEditableValue(prop, currentVal, isColor));

        row.appendChild(label);
        row.appendChild(valueWrap);
        body.appendChild(row);
      }
    });
  }

  private makeEditableValue(prop: string, value: string, isColor = false): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'editable';

    if (isColor && value && value !== 'rgba(0, 0, 0, 0)') {
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.background = value;
      wrap.appendChild(swatch);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = value || '—';
    wrap.appendChild(textSpan);

    wrap.onclick = () => {
      const input = document.createElement('input');
      input.value = value;
      input.className = 'editable';
      Object.assign(input.style, { fontFamily: M, fontSize: '11px' });
      wrap.replaceWith(input);
      input.focus();
      input.select();

      const original = value;
      const isNumeric = /^-?\d*\.?\d+(px|em|rem|%|vh|vw|pt)?$/u.test(value.trim());

      input.onkeydown = (e) => {
        if (e.key === 'Enter') { input.blur(); }
        else if (e.key === 'Escape') { input.value = original; input.blur(); }
        else if (isNumeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          const delta = e.key === 'ArrowUp' ? (e.shiftKey ? 10 : 1) : (e.shiftKey ? -10 : -1);
          const m = input.value.match(/^(-?\d*\.?\d+)(.*)/u);
          if (m) input.value = `${parseFloat(m[1]) + delta}${m[2]}`;
        }
      };
      input.onblur = () => {
        const newWrap = this.makeEditableValue(prop, input.value, isColor);
        input.replaceWith(newWrap);
        // TODO: notify core of edit
      };
    };

    return wrap;
  }

  private renderComponentSection(): HTMLElement {
    return this.renderSection('Component', '🧩', false, (body) => {
      const fields: [string, string][] = [
        ['component', this.info!.componentName],
        ['test-id', this.info!.testId ?? '—'],
        ['file', this.info!.filePath ? `${this.info!.filePath.split('/').slice(-1)[0]}${this.info!.lineNumber ? `:${this.info!.lineNumber}` : ''}` : '—'],
      ];
      for (const [label, val] of fields) {
        const row = document.createElement('div');
        row.className = 'prop-row';
        const l = document.createElement('span'); l.className = 'prop-label'; l.textContent = label;
        const v = document.createElement('span'); v.className = 'readonly'; v.textContent = val;
        row.appendChild(l); row.appendChild(v);
        body.appendChild(row);
      }
      if (this.info!.props && Object.keys(this.info!.props).length > 0) {
        const propsEl = document.createElement('div');
        propsEl.style.cssText = `font-size:10px;font-family:${M};color:${C.textTertiary};margin-top:4px;word-break:break-all;`;
        propsEl.textContent = JSON.stringify(this.info!.props, null, 1).slice(0, 200);
        body.appendChild(propsEl);
      }
    });
  }

  private renderClassesSection(): HTMLElement {
    return this.renderSection('Classes', '🏷', false, (body) => {
      const list = document.createElement('div');
      list.className = 'pill-list';
      for (const cls of this.info!.classes) {
        const pill = document.createElement('span');
        pill.className = 'pill';
        const t = document.createElement('span'); t.textContent = cls; t.style.overflow = 'hidden'; t.style.textOverflow = 'ellipsis'; t.style.whiteSpace = 'nowrap';
        pill.appendChild(t);
        list.appendChild(pill);
      }
      body.appendChild(list);
    });
  }

  private renderSection(title: string, icon: string, defaultOpen: boolean, content: (body: HTMLElement) => void): HTMLElement {
    const section = document.createElement('div');
    section.className = 'section';

    const header = document.createElement('button');
    header.className = 'section-header';

    const chevron = document.createElement('span');
    chevron.className = `chevron${defaultOpen ? ' open' : ''}`;
    chevron.textContent = '▶';

    const label = document.createElement('span');
    label.textContent = `${icon ? icon + ' ' : ''}${title}`;

    header.appendChild(chevron);
    header.appendChild(label);

    const body = document.createElement('div');
    body.className = 'section-body';
    body.style.display = defaultOpen ? 'block' : 'none';
    content(body);

    header.onclick = () => {
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      chevron.className = `chevron${open ? '' : ' open'}`;
    };

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  private renderFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'footer';

    // Edits banner
    if (this.editLog.size > 0) {
      const banner = document.createElement('div');
      banner.className = 'edits-banner';
      const txt = document.createElement('span');
      txt.textContent = `⚠ ${this.editLog.size} unsent edit${this.editLog.size > 1 ? 's' : ''}`;
      const applyBtn = document.createElement('button');
      applyBtn.className = 'apply-btn';
      applyBtn.textContent = 'Apply';
      applyBtn.onclick = () => this.sendToAgent('');
      banner.appendChild(txt);
      banner.appendChild(applyBtn);
      footer.appendChild(banner);
    }

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    const dot = document.createElement('span');
    dot.className = `status-dot ${this.relayStatus}`;
    const statusText = document.createElement('span');
    statusText.textContent = this.relayStatus === 'connected' ? 'Connected' : this.relayStatus === 'disconnected' ? 'Not connected — run: npx designer-mode-server' : 'Connecting...';
    statusBar.appendChild(dot);
    statusBar.appendChild(statusText);
    footer.appendChild(statusBar);

    // Chat
    const chat = document.createElement('div');
    chat.className = 'chat-area';

    if (this.agentResponse) {
      const bubble = document.createElement('div');
      bubble.className = 'response-bubble';
      const lbl = document.createElement('div'); lbl.className = 'response-label'; lbl.textContent = 'Agent';
      const msg = document.createElement('div'); msg.textContent = this.agentResponse;
      bubble.appendChild(lbl); bubble.appendChild(msg);
      chat.appendChild(bubble);
    }

    const inputRow = document.createElement('div');
    inputRow.className = 'chat-input-row';

    const input = document.createElement('textarea');
    input.className = 'chat-input';
    input.placeholder = 'Describe the change...';
    input.rows = 1;
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.textContent = '↑';
    sendBtn.disabled = this.relayStatus !== 'connected';

    const send = () => {
      const msg = input.value.trim();
      if (!msg && this.editLog.size === 0) return;
      this.sendToAgent(msg);
      input.value = '';
    };

    sendBtn.onclick = send;
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    chat.appendChild(inputRow);
    footer.appendChild(chat);

    return footer;
  }

  private setupDrag(panel: HTMLElement) {
    const header = panel.querySelector('.header') as HTMLElement;
    if (!header) return;
    let dragging = false;
    let ox = 0, oy = 0;
    header.onmousedown = (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      dragging = true;
      ox = e.clientX - this.pos.x;
      oy = e.clientY - this.pos.y;
      e.preventDefault();
    };
    document.onmousemove = (e) => {
      if (!dragging) return;
      this.pos = { x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - ox)), y: Math.max(0, e.clientY - oy) };
      panel.style.left = `${this.pos.x}px`;
      panel.style.top = `${this.pos.y}px`;
    };
    document.onmouseup = () => { dragging = false; };
  }
}
