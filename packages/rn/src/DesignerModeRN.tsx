import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import type { RNComponentInfo, DesignerModeRNOptions, ChangesetEntry } from './types';
import { hitTestFromFiberTree } from './fiber';
import { buildAgentPrompt, sendToRelay, pollForResponse, checkRelayHealth } from './relay-client';

/* ── Design Tokens (matching web panel) ── */
const C = {
  bg: '#2c2c2c',
  surface: '#383838',
  surfaceHover: '#404040',
  input: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#adadad',
  textTertiary: '#777777',
  accent: '#0d99ff',
  accentDim: 'rgba(13, 153, 255, 0.15)',
  success: '#30d158',
  error: '#ff453a',
  divider: '#404040',
  chevron: '#888888',
  footerBg: '#1a1a1a',
};

interface Props extends DesignerModeRNOptions {
  active: boolean;
  onClose: () => void;
}

type RelayStatus = 'connected' | 'disconnected' | 'checking';
type ChatMessage = { type: 'sent' | 'agent'; text: string };

function shortenPath(filePath: string): string {
  const parts = filePath.split('/');
  return parts.slice(-2).join('/');
}

/* ── Collapsible Section ── */
function Section({ icon, title, defaultOpen = true, children }: {
  icon: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={s.section}>
      <Pressable onPress={() => setOpen(o => !o)} style={s.sectionHeader}>
        <Text style={s.sectionIcon}>{icon}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
        <Text style={[s.chevron, open && s.chevronOpen]}>{'\u25B8'}</Text>
      </Pressable>
      {open && <View style={s.sectionBody}>{children}</View>}
    </View>
  );
}

/* ── Property Row ── */
function PropRow({ label, value, mono = true, half = false }: { label: string; value: string; mono?: boolean; half?: boolean }) {
  return (
    <View style={[s.propRow, half && s.propRowHalf]}>
      <Text style={s.propLabel} numberOfLines={1}>{label}</Text>
      <Text style={[s.propValue, mono && s.mono]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/* ── Color Swatch ── */
function ColorSwatch({ color }: { color: string }) {
  return <View style={[s.colorSwatch, { backgroundColor: color }]} />;
}

/* ── Pulse Orb ── */
function PulseOrb() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[s.pulseOrb, { opacity: anim }]} />;
}

/* ── Style categorization helpers ── */
function categorizeStyles(style: Record<string, unknown>) {
  const layout: [string, string][] = [];
  const spacing: [string, string][] = [];
  const typography: [string, string][] = [];
  const fillStroke: [string, string][] = [];
  const other: [string, string][] = [];

  const layoutKeys = ['width', 'height', 'flex', 'flexDirection', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis',
    'alignItems', 'alignSelf', 'alignContent', 'justifyContent', 'position', 'top', 'right', 'bottom', 'left',
    'display', 'overflow', 'zIndex', 'gap', 'rowGap', 'columnGap', 'aspectRatio',
    'minWidth', 'maxWidth', 'minHeight', 'maxHeight'];
  const spacingKeys = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'marginHorizontal', 'marginVertical',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingHorizontal', 'paddingVertical'];
  const typoKeys = ['fontSize', 'fontWeight', 'fontFamily', 'fontStyle', 'lineHeight', 'letterSpacing',
    'textAlign', 'textTransform', 'textDecorationLine', 'textDecorationStyle', 'textShadowColor',
    'textShadowOffset', 'textShadowRadius', 'color'];
  const fillKeys = ['backgroundColor', 'opacity', 'borderWidth', 'borderColor', 'borderStyle', 'borderRadius',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
    'shadowColor', 'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation'];

  for (const [key, value] of Object.entries(style)) {
    const val = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (layoutKeys.includes(key)) layout.push([key, val]);
    else if (spacingKeys.includes(key)) spacing.push([key, val]);
    else if (typoKeys.includes(key)) typography.push([key, val]);
    else if (fillKeys.includes(key)) fillStroke.push([key, val]);
    else other.push([key, val]);
  }
  return { layout, spacing, typography, fillStroke, other };
}

function isColorValue(value: string): boolean {
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) return true;
  const named = ['red', 'blue', 'green', 'black', 'white', 'gray', 'grey', 'transparent',
    'orange', 'yellow', 'purple', 'pink', 'cyan', 'magenta'];
  return named.includes(value.toLowerCase());
}

/* ── Main Component ── */
export function DesignerModeRN({ active, onClose, relayUrl, pollInterval = 2000 }: Props) {
  const [selected, setSelected] = useState<RNComponentInfo | null>(null);
  const [changeset, setChangeset] = useState<ChangesetEntry[]>([]);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentWorking, setAgentWorking] = useState(false);
  const [relayStatus, setRelayStatus] = useState<RelayStatus>('checking');
  const [showFullPath, setShowFullPath] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const prevRelayStatus = useRef<RelayStatus>('checking');
  const scrollRef = useRef<ScrollView>(null);

  // Bottom sheet drag
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        // Only allow dragging down
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        const screenH = Dimensions.get('window').height;
        // If dragged more than 30% of screen or fast fling, dismiss
        if (gs.dy > screenH * 0.2 || gs.vy > 1.5) {
          Animated.timing(translateY, {
            toValue: screenH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSelected(null);
            translateY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  // Reset state when designer mode is activated
  useEffect(() => {
    if (active) {
      setSelected(null);
      setChangeset([]);
      setChatMessages([]);
      setMessage('');
      setAgentWorking(false);
      setShowFullPath(false);
      translateY.setValue(0);
    }
  }, [active, translateY]);

  // Check relay health
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    async function check() {
      const ok = await checkRelayHealth(relayUrl);
      if (!cancelled) {
        const next = ok ? 'connected' : 'disconnected';
        if (next !== prevRelayStatus.current) {
          prevRelayStatus.current = next;
          setRelayStatus(next);
        }
      }
    }
    check();
    const interval = setInterval(check, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [active, relayUrl]);

  const handleTouch = useCallback(async (touchX: number, touchY: number) => {
    const info = await hitTestFromFiberTree(touchX, touchY);
    if (info) {
      setSelected(info);
      setChangeset([]);
      setChatMessages([]);
      setShowFullPath(false);
    }
  }, []);

  const sendRequest = useCallback(async () => {
    if (!selected) return;
    const msg = message.trim();
    if (!msg && changeset.length === 0) return;

    if (msg) setChatMessages(prev => [...prev, { type: 'sent', text: msg }]);
    setAgentWorking(true);
    setMessage('');

    const prompt = buildAgentPrompt(selected, changeset, msg);
    try {
      await sendToRelay(relayUrl, prompt);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const response = await pollForResponse(relayUrl, abortRef.current.signal);
      if (response) {
        setChatMessages(prev => [...prev, { type: 'agent', text: response }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { type: 'agent', text: `Error: ${(err as Error).message}` }]);
    } finally {
      setAgentWorking(false);
    }
  }, [selected, changeset, message, relayUrl]);

  if (!active) return null;

  const filePathShort = selected?.filePath
    ? `${shortenPath(selected.filePath)}${selected.lineNumber ? `:${selected.lineNumber}` : ''}`
    : null;
  const filePathFull = selected?.filePath
    ? `${selected.filePath}${selected.lineNumber ? `:${selected.lineNumber}` : ''}`
    : null;

  const categories = selected?.style && Object.keys(selected.style).length > 0
    ? categorizeStyles(selected.style)
    : null;

  return (
    <Modal transparent animationType="none" visible={active} onRequestClose={onClose}>
      {/* Touch interceptor — fully transparent, app visible underneath */}
      {!selected && (
        <TouchableWithoutFeedback
          onPress={(e) => handleTouch(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        >
          <View style={s.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Backdrop */}
      {selected && (
        <Pressable style={s.backdrop} onPress={() => setSelected(null)} />
      )}

      {/* Inspector panel */}
      {selected && (
        <Animated.View style={[s.panel, { transform: [{ translateY }] }]}>
          {/* Drag handle */}
          <View style={s.handleBar} {...panResponder.panHandlers}>
            <View style={s.handle} />
          </View>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Designer Mode</Text>
            <View style={s.headerActions}>
              <Pressable onPress={() => setSelected(null)} style={s.iconBtn}>
                <Text style={s.iconBtnText}>{'\u2190'}</Text>
              </Pressable>
              <Pressable onPress={onClose} style={s.iconBtn}>
                <Text style={s.iconBtnText}>{'\u00D7'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Element header */}
          <View style={s.elHeader}>
            <View style={s.elNameRow}>
              <Text style={s.elName}>
                {selected.componentName}
              </Text>
              {selected.parentComponent && (
                <Text style={s.elParent}>{'\u2039'} {selected.parentComponent}</Text>
              )}
              {selected.testID && (
                <View style={s.testIdPill}>
                  <Text style={s.testIdPillText}>{selected.testID}</Text>
                </View>
              )}
            </View>
            {filePathShort && (
              <Pressable onPress={() => setShowFullPath(p => !p)}>
                <Text style={s.elFilePath} numberOfLines={showFullPath ? undefined : 1}>
                  {showFullPath ? filePathFull : filePathShort}
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            ref={scrollRef}
            style={s.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Text Content section — first, like web */}
            {selected.textContent != null && (
              <Section icon={'\u270F'} title="Text Content">
                <Text style={s.textContentValue}>{selected.textContent}</Text>
              </Section>
            )}

            {/* Layout section */}
            {selected.layout && (
              <Section icon={'\u229E'} title="Layout">
                <View style={s.twoCol}>
                  <PropRow half label="W" value={`${Math.round(selected.layout.width)}`} />
                  <PropRow half label="H" value={`${Math.round(selected.layout.height)}`} />
                  <PropRow half label="X" value={`${Math.round(selected.layout.pageX)}`} />
                  <PropRow half label="Y" value={`${Math.round(selected.layout.pageY)}`} />
                </View>
                {categories?.layout && categories.layout.length > 0 && (
                  <View style={[s.twoCol, { marginTop: 6 }]}>
                    {categories.layout.map(([key, val]) => (
                      <PropRow half key={key} label={key} value={val} />
                    ))}
                  </View>
                )}
              </Section>
            )}

            {/* Spacing section */}
            {categories?.spacing && categories.spacing.length > 0 && (
              <Section icon={'\u2B1C'} title="Spacing">
                {renderSpacingCross(categories.spacing)}
              </Section>
            )}

            {/* Typography section */}
            {categories?.typography && categories.typography.length > 0 && (
              <Section icon="T" title="Typography">
                {categories.typography.map(([key, val]) => (
                  <View key={key} style={s.propRow}>
                    <Text style={s.propLabel} numberOfLines={1}>{key}</Text>
                    <View style={s.propValueRow}>
                      {key === 'color' && isColorValue(val) && <ColorSwatch color={val} />}
                      <Text style={[s.propValue, s.mono]} numberOfLines={1}>{val}</Text>
                    </View>
                  </View>
                ))}
              </Section>
            )}

            {/* Fill & Stroke section */}
            {categories?.fillStroke && categories.fillStroke.length > 0 && (
              <Section icon={'\u25C9'} title="Fill & Stroke">
                {categories.fillStroke.map(([key, val]) => (
                  <View key={key} style={s.propRow}>
                    <Text style={s.propLabel} numberOfLines={1}>{key}</Text>
                    <View style={s.propValueRow}>
                      {isColorValue(val) && <ColorSwatch color={val} />}
                      <Text style={[s.propValue, s.mono]} numberOfLines={1}>{val}</Text>
                    </View>
                  </View>
                ))}
              </Section>
            )}

            {/* Component section */}
            <Section icon={'\u269B'} title="Component">
              <PropRow label="Name" value={selected.componentName} mono={false} />
              {selected.testID && <PropRow label="Test ID" value={selected.testID} />}
              {selected.filePath && (
                <PropRow
                  label="File"
                  value={`${shortenPath(selected.filePath)}${selected.lineNumber ? `:${selected.lineNumber}` : ''}`}
                />
              )}
              {/* Props */}
              {selected.props && Object.keys(selected.props).length > 0 && (
                <View style={s.propsJson}>
                  <Text style={s.propsJsonText} numberOfLines={8}>
                    {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(selected.props)
                          .filter(([k]) => k !== 'style' && k !== 'children')
                          .slice(0, 10)
                      ),
                      null,
                      2
                    )}
                  </Text>
                </View>
              )}
            </Section>

            {/* Other styles */}
            {categories?.other && categories.other.length > 0 && (
              <Section icon={'\u2699'} title="Other Styles" defaultOpen={false}>
                {categories.other.map(([key, val]) => (
                  <PropRow key={key} label={key} value={val} />
                ))}
              </Section>
            )}

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <View style={s.messageThread}>
                {chatMessages.map((msg, i) => (
                  <View key={i} style={msg.type === 'sent' ? s.msgSent : s.msgAgent}>
                    <Text style={msg.type === 'sent' ? s.msgSentText : s.msgAgentText}>
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Agent working indicator */}
            {agentWorking && (
              <View style={s.agentWorking}>
                <PulseOrb />
                <Text style={s.agentWorkingText}>Check your agent for progress and approvals</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            {/* Status row */}
            <View style={s.footerTop}>
              <View style={[
                s.statusDot,
                relayStatus === 'connected' && s.statusConnected,
                relayStatus === 'disconnected' && s.statusDisconnected,
              ]} />
              <Text style={s.footerStatusText}>
                {relayStatus === 'connected' ? 'Connected' : relayStatus === 'checking' ? 'Checking...' : 'Disconnected'}
              </Text>
              <View style={s.componentPill}>
                <Text style={s.componentPillText}>{selected.componentName}</Text>
              </View>
            </View>

            {/* Composer */}
            <View style={s.composer}>
              <View style={s.composerWrap}>
                <TextInput
                  style={s.chatInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe the change..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  onSubmitEditing={sendRequest}
                />
                <Pressable
                  onPress={sendRequest}
                  disabled={agentWorking || relayStatus !== 'connected'}
                  style={[s.sendBtn, (agentWorking || relayStatus !== 'connected') && s.sendBtnDisabled]}
                >
                  <Text style={s.sendBtnText}>{'\u2191'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom bar — replaces the FAB when designer mode is active */}
      {!selected && (
        <View style={s.bottomBar}>
          <Text style={s.bottomBarText}>Tap any component</Text>
          <Pressable onPress={onClose} style={s.bottomBarClose} hitSlop={8}>
            <Text style={s.bottomBarCloseText}>{'\u00D7'}</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}

/* ── Spacing Cross Editor ── */
function renderSpacingCross(spacingProps: [string, string][]) {
  const vals: Record<string, string> = {};
  for (const [key, val] of spacingProps) vals[key] = val;

  const marginTop = vals.marginTop ?? vals.marginVertical ?? vals.margin ?? '-';
  const marginRight = vals.marginRight ?? vals.marginHorizontal ?? vals.margin ?? '-';
  const marginBottom = vals.marginBottom ?? vals.marginVertical ?? vals.margin ?? '-';
  const marginLeft = vals.marginLeft ?? vals.marginHorizontal ?? vals.margin ?? '-';

  const paddingTop = vals.paddingTop ?? vals.paddingVertical ?? vals.padding ?? '-';
  const paddingRight = vals.paddingRight ?? vals.paddingHorizontal ?? vals.padding ?? '-';
  const paddingBottom = vals.paddingBottom ?? vals.paddingVertical ?? vals.padding ?? '-';
  const paddingLeft = vals.paddingLeft ?? vals.paddingHorizontal ?? vals.padding ?? '-';

  const hasMargin = [marginTop, marginRight, marginBottom, marginLeft].some(v => v !== '-');
  const hasPadding = [paddingTop, paddingRight, paddingBottom, paddingLeft].some(v => v !== '-');

  return (
    <View>
      {hasMargin && (
        <View style={s.spacingEditor}>
          <Text style={[s.spacingLabel, { color: C.accent }]}>Margin</Text>
          <View style={s.spacingCrossWrap}>
            <Text style={[s.spacingVal, { color: C.accent }]}>{marginTop}</Text>
            <View style={s.spacingMidRow}>
              <Text style={[s.spacingVal, { color: C.accent }]}>{marginLeft}</Text>
              <View style={[s.spacingCenter, { backgroundColor: C.accentDim }]} />
              <Text style={[s.spacingVal, { color: C.accent }]}>{marginRight}</Text>
            </View>
            <Text style={[s.spacingVal, { color: C.accent }]}>{marginBottom}</Text>
          </View>
        </View>
      )}
      {hasPadding && (
        <View style={s.spacingEditor}>
          <Text style={[s.spacingLabel, { color: C.success }]}>Padding</Text>
          <View style={s.spacingCrossWrap}>
            <Text style={[s.spacingVal, { color: C.success }]}>{paddingTop}</Text>
            <View style={s.spacingMidRow}>
              <Text style={[s.spacingVal, { color: C.success }]}>{paddingLeft}</Text>
              <View style={[s.spacingCenter, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]} />
              <Text style={[s.spacingVal, { color: C.success }]}>{paddingRight}</Text>
            </View>
            <Text style={[s.spacingVal, { color: C.success }]}>{paddingBottom}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ── Styles ── */
const s = StyleSheet.create({
  // Overlay / empty state
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accent,
    borderRadius: 28,
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  bottomBarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  bottomBarClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  bottomBarCloseText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 18,
  } as TextStyle,

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  } as ViewStyle,

  // Panel
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 24,
  } as ViewStyle,

  // Drag handle
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
    color: C.textSecondary,
  } as TextStyle,
  headerActions: {
    flexDirection: 'row',
    gap: 4,
    zIndex: 1,
  },
  iconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  iconBtnText: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 16,
  } as TextStyle,

  // Element header
  elHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  elNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  elName: {
    fontWeight: '700',
    fontSize: 13,
    color: C.text,
  } as TextStyle,
  elParent: {
    fontSize: 11,
    color: C.textTertiary,
  } as TextStyle,
  testIdPill: {
    backgroundColor: C.accentDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  testIdPillText: {
    fontSize: 9,
    color: C.accent,
    fontWeight: '500',
    fontFamily: 'Menlo',
  } as TextStyle,
  elFilePath: {
    fontSize: 10,
    color: C.textTertiary,
    fontFamily: 'Menlo',
    marginTop: 2,
  } as TextStyle,

  // Body
  body: {
    flexShrink: 1,
  },

  // Sections
  section: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sectionIcon: {
    fontSize: 11,
    width: 14,
    textAlign: 'center',
    color: C.textSecondary,
  } as TextStyle,
  sectionTitle: {
    flex: 1,
    color: C.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  chevron: {
    fontSize: 8,
    color: C.chevron,
  } as TextStyle,
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  sectionBody: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2,
  },

  // Property rows
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    gap: 6,
    marginVertical: 1,
  },
  propRowHalf: {
    width: '50%',
  } as ViewStyle,
  propLabel: {
    fontSize: 10,
    color: C.textTertiary,
    width: 72,
    flexShrink: 0,
  } as TextStyle,
  propValue: {
    flex: 1,
    fontSize: 11,
    color: C.text,
  } as TextStyle,
  propValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mono: {
    fontFamily: 'Menlo',
  } as TextStyle,

  // Two-column grid
  twoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Color swatch
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Text content
  textContentValue: {
    fontSize: 13,
    color: C.text,
    lineHeight: 18,
  } as TextStyle,

  // Props JSON
  propsJson: {
    backgroundColor: C.input,
    borderRadius: 4,
    padding: 6,
    marginTop: 6,
  },
  propsJsonText: {
    fontSize: 10,
    fontFamily: 'Menlo',
    color: C.textTertiary,
    lineHeight: 14,
  } as TextStyle,

  // Spacing editor
  spacingEditor: {
    marginBottom: 8,
  },
  spacingLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  } as TextStyle,
  spacingCrossWrap: {
    alignItems: 'center',
    gap: 2,
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: C.input,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.divider,
  },
  spacingMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    width: '100%',
  } as ViewStyle,
  spacingCenter: {
    width: 36,
    height: 18,
    borderRadius: 3,
  },
  spacingVal: {
    width: 40,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'Menlo',
  } as TextStyle,

  // Message thread
  messageThread: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  msgSent: {
    alignSelf: 'flex-end',
    backgroundColor: C.accent,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '85%',
  } as ViewStyle,
  msgSentText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 15,
  } as TextStyle,
  msgAgent: {
    alignSelf: 'flex-start',
    backgroundColor: C.surface,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: '85%',
  } as ViewStyle,
  msgAgentText: {
    color: C.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  } as TextStyle,

  // Agent working
  agentWorking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pulseOrb: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  agentWorkingText: {
    color: C.textTertiary,
    fontSize: 10,
  } as TextStyle,

  // Footer
  footer: {
    flexShrink: 0,
    backgroundColor: C.footerBg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.textTertiary,
  },
  statusConnected: {
    backgroundColor: C.success,
  },
  statusDisconnected: {
    backgroundColor: C.error,
  },
  footerStatusText: {
    fontSize: 10,
    color: C.textSecondary,
    flex: 1,
  } as TextStyle,
  componentPill: {
    backgroundColor: C.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  componentPillText: {
    fontSize: 10,
    fontFamily: 'Menlo',
    color: C.textSecondary,
  } as TextStyle,

  // Composer
  composer: {
    paddingHorizontal: 12,
    paddingBottom: 34,
    paddingTop: 6,
  },
  composerWrap: {
    position: 'relative',
  } as ViewStyle,
  chatInput: {
    backgroundColor: C.input,
    color: C.text,
    borderWidth: 1,
    borderColor: C.divider,
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 42,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 80,
    maxHeight: 150,
  } as TextStyle,
  sendBtn: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: C.accent,
    borderRadius: 6,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  sendBtnDisabled: {
    opacity: 0.3,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  } as TextStyle,

});
