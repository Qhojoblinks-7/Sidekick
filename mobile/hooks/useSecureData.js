import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../services/apiService';

export const useSecureTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await apiCall('/transactions/', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSecureExpenses = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await apiCall('/expenses/', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSecureDailySummary = () => {
  return useQuery({
    queryKey: ['daily-summary'],
    queryFn: async () => {
      const response = await apiCall('/summary/daily/', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch daily summary');
      }
      return response.json();
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
};
