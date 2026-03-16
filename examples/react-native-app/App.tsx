import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { DesignerModeRN } from 'designer-mode-rn';
import Card from './components/Card';
import PrimaryButton from './components/PrimaryButton';
import ColorSwatch from './components/ColorSwatch';

// Auto-detect the dev machine's LAN IP from Expo
function getDefaultRelayUrl(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3334`;
  }
  return 'http://localhost:3334';
}

export default function App() {
  const [designerActive, setDesignerActive] = useState(false);
  const [relayUrl] = useState(getDefaultRelayUrl);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Designer Mode</Text>
        <Text style={styles.subtitle}>React Native Example</Text>
        <Text style={styles.relayInfo}>Relay: {relayUrl}</Text>

        <Card title="Getting Started">
          <Text style={styles.body}>
            This is a demo app for Designer Mode. Tap the 🎨 button to activate
            the inspector, then tap any component to inspect it.
          </Text>
          <PrimaryButton onPress={() => {}}>
            Click Me
          </PrimaryButton>
        </Card>

        <Card title="Typography">
          <Text style={styles.heading2}>Heading 2</Text>
          <Text style={styles.heading3}>Heading 3</Text>
          <Text style={styles.body}>
            Regular paragraph text with{' '}
            <Text style={styles.bold}>bold</Text> and{' '}
            <Text style={styles.italic}>italic</Text> styling.
          </Text>
        </Card>

        <Card title="Colours">
          <View style={styles.swatchRow}>
            <ColorSwatch color="#037DD6" label="Primary" />
            <ColorSwatch color="#0260b4" label="Primary Dark" />
            <ColorSwatch color="#f6f8fa" label="Surface" />
            <ColorSwatch color="#1e1e1e" label="Dark" />
          </View>
        </Card>
      </ScrollView>

      {/* Designer Mode FAB */}
      <Pressable onPress={() => setDesignerActive(true)} style={styles.fab}>
        <Text style={styles.fabText}>🎨</Text>
      </Pressable>

      {/* Designer Mode — just drop it in, no setup needed */}
      <DesignerModeRN
        active={designerActive}
        onClose={() => setDesignerActive(false)}
        relayUrl={relayUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 4,
  },
  relayInfo: {
    color: '#555',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  heading2: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading3: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
  },
});
