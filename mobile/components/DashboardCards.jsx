import React from 'react';
import { View } from 'react-native';
import { DashboardCard } from './DashboardCard';

const DashboardCards = ({ periodSummary, dailyTarget }) => {
  return (
    <View style={styles.cardsContainer}>
      <DashboardCard
        label="Yango Income"
        amount={periodSummary.yango_income}
        type="profit"
      />
      <DashboardCard
        label="Bolt Payout"
        amount={periodSummary.bolt_income}
        type="profit"
      />
      <DashboardCard
        label="Expenses"
        amount={periodSummary.expenses}
        type="expense"
      />
      <DashboardCard
        label="Yango Debt"
        amount={periodSummary.yango_debt}
        type="debt"
      />
      <DashboardCard
        label="Bolt Debt"
        amount={periodSummary.bolt_debt}
        type="debt"
      />
      <DashboardCard
        label="Net Profit"
        amount={periodSummary.net_profit}
        type="profit"
      />
    </View>
  );
};

const styles = {
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 24,
  },
};

export default DashboardCards;