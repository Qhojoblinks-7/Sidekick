import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { apiCall, SessionExpiredError } from '../services/apiService';
import { setSummary, setTransactions, setExpenses } from '../store/store';
import { triggerSessionExpired } from './usePeriodSummary';
import React from 'react';

// Fetch all dashboard data in parallel with caching
const fetchDashboardData = async () => {
  const [summaryRes, transactionsRes, expensesRes] = await Promise.all([
    apiCall('/api/summary/daily/'),
    apiCall('/api/transactions/'),
    apiCall('/api/expenses/')
  ]);

  const result = {};

  if (summaryRes.ok) {
    result.summary = await summaryRes.json();
  }
  if (transactionsRes.ok) {
    result.transactions = await transactionsRes.json();
  }
  if (expensesRes.ok) {
    result.expenses = await expensesRes.json();
  }

  return result;
};

// React Query hook for dashboard data with caching
export const useDashboardDataReact = () => {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // Data stays fresh for 2 minutes
    cacheTime: 5 * 60 * 1000, // Cache persists for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

// Legacy hook for backward compatibility - maintains Redux sync
const useDashboardData = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useDashboardDataReact();

  // Sync React Query data to Redux store
  React.useEffect(() => {
    if (data) {
      if (data.summary) {
        dispatch(setSummary(data.summary));
      }
      if (data.transactions) {
        dispatch(setTransactions(data.transactions));
      }
      if (data.expenses) {
        dispatch(setExpenses(data.expenses));
      }
    }
  }, [data, dispatch]);

  // Handle session expiration
  React.useEffect(() => {
    if (data && data.summary === null && data.transactions === null && data.expenses === null) {
      // This might indicate a session issue, but we'll handle it differently
    }
  }, [data]);

  const handleSessionExpired = async () => {
    dispatch(setSummary({ net_profit: 0, total_debt: 0, expenses: 0 }));
    dispatch(setTransactions([]));
    dispatch(setExpenses([]));
    await queryClient.invalidateQueries(['dashboardData']);
  };

  return { isLoading, refetch, isFetching, handleSessionExpired };
};

export default useDashboardData;
