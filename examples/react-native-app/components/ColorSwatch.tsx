import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ColorSwatchProps {
  color: string;
  label: string;
}

export default function ColorSwatch({ color, label }: ColorSwatchProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  label: {
    color: '#888',
    fontSize: 10,
  },
});
