import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  children: string;
  onPress: () => void;
}

export default function PrimaryButton({ children, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#037DD6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pressed: {
    backgroundColor: '#0260b4',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
