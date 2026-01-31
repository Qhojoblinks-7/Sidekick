import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { apiCall } from '../services/apiService';
import { setSummary, setTransactions, setExpenses } from '../store/store';

const useDashboardData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[useDashboardData] Fetching dashboard data...');
        const [summaryRes, transactionsRes, expensesRes] = await Promise.all([
          apiCall('/api/summary/daily/'),
          apiCall('/api/transactions/'),
          apiCall('/api/expenses/')
        ]);

        console.log('[useDashboardData] Response status:', summaryRes.status, transactionsRes.status, expensesRes.status);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          console.log('[useDashboardData] Summary data:', summaryData);
          dispatch(setSummary(summaryData));
        } else {
          console.error('[useDashboardData] Failed to fetch summary:', summaryRes.status);
        }
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          console.log('[useDashboardData] Transactions count:', transactionsData.length);
          dispatch(setTransactions(transactionsData));
        } else {
          console.error('[useDashboardData] Failed to fetch transactions:', transactionsRes.status);
        }
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          console.log('[useDashboardData] Expenses count:', expensesData.length);
          dispatch(setExpenses(expensesData));
        } else {
          console.error('[useDashboardData] Failed to fetch expenses:', expensesRes.status);
        }
      } catch (error) {
        console.error('[useDashboardData] Failed to load data:', error);
      }
    };

    loadData();
  }, [dispatch]);
};

export default useDashboardData;