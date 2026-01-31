import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { apiCall, SessionExpiredError } from '../services/apiService';
import { setSummary, setTransactions, setExpenses } from '../store/store';
import { registerSessionExpiredHandler, triggerSessionExpired } from './usePeriodSummary';
import * as SecureStore from "expo-secure-store";

const useDashboardData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Register session expiration handler
    const unregister = registerSessionExpiredHandler(async () => {
      // Clear Redux state if needed
      dispatch(setSummary({ net_profit: 0, total_debt: 0, expenses: 0 }));
      dispatch(setTransactions([]));
      dispatch(setExpenses([]));
    });

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
        if (error instanceof SessionExpiredError) {
          await triggerSessionExpired();
        }
      }
    };

    loadData();

    return () => {
      unregister();
    };
  }, [dispatch]);
};

export default useDashboardData;
