import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Skeleton loader component for showing loading states
 */
export const Skeleton = ({ width, height, borderRadius = 8, style }) => {
  const { colors } = useTheme();
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startAnimation();
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.card,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: width,
            height: height,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

/**
 * Card skeleton for dashboard cards
 */
export const CardSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.cardSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardContent}>
        <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
        <Skeleton width={80} height={24} />
      </View>
      <View style={styles.cardIcon}>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
    </View>
  );
};

/**
 * Transaction list skeleton
 */
export const TransactionSkeleton = ({ count = 5 }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.transactionSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.transactionRow, { borderBottomColor: colors.border }]}>
          <Skeleton width={44} height={44} borderRadius={22} />
          <View style={styles.transactionInfo}>
            <Skeleton width={100} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width={60} height={12} />
          </View>
          <Skeleton width={70} height={20} />
        </View>
      ))}
    </View>
  );
};

/**
 * Hero section skeleton
 */
export const HeroSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.heroSkeleton, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.heroRow}>
        <View>
          <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={140} height={36} borderRadius={8} />
        </View>
        <Skeleton width={80} height={80} borderRadius={40} />
      </View>
      <View style={styles.heroStats}>
        <Skeleton width={60} height={12} style={{ marginBottom: 4 }} />
        <Skeleton width={100} height={20} />
      </View>
    </View>
  );
};

/**
 * Full page loading overlay
 */
export const LoadingOverlay = ({ visible, text = 'Loading...' }) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <Skeleton width={120} height={16} style={{ marginTop: 16 }} />
        <Skeleton width={80} height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardIcon: {
    marginLeft: 12,
  },
  transactionSkeleton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  heroSkeleton: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroStats: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
});
