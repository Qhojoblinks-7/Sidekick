import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

export const TransactionItem = ({ platform, amount, time, type, status, onPress, onLongPress }) => {
  const { colors } = useContext(ThemeContext);
  const isExpense = type === 'expense';
  const isDebt = type === 'debt';

  // Determine platform color
  let platformColor = colors.textMain; // default
  if (platform === 'YANGO') {
    platformColor = colors.yango ? colors.yango.yellow : '#fbbf24';
  } else if (platform === 'BOLT') {
    platformColor = colors.bolt ? colors.bolt.green : '#10b981';
  } else if (isExpense) {
    platformColor = colors.expense; // expense categories
  }

  // Get icon for platform/category
  const getIcon = () => {
    if (platform === 'YANGO') {
      return <Image source={require('../assets/yango.jpg')} style={styles.platformIcon} />;
    } else if (platform === 'BOLT') {
      return <Image source={require('../assets/bolt.png')} style={styles.platformIcon} />;
    } else if (isExpense) {
      // Expense category icons
      const iconName = {
        'FUEL': 'car',
        'DATA': 'wifi',
        'FOOD': 'restaurant',
        'REPAIRS': 'build',
        'OTHER': 'ellipsis-horizontal'
      }[platform] || 'cash';

      return <Ionicons name={iconName} size={24} color={platformColor} />;
    }
    return null;
  };

  // Show platform text only for expenses, not for YANGO/BOLT
  const shouldShowPlatformText = isExpense;

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.black,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    platformIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
    },
    platform: {
      fontWeight: '900',
      fontSize: 12,
    },
    time: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },
    status: {
      color: colors.profit,
      fontSize: 8,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
    },
    amount: {
      fontWeight: '900',
      fontSize: 18,
    },
    typeText: {
      color: colors.textTertiary,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: -0.5,
    },
  });

  const Container = (onPress || onLongPress) ? TouchableOpacity : View;

  return (
    <Container style={styles.container} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <View>
          {shouldShowPlatformText && (
            <Text style={[styles.platform, { color: platformColor }]}>
              {platform}
            </Text>
          )}
          <Text style={styles.time}>{time}</Text>
          {status && (
            <Text style={styles.status}>{status}</Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isExpense || isDebt ? colors.expense : colors.textMain }]}>
          {isExpense || isDebt ? '-' : '+'} GH₵ {parseFloat(amount || 0).toFixed(2)}
        </Text>
        <Text style={styles.typeText}>
          {type === 'profit' ? 'Your Fee' : type === 'expense' ? 'Expense' : type === 'debt' ? 'Platform Debt' : type}
        </Text>
      </View>
    </Container>
  );
};