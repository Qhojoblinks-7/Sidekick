import { useMemo } from 'react';

const useFilteredTransactions = (transactionsData, selectedPeriod, customDate) => {
  return useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case "custom":
        startDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
        endDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate() + 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    return transactionsData
      .filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate && txDate < endDate;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [transactionsData, selectedPeriod, customDate]);
};

export default useFilteredTransactions;