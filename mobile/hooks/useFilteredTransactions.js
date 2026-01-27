import { useMemo } from 'react';

const useFilteredTransactions = (transactionsData, period) => {
  return useMemo(() => {
    const { startDate, endDate } = period;

    return transactionsData
      .filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate && txDate < endDate;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactionsData, period]);
};

export default useFilteredTransactions;