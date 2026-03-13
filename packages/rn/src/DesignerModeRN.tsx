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
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import type { RNComponentInfo, DesignerModeRNOptions, ChangesetEntry } from './types.js';
import { hitTestComponents } from './spatial-index.js';
import { buildAgentPrompt, sendToRelay, pollForResponse, checkRelayHealth } from './relay-client.js';

interface Props extends DesignerModeRNOptions {
  /** Refs of all trackable components. Pass from a central registry. */
  componentRefs: React.RefObject<any>[];
  /** Whether designer mode is active */
  active: boolean;
  onClose: () => void;
}

type RelayStatus = 'connected' | 'disconnected' | 'checking';

export function DesignerModeRN({ componentRefs, active, onClose, relayUrl, pollInterval = 2000 }: Props) {
  const [selected, setSelected] = useState<RNComponentInfo | null>(null);
  const [changeset, setChangeset] = useState<ChangesetEntry[]>([]);
  const [message, setMessage] = useState('');
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [relayStatus, setRelayStatus] = useState<RelayStatus>('checking');
  const abortRef = useRef<AbortController | null>(null);

  // Check relay health
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    async function check() {
      const ok = await checkRelayHealth(relayUrl);
      if (!cancelled) setRelayStatus(ok ? 'connected' : 'disconnected');
    }
    check();
    const interval = setInterval(check, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [active, relayUrl]);

  const handleTouch = useCallback(async (touchX: number, touchY: number) => {
    if (componentRefs.length === 0) return;
    const info = await hitTestComponents(componentRefs, touchX, touchY);
    if (info) {
      setSelected(info);
      setChangeset([]);
      setAgentResponse(null);
    }
  }, [componentRefs]);

  const sendRequest = useCallback(async () => {
    if (!selected) return;
    setSending(true);
    setAgentResponse(null);

    const prompt = buildAgentPrompt(selected, changeset, message);

    try {
      await sendToRelay(relayUrl, prompt);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const response = await pollForResponse(relayUrl, abortRef.current.signal);
      setAgentResponse(response);
    } catch (err) {
      setAgentResponse(`Error: ${(err as Error).message}`);
    } finally {
      setSending(false);
      setMessage('');
    }
  }, [selected, changeset, message, relayUrl]);

  if (!active) return null;

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
              <Text style={styles.componentName}>{selected.componentName}</Text>
              {selected.filePath && (
                <Text style={styles.filePath} numberOfLines={1}>{selected.filePath}</Text>
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
                  width: `${selected.layout.width}px`,
                  height: `${selected.layout.height}px`,
                  x: `${selected.layout.x}`,
                  y: `${selected.layout.y}`,
                }).map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.rowKey}>{key}</Text>
                    <Text style={styles.rowValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Props section */}
            {selected.props && Object.keys(selected.props).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROPS</Text>
                {Object.entries(selected.props).slice(0, 10).map(([key, value]) => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.rowKey}>{key}</Text>
                    <Text style={styles.rowValue} numberOfLines={1}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Relay status */}
            <View style={styles.relaySection}>
              <View style={[styles.relayDot, relayStatus === 'connected' ? styles.relayConnected : styles.relayDisconnected]} />
              <Text style={styles.relayText}>
                {relayStatus === 'connected' ? 'Connected' : relayStatus === 'checking' ? 'Checking...' : 'Disconnected'}
              </Text>
            </View>

            {/* Chat */}
            <View style={styles.chatSection}>
              {agentResponse && (
                <View style={styles.agentBubble}>
                  <Text style={styles.agentBubbleText}>{agentResponse}</Text>
                </View>
              )}

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type a message..."
                  placeholderTextColor="#666"
                  multiline
                />
                <Pressable
                  onPress={sendRequest}
                  disabled={sending || !selected}
                  style={[styles.sendBtn, (sending || !selected) && styles.sendBtnDisabled]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendBtnText}>↑</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
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
  componentName: { color: '#fff', fontSize: 14, fontWeight: '600' },
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
  relaySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  relayDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  relayConnected: { backgroundColor: '#4caf50' },
  relayDisconnected: { backgroundColor: '#f44336' },
  relayText: { color: '#888', fontSize: 12 },
  chatSection: { padding: 14 },
  agentBubble: {
    backgroundColor: '#1a3a5c',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  agentBubbleText: { color: '#e0e0e0', fontSize: 13 },
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
