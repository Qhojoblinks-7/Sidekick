import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { apiCall } from '../services/apiService';
import { setSummary, setTransactions, setExpenses } from '../store/store';

const useDashboardData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryRes, transactionsRes, expensesRes] = await Promise.all([
          apiCall('/api/summary/daily/'),
          apiCall('/api/transactions/'),
          apiCall('/api/expenses/')
        ]);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          dispatch(setSummary(summaryData));
        }
        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          dispatch(setTransactions(transactionsData));
        }
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          dispatch(setExpenses(expensesData));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [dispatch]);
};

export default useDashboardData;