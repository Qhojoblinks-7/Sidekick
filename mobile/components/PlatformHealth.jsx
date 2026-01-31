import React, { useContext, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ThemeContext } from "../contexts/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing = ({
  progress,
  color,
  size = 80,
  strokeWidth = 8,
  label,
  amount,
  isPulsing,
}) => {
  const { colors } = useContext(ThemeContext);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const ringStyles = StyleSheet.create({
    ringContainer: {
      width: size,
      height: size,
      justifyContent: "center",
      alignItems: "center",
    },
    ringLabel: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    ringPercentage: {
      fontSize: 20,
      fontWeight: "900",
    },
    ringLabelText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    ringAmount: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
  });

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [progress]);

  // Pulsing animation for danger zone
  useEffect(() => {
    if (isPulsing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPulsing]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const getStatusColor = (pct) => {
    if (pct >= 80) return colors.expense; // Red - danger
    if (pct >= 50) return colors.debt; // Orange - warning
    return color; // Default green/yellow
  };

  const ringColor = getStatusColor(progress);

  const containerStyle = [
    ringStyles.ringContainer,
    isPulsing && { transform: [{ scale: pulseAnim }] },
  ];

  return (
    <View style={containerStyle}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={[{ rotate: "-90deg" }]}
        />
      </Svg>
      <View style={ringStyles.ringLabel}>
        <Text style={[ringStyles.ringPercentage, { color: ringColor }]}>
          {progress.toFixed(0)}%
        </Text>
        <Text style={ringStyles.ringLabelText}>{label}</Text>
        <Text style={ringStyles.ringAmount}>
          GH₵ {parseFloat(amount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

export const PlatformHealth = ({
  boltDebt,
  yangoDebt,
  boltLimit = 200,
  yangoLimit = 200,
}) => {
  const { colors } = useContext(ThemeContext);

  const boltProgress = Math.min((boltDebt / boltLimit) * 100, 100);
  const yangoProgress = Math.min((yangoDebt / yangoLimit) * 100, 100);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      paddingBottom: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 16,
      textAlign: "center",
    },
    ringsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Platform Status (Debt Limit)</Text>
        <View style={styles.ringsContainer}>
          <ProgressRing
            progress={boltProgress}
            color={colors.bolt?.green || "#00D15D"}
            size={110}
            label="Bolt"
            amount={boltDebt}
            isPulsing={boltProgress >= 80}
          />
          <ProgressRing
            progress={yangoProgress}
            color={colors.yango?.yellow || "#FFD600"}
            size={110}
            label="Yango"
            amount={yangoDebt}
            isPulsing={yangoProgress >= 80}
          />
        </View>
      </View>
    </View>
  );
};
