import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

export const DashboardCard = ({ label, amount, type }) => {
  const { colors } = useContext(ThemeContext);

  const getBorderColor = (type) => {
    switch (type) {
      case 'yango':
        return colors.yango ? colors.yango.yellow : '#fbbf24';
      case 'bolt':
        return colors.bolt ? colors.bolt.green : '#10b981';
      case 'profit':
        return colors.profit;
      case 'expense':
        return colors.expense;
      case 'debt':
        return colors.debt;
      case 'goal':
        return colors.profit;
      default:
        return colors.border;
    }
  };

  const styles = StyleSheet.create({
    card: {
      padding: 16,
      borderRadius: 24,
      borderLeftWidth: 4,
      marginBottom: 16,
      width: '48%',
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowOpacity: 0.1,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
    },
    label: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 4,
    },
    currency: {
      color: colors.textSecondary,
      fontSize: 12,
      marginRight: 4,
    },
    amount: {
      color: colors.textMain,
      fontSize: 20,
      fontWeight: '900',
    },
  });

  return (
    <View style={[styles.card, { borderLeftColor: getBorderColor(type) }]}>
      <Text style={styles.label}>
        {label}
      </Text>
      <View style={styles.amountContainer}>
        <Text style={styles.currency}>GH₵</Text>
        <Text style={styles.amount}>
          {parseFloat(amount || 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );
};