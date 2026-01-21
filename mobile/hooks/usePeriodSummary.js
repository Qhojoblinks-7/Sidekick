import { useMemo } from 'react';

const usePeriodSummary = (filteredTransactions, summary) => {
  return useMemo(() => {
    const yangoIncome = filteredTransactions
      .filter(tx => tx.platform === 'YANGO')
      .reduce((sum, tx) => sum + parseFloat(tx.rider_profit || 0), 0);
    const boltIncome = filteredTransactions
      .filter(tx => tx.platform === 'BOLT')
      .reduce((sum, tx) => sum + parseFloat(tx.rider_profit || 0), 0);
    const yangoDebt = filteredTransactions
      .filter(tx => tx.platform === 'YANGO')
      .reduce((sum, tx) => sum + parseFloat(tx.platform_debt || 0), 0);
    const boltDebt = filteredTransactions
      .filter(tx => tx.platform === 'BOLT')
      .reduce((sum, tx) => sum + parseFloat(tx.platform_debt || 0), 0);
    const netProfit = yangoIncome + boltIncome;
    const totalDebt = yangoDebt + boltDebt;
    return {
      yango_income: yangoIncome,
      bolt_income: boltIncome,
      expenses: summary.expenses,
      yango_debt: yangoDebt,
      bolt_debt: boltDebt,
      net_profit: netProfit,
      total_debt: totalDebt,
    };
  }, [filteredTransactions, summary.expenses]);
};

export default usePeriodSummary;