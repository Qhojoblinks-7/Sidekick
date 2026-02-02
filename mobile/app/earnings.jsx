import React, { useState, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { ThemeContext } from '../contexts/ThemeContext';
import { TransactionItem } from '../components/TransactionItem';

const MONTHS = [
  { name: 'January', value: 0 },
  { name: 'February', value: 1 },
  { name: 'March', value: 2 },
  { name: 'April', value: 3 },
  { name: 'May', value: 4 },
  { name: 'June', value: 5 },
  { name: 'July', value: 6 },
  { name: 'August', value: 7 },
  { name: 'September', value: 8 },
  { name: 'October', value: 9 },
  { name: 'November', value: 10 },
  { name: 'December', value: 11 },
];

export default function Earnings() {
  const { colors } = useContext(ThemeContext);
  const transactionsData = useSelector((state) => state.data.transactions);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  // Filter transactions for selected month and year
  const monthlyTransactions = useMemo(() => {
    if (!transactionsData || !Array.isArray(transactionsData)) {
      return [];
    }
    return transactionsData.filter((tx) => {
      const txDate = new Date(tx.created_at);
      return txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear;
    });
  }, [transactionsData, selectedMonth, selectedYear]);

  // Calculate totals
  const totals = useMemo(() => {
    let totalEarnings = 0;
    let totalTips = 0;
    let yangoIncome = 0;
    let boltIncome = 0;
    let yangoDebt = 0;
    let boltDebt = 0;
    let tripCount = monthlyTransactions.length;

    monthlyTransactions.forEach((tx) => {
      const amount = parseFloat(tx.rider_profit) || 0;
      totalEarnings += amount;

      if (tx.is_tip) {
        totalTips += amount;
      }

      if (tx.platform === 'YANGO') {
        yangoIncome += amount;
        yangoDebt += parseFloat(tx.platform_debt) || 0;
      } else if (tx.platform === 'BOLT') {
        boltIncome += amount;
        boltDebt += parseFloat(tx.platform_debt) || 0;
      }
    });

    return {
      totalEarnings,
      totalTips,
      yangoIncome,
      boltIncome,
      yangoDebt,
      boltDebt,
      tripCount,
    };
  }, [monthlyTransactions]);

  const getMonthYearString = () => {
    const monthName = MONTHS[selectedMonth].name;
    return `${monthName} ${selectedYear}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      marginTop: 30,
      paddingTop: 16,
    },
    monthSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthSelectorText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textMain,
    },
    summaryCards: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    summaryCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: 8,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textMain,
    },
    summaryValueProfit: {
      color: colors.profit,
    },
    summaryValueExpense: {
      color: colors.expense,
    },
    summaryValueTip: {
      color: '#fbbf24',
    },
    tipsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: '#fbbf24',
    },
    tipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fbbf24',
      marginLeft: 8,
    },
    tipsValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fbbf24',
    },
    tipsSubtext: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textMain,
      marginBottom: 12,
      marginTop: 8,
    },
    transactionsList: {
      paddingBottom: 100,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 16,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      width: '80%',
      maxWidth: 320,
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textMain,
      textAlign: 'center',
      marginBottom: 16,
    },
    yearSelector: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      gap: 16,
    },
    yearButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    yearButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textMain,
    },
    currentYear: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textMain,
      minWidth: 60,
      textAlign: 'center',
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    monthButton: {
      width: '30%',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthButtonSelected: {
      backgroundColor: colors.profit,
      borderColor: colors.profit,
    },
    monthButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMain,
    },
    monthButtonTextSelected: {
      color: colors.textMain,
    },
    closeButton: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textMain,
    },
  });

  const renderTransaction = ({ item }) => {
    const type = parseFloat(item.platform_debt) > 0 ? 'debt' : 'profit';
    const amount = parseFloat(item.rider_profit).toFixed(2);

    return (
      <TransactionItem
        platform={item.platform}
        amount={amount}
        time={`${formatDate(item.created_at)} • ${formatTime(item.created_at)}`}
        type={type}
        status={item.status}
        isTip={item.is_tip || false}
        riderProfit={item.rider_profit || null}
        platformDebt={item.platform_debt || null}
        syncStatus={item.syncStatus || 'synced'}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.contentContainer}>
        {/* Month Selector */}
        <TouchableOpacity
          style={styles.monthSelector}
          onPress={() => setMonthPickerVisible(true)}
        >
          <Text style={styles.monthSelectorText}>{getMonthYearString()}</Text>
          <Ionicons name="calendar" size={24} color={colors.textMain} />
        </TouchableOpacity>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={[styles.summaryValue, styles.summaryValueProfit]}>
              GH₵ {totals.totalEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Trip Count</Text>
            <Text style={styles.summaryValue}>{totals.tripCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Yango Income</Text>
            <Text style={[styles.summaryValue, styles.summaryValueProfit]}>
              GH₵ {totals.yangoIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Bolt Income</Text>
            <Text style={[styles.summaryValue, styles.summaryValueProfit]}>
              GH₵ {totals.boltIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Debt</Text>
            <Text style={[styles.summaryValue, styles.summaryValueExpense]}>
              GH₵ {(totals.yangoDebt + totals.boltDebt).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Profit</Text>
            <Text style={[styles.summaryValue, styles.summaryValueProfit]}>
              GH₵ {(totals.totalEarnings - totals.yangoDebt - totals.boltDebt).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Tips Card */}
        {totals.totalTips > 0 && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="sparkles" size={20} color="#fbbf24" />
              <Text style={styles.tipsTitle}>Tips Earned</Text>
            </View>
            <Text style={styles.tipsValue}>GH₵ {totals.totalTips.toFixed(2)}</Text>
            <Text style={styles.tipsSubtext}>
              From {monthlyTransactions.filter((tx) => tx.is_tip).length} tip transactions
            </Text>
          </View>
        )}

        {/* Transactions Header */}
        <Text style={styles.sectionHeader}>
          Transactions ({monthlyTransactions.length})
        </Text>

        {/* Transactions List */}
        <FlatList
          data={monthlyTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id?.toString() || item.tx_id}
          scrollEnabled={false}
          contentContainerStyle={styles.transactionsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions for {getMonthYearString()}</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Month Picker Modal */}
      <Modal
        visible={monthPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>

            {/* Year Selector */}
            <View style={styles.yearSelector}>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setSelectedYear(selectedYear - 1)}
              >
                <Ionicons name="chevron-back" size={24} color={colors.textMain} />
              </TouchableOpacity>
              <Text style={styles.currentYear}>{selectedYear}</Text>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setSelectedYear(selectedYear + 1)}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            {/* Month Grid */}
            <View style={styles.monthGrid}>
              {MONTHS.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.monthButton,
                    selectedMonth === month.value && styles.monthButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(month.value);
                    setMonthPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      selectedMonth === month.value && styles.monthButtonTextSelected,
                    ]}
                  >
                    {month.name.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMonthPickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
