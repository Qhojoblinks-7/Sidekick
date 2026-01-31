import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { ThemeContext } from '../contexts/ThemeContext';
import { selectDailyTarget } from '../store/store';

export const GoalProgressBar = ({ current }) => {
  const { colors } = useContext(ThemeContext);
  const target = useSelector(selectDailyTarget);
  const percentage = Math.min((current / target) * 100, 100);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 16,
    },
    title: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    amount: {
      color: colors.textMain,
      fontSize: 36,
      fontWeight: '900',
      marginTop: 4,
    },
    percentage: {
      color: colors.profit,
      fontWeight: '900',
      fontSize: 18,
    },
    progressContainer: {
      height: 12,
      width: '100%',
      backgroundColor: colors.border,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.profit,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    started: {
      color: colors.textTertiary,
      fontSize: 10,
    },
    target: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Net Profit</Text>
          <Text style={styles.amount}>GH₵ {current.toFixed(2)}</Text>
        </View>
        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { width: `${percentage}%` }]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.started}>Started: 6:00 AM</Text>
        <Text style={styles.target}>Target: GH₵ {target}</Text>
      </View>
    </View>
  );
};