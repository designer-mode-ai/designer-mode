declare module '@designer-mode/inspector-react' {
  import type { InspectorAdapter, ComponentInfo } from '@designer-mode/core';
  export class ReactInspectorAdapter implements InspectorAdapter {
    getComponentInfo(el: HTMLElement): ComponentInfo;
    onActivate(): void;
    onDeactivate(): void;
  }
  export function DesignerMode(props: Record<string, any>): any;
  export function useDesignerMode(): any;
  export function useDesignerModeOptional(): any;
  export function DesignerModeProvider(props: Record<string, any>): any;
}

declare module '@designer-mode/inspector-vue' {
  import type { InspectorAdapter, ComponentInfo } from '@designer-mode/core';
  export class VueInspectorAdapter implements InspectorAdapter {
    getComponentInfo(el: HTMLElement): ComponentInfo;
    onActivate(): void;
    onDeactivate(): void;
  }
  export const DesignerModePlugin: { install(app: any): void };
}

declare module '@designer-mode/inspector-vanilla' {
  import type { InspectorAdapter, ComponentInfo } from '@designer-mode/core';
  export class VanillaInspectorAdapter implements InspectorAdapter {
    getComponentInfo(el: HTMLElement): ComponentInfo;
    onActivate(): void;
    onDeactivate(): void;
  }
}

declare module '@designer-mode/inspector-angular' {
  import type { InspectorAdapter, ComponentInfo, DesignerModeOptions } from '@designer-mode/core';
  export class AngularInspectorAdapter implements InspectorAdapter {
    getComponentInfo(el: HTMLElement): ComponentInfo;
    onActivate(): void;
    onDeactivate(): void;
  }
  export function initDesignerMode(options?: DesignerModeOptions): void;
}

declare module '@designer-mode/inspector-svelte' {
  import type { InspectorAdapter, ComponentInfo, DesignerModeOptions } from '@designer-mode/core';
  export class SvelteInspectorAdapter implements InspectorAdapter {
    getComponentInfo(el: HTMLElement): ComponentInfo;
    onActivate(): void;
    onDeactivate(): void;
  }
  export function initDesignerMode(options?: DesignerModeOptions): void;
}
