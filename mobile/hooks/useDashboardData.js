import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { API_BASE_URL } from '../constants/API';
import { setSummary, setTransactions, setExpenses } from '../store/store';

const useDashboardData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryRes, transactionsRes, expensesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/daily-summary/`),
          fetch(`${API_BASE_URL}/transactions/`),
          fetch(`${API_BASE_URL}/expenses/`)
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