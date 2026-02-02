import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemeContext } from "../contexts/ThemeContext";
import { AnimatedCounter } from "./AnimatedCounter";

export const HeroSection = ({ netProfit, income, expenses, target }) => {
  const { colors } = useContext(ThemeContext);

  const isNegative = netProfit < 0;
  const isExceeded = target > 0 && netProfit >= target;
  const progress = target > 0 ? Math.min((Math.abs(netProfit) / target) * 100, 100) : 0;

  // Dynamic colors based on edge cases
  const profitColor = isNegative ? colors.expense : colors.profit;
  const progressBarColor = isExceeded ? colors.profit : (isNegative ? colors.expense : colors.debt);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      paddingBottom: 16,
    },
    netProfitCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      width: "100%",
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 8,
    },
    netProfitAmount: {
      color: profitColor,
      fontSize: 48,
      fontWeight: "900",
      marginBottom: 8,
    },
    netProfitCurrency: {
      color: profitColor,
      fontSize: 24,
      fontWeight: "900",
      marginLeft: 4,
    },
    pillsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 20,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    incomePill: {
      backgroundColor: `${colors.profit}20`,
      borderWidth: 1,
      borderColor: colors.profit,
    },
    expensePill: {
      backgroundColor: `${colors.expense}20`,
      borderWidth: 1,
      borderColor: colors.expense,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "700",
    },
    incomeText: {
      color: colors.profit,
    },
    expenseText: {
      color: colors.expense,
    },
    progressBarContainer: {
      width: "100%",
      marginTop: 16,
    },
    progressBarColumn: {
      flexDirection: "column",
    },
    progressHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    progressText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    goalAmountText: {
      color: colors.textMuted,
      fontSize: 12,
      opacity: 0.6,
    },
    progressBarBackground: {
      height: 14,
      backgroundColor: colors.border,
      borderRadius: 7,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: progressBarColor,
      borderRadius: 7,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    exceededBadge: {
      backgroundColor: `${colors.profit}20`,
      borderWidth: 1,
      borderColor: colors.profit,
    },
    exceededBadgeText: {
      color: colors.profit,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.netProfitCard}>
        <Text style={styles.label}>Daily Net Profit</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <AnimatedCounter
            value={Math.abs(netProfit || 0)}
            prefix={isNegative ? "-" : ""}
            style={[styles.netProfitAmount, { color: profitColor }]}
            duration={400}
          />
          <Text style={[styles.netProfitCurrency, { color: profitColor }]}>
            GH₵
          </Text>
        </View>

        {/* Status Badge for Target Exceeded */}
        {isExceeded && (
          <View style={[styles.pill, styles.exceededBadge]}>
            <Text style={[styles.pillText, styles.exceededBadgeText]}>
              Target Exceeded! 🎉
            </Text>
          </View>
        )}

        <View style={styles.pillsContainer}>
          <View style={[styles.pill, styles.incomePill]}>
            <Text style={[styles.pillText, styles.incomeText]}>
              Income: <AnimatedCounter value={income || 0} duration={300} decimals={2} />
            </Text>
          </View>
          <View style={[styles.pill, styles.expensePill]}>
            <Text style={[styles.pillText, styles.expenseText]}>
              Expenses: <AnimatedCounter value={expenses || 0} duration={300} decimals={2} />
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarColumn}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressText}>
              {isNegative ? "Deficit" : isExceeded ? "Goal Reached!" : `${progress.toFixed(0)}% of Goal`}
            </Text>
            <Text style={styles.goalAmountText}>
              {isNegative ? "Shortfall: " : ""}GH₵{" "}
              <AnimatedCounter value={Math.abs(netProfit) || 0} duration={300} decimals={2} />/GH₵{" "}
              <AnimatedCounter value={target || 0} duration={300} decimals={2} />
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
};
