export interface RNComponentInfo {
  componentName: string;
  /** Parent user component (e.g. "Card" when tapping a Text inside Card) */
  parentComponent: string | null;
  /** Text content of the tapped element (e.g. "Heading 2") */
  textContent: string | null;
  filePath: string | null;
  lineNumber: number | null;
  props: Record<string, unknown> | null;
  testID: string | null;
  // Layout as measured by UIManager
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    pageX: number;
    pageY: number;
  } | null;
  // Resolved styles from StyleSheet
  style: Record<string, unknown> | null;
}

export interface DesignerModeRNOptions {
  /** URL of the relay server, e.g. http://192.168.1.100:3334 */
  relayUrl: string;
  /** How often to poll for agent response, ms. Default: 2000 */
  pollInterval?: number;
}

export interface ChangesetEntry {
  property: string;
  original: string;
  current: string;
}
