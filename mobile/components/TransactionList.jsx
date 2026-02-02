import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TransactionItem } from './TransactionItem';
import { ThemeContext } from '../contexts/ThemeContext';

const TransactionList = ({ filteredTransactions }) => {
  const { colors } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    tripsContainer: {
      marginTop: 10,
    },
    scrollContainer: {
      height: 500,
    },
    empty: {
      alignItems: "center",
      marginTop: 40,
    },
    emptyText: {
      color: colors.textTertiary,
      fontStyle: "italic",
    },
  });

  return (
    <View style={styles.tripsContainer}>
      <View style={styles.scrollContainer}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const createdAt = new Date(tx.created_at);
            const timeString = createdAt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            // Always show as profit with P/D breakdown
            const type = "profit";
            const amount = tx.rider_profit;

            return (
              <TransactionItem
                key={tx.id}
                platform={tx.platform}
                amount={parseFloat(amount).toFixed(2)}
                time={timeString}
                type={type}
                status={tx.status}
                isTip={tx.is_tip || false}
                riderProfit={tx.rider_profit != null ? parseFloat(tx.rider_profit) : 0}
                platformDebt={tx.platform_debt != null ? parseFloat(tx.platform_debt) : 0}
                syncStatus={tx.syncStatus || 'synced'}
              />
            );
          })
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No trips found for the selected period.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TransactionList;