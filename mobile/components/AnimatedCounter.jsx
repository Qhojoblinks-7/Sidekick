import React, { useEffect, useRef, useState } from "react";
import { Text, Animated } from "react-native";

export const AnimatedCounter = ({
  value,
  duration = 1000,
  style,
  prefix = "",
  suffix = "",
  decimals = 2,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: true,
    }).start();
  }, [value]);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: val }) => {
      setDisplayValue(val);
    });
    return () => animatedValue.removeListener(listener);
  }, []);

  return (
    <Text style={style}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </Text>
  );
};
