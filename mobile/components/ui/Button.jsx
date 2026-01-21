import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';

export const Button = ({ label, onPress, variant = 'primary', loading = false, disabled = false }) => {
  return (
    <TouchableOpacity
      onPress={loading || disabled ? undefined : onPress}
      style={[styles.base, styles[variant], (loading || disabled) && styles.disabled]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textMain} />
      ) : (
        <Text style={styles.text}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  primary: {
    backgroundColor: Colors.profit,
  },
  secondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.expense,
  },
  text: {
    color: Colors.textMain,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.6,
  },
});