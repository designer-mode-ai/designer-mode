export interface ComponentInfo {
  componentName: string;
  filePath: string | null;
  lineNumber: number | null;
  props: Record<string, string> | null;
  testId: string | null;
  classes: string[];
  computedStyles: ComputedStyleSnapshot;
  layoutRect: DOMRectReadOnly;
  textContent: string | null;
  domPath?: string;
}

export interface ComputedStyleSnapshot {
  layout: Record<string, string>;
  typography: Record<string, string>;
  color: Record<string, string>;
  spacing: Record<string, string>;
  border: Record<string, string>;
  effects: Record<string, string>;
}

export interface ChangesetEntry {
  property: string;
  original: string;
  current: string;
}

export interface DesignerModeOptions {
  relayUrl?: string;
  shortcut?: string;
  defaultActive?: boolean;
  panelPosition?: 'right' | 'left';
  persistState?: boolean;
  tokenPatterns?: TokenPattern[];
  onRequest?: (info: ComponentInfo, message: string) => void;
  onResponse?: (response: string) => void;
}

export interface TokenPattern {
  pattern: RegExp;
  category: string;
}

export interface InspectorAdapter {
  getComponentInfo(el: HTMLElement): ComponentInfo | null;
  onActivate(): void;
  onDeactivate(): void;
}

export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla';
export type RelayStatus = 'connected' | 'disconnected' | 'checking';
