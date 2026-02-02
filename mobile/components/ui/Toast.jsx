import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

const Toast = () => {
  const { colors } = useContext(ThemeContext);
  const { toast, hideToast } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const animateHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideToast();
    });
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return colors.profit;
      case 'error':
        return colors.expense;
      case 'warning':
        return colors.debt;
      default:
        return colors.card;
    }
  };

  if (!toast.visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: getBackgroundColor(),
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={[styles.message, { color: '#FFFFFF' }]}>
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  message: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Toast;