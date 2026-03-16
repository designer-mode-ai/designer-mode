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
  type ViewStyle,
} from 'react-native';
import type { RNComponentInfo, DesignerModeRNOptions, ChangesetEntry } from './types';
import { hitTestFromFiberTree } from './fiber';
import { buildAgentPrompt, sendToRelay, pollForResponse, checkRelayHealth } from './relay-client';

interface Props extends DesignerModeRNOptions {
  /** Whether designer mode is active */
  active: boolean;
  onClose: () => void;
}

type RelayStatus = 'connected' | 'disconnected' | 'checking';
type ChatMessage = { type: 'sent' | 'agent'; text: string };

function shortenPath(filePath: string): string {
  const parts = filePath.split('/');
  return parts.slice(-2).join('/');
}

function PulseOrb() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View style={[styles.pulseOrb, { opacity: anim }]} />
  );
}

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

  const filePathDisplay = selected?.filePath
    ? `${shortenPath(selected.filePath)}${selected.lineNumber ? `:${selected.lineNumber}` : ''}`
    : null;
  const filePathFull = selected?.filePath
    ? `${selected.filePath}${selected.lineNumber ? `:${selected.lineNumber}` : ''}`
    : null;

  return (
    <Modal transparent animationType="none" visible={active} onRequestClose={onClose}>
      {/* Touch interceptor — full screen */}
      {!selected && (
        <TouchableWithoutFeedback
          onPress={(e) => {
            const { pageX, pageY } = e.nativeEvent;
            handleTouch(pageX, pageY);
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.hint}>
              <Text style={styles.hintText}>Tap any component to inspect</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Inspector panel */}
      {selected && (
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.componentName}>
                  {selected.componentName}
                  {selected.elementLabel ? <Text style={styles.elementLabel}>{' › '}{selected.elementLabel}</Text> : null}
                </Text>
                <View style={[styles.relayDot, relayStatus === 'connected' ? styles.relayConnected : styles.relayDisconnected]} />
              </View>
              {filePathDisplay && (
                <Pressable onPress={() => setShowFullPath(p => !p)}>
                  <Text style={styles.filePath} numberOfLines={showFullPath ? undefined : 1}>
                    {showFullPath ? filePathFull : filePathDisplay}
                  </Text>
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => setSelected(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>×</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.panelBody} keyboardShouldPersistTaps="handled">
            {/* Layout section */}
            {selected.layout && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>LAYOUT</Text>
                {Object.entries({
                  width: `${Math.round(selected.layout.width)}`,
                  height: `${Math.round(selected.layout.height)}`,
                  x: `${Math.round(selected.layout.pageX)}`,
                  y: `${Math.round(selected.layout.pageY)}`,
                }).map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.rowKey}>{key}</Text>
                    <Text style={styles.rowValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Style section */}
            {selected.style && Object.keys(selected.style).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>STYLES</Text>
                {Object.entries(selected.style).map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.rowKey}>{key}</Text>
                    <Text style={styles.rowValue} numberOfLines={1}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Props section */}
            {selected.props && Object.keys(selected.props).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROPS</Text>
                {Object.entries(selected.props)
                  .filter(([key]) => key !== 'style' && key !== 'children')
                  .slice(0, 10)
                  .map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.rowKey}>{key}</Text>
                    <Text style={styles.rowValue} numberOfLines={1}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <View style={styles.chatSection}>
                {chatMessages.map((msg, i) => (
                  <View key={i} style={msg.type === 'sent' ? styles.sentBubble : styles.agentBubble}>
                    <Text style={msg.type === 'sent' ? styles.sentBubbleText : styles.agentBubbleText}>
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Agent working indicator */}
            {agentWorking && (
              <View style={styles.workingRow}>
                <PulseOrb />
                <Text style={styles.workingText}>Check your agent for progress and approvals</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer: status + input */}
          <View style={styles.footer}>
            <View style={styles.footerStatus}>
              <Text style={styles.statusText}>
                {relayStatus === 'connected' ? 'Connected' : relayStatus === 'checking' ? 'Checking...' : 'Not connected'}
              </Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe the change..."
                placeholderTextColor="#666"
                multiline
              />
              <Pressable
                onPress={sendRequest}
                disabled={agentWorking || !selected || relayStatus !== 'connected'}
                style={[styles.sendBtn, (agentWorking || relayStatus !== 'connected') && styles.sendBtnDisabled]}
              >
                <Text style={styles.sendBtnText}>↑</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Close button (always visible) */}
      <Pressable onPress={onClose} style={styles.globalClose}>
        <Text style={styles.globalCloseText}>✕ Exit Designer Mode</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  } as ViewStyle,
  hint: {
    marginTop: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hintText: { color: '#fff', fontSize: 13 },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: '#2c2c2c',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 16,
  } as ViewStyle,
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerLeft: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  componentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  elementLabel: { color: '#888', fontWeight: '400' },
  filePath: { color: '#888', fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#aaa', fontSize: 20, lineHeight: 20 },
  panelBody: { maxHeight: 400 },
  section: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  rowKey: { color: '#aaa', fontSize: 12 },
  rowValue: { color: '#e0e0e0', fontSize: 12, flex: 1, textAlign: 'right' },
  relayDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  relayConnected: { backgroundColor: '#4caf50' },
  relayDisconnected: { backgroundColor: '#f44336' },
  chatSection: { padding: 14, gap: 8 },
  sentBubble: {
    backgroundColor: '#037DD6',
    borderRadius: 8,
    padding: 10,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  sentBubbleText: { color: '#fff', fontSize: 13 },
  agentBubble: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 10,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  agentBubbleText: { color: '#e0e0e0', fontSize: 13 },
  workingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pulseOrb: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#037DD6',
  },
  workingText: { color: '#888', fontSize: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    padding: 14,
  },
  footerStatus: {
    marginBottom: 8,
  },
  statusText: { color: '#888', fontSize: 11 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e0e0e0',
    fontSize: 13,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#444',
  },
  sendBtn: {
    backgroundColor: '#037DD6',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#444' },
  sendBtnText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  globalClose: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  } as ViewStyle,
  globalCloseText: { color: '#fff', fontSize: 12 },
});
