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

            let type = "profit";
            let amount = tx.rider_profit;

            if (parseFloat(tx.platform_debt) > 0) {
              type = "debt";
              amount = tx.platform_debt;
            }

            return (
              <TransactionItem
                key={tx.id}
                platform={tx.platform}
                amount={parseFloat(amount).toFixed(2)}
                time={timeString}
                type={type}
                status={tx.status}
                isTip={tx.is_tip || false}
                riderProfit={tx.rider_profit || null}
                platformDebt={tx.platform_debt || null}
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