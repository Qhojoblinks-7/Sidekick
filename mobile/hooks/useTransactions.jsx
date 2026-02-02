import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { apiCall, SessionExpiredError } from '../services/apiService';
import { addTransaction, addExpense, removeTransaction, removeExpense, setSummary, selectSummary } from '../store/store';
import { registerSessionExpiredHandler, triggerSessionExpired } from './usePeriodSummary';
import * as SecureStore from "expo-secure-store";

const updateSummary = async (dispatch) => {
  try {
    const response = await apiCall('/api/summary/daily/');
    if (response.ok) {
      const summary = await response.json();
      dispatch(setSummary(summary));
    } else {
      console.error('Failed to fetch summary:', response.status);
    }
  } catch (error) {
    console.error('Error updating summary:', error);
    if (error instanceof SessionExpiredError) {
      throw error;
    }
  }
};

const handleSessionExpired = async (router) => {
  await triggerSessionExpired();
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const summary = useSelector(selectSummary);

  return useMutation({
    mutationFn: async (newTx) => {
      try {
        const response = await apiCall('/api/transactions/', {
          method: 'POST',
          body: JSON.stringify(newTx),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to save transaction: ${response.status} ${response.statusText}. ${errorData.detail || ''}`);
        }
        return response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
        }
        throw error;
      }
    },
    onSuccess: async (result) => {
      dispatch(addTransaction(result));
      await updateSummary(dispatch);
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({ id, updatedTx }) => {
      try {
        const response = await apiCall(`/api/transactions/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(updatedTx),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to update transaction: ${response.status} ${response.statusText}. ${errorData.detail || ''}`);
        }
        return response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await updateSummary(dispatch);
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const summary = useSelector(selectSummary);

  return useMutation({
    mutationFn: async (newExpense) => {
      try {
        const response = await apiCall('/api/expenses/', {
          method: 'POST',
          body: JSON.stringify(newExpense),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to save expense: ${response.status} ${response.statusText}. ${errorData.detail || ''}`);
        }
        return response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      dispatch(addExpense(result));
      const today = new Date().toDateString();
      const expDate = new Date(result.created_at).toDateString();
      if (expDate === today) {
        const updatedSummary = {
          ...summary,
          expenses: summary.expenses + parseFloat(result.amount),
          net_profit: summary.net_profit - parseFloat(result.amount),
        };
        dispatch(setSummary(updatedSummary));
      }
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async ({ id, updatedExpense }) => {
      try {
        const response = await apiCall(`/api/expenses/${id}/`, {
          method: 'PUT',
          body: JSON.stringify(updatedExpense),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to update expense: ${response.status} ${response.statusText}. ${errorData.detail || ''}`);
        }
        return response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await updateSummary(dispatch);
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiCall(`/api/expenses/${id}/`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to delete expense: ${response.status} ${response.statusText}. ${errorData.detail || ''}`);
        }
        return response;
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
        }
        throw error;
      }
    },
    onSuccess: async (result, id) => {
      dispatch(removeExpense(id));
      await updateSummary(dispatch);
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};

// Data fetching hooks for history screen
const fetchHistoryData = async () => {
  const [transactionsRes, expensesRes] = await Promise.all([
    apiCall('/api/transactions/'),
    apiCall('/api/expenses/')
  ]);

  const result = {};

  if (transactionsRes.ok) {
    result.transactions = await transactionsRes.json();
  }
  if (expensesRes.ok) {
    result.expenses = await expensesRes.json();
  }

  return result;
};

export const useHistoryData = (options = {}) => {
  const { staleTime = 2 * 60 * 1000, enabled = true } = options;

  return useQuery({
    queryKey: ['historyData'],
    queryFn: fetchHistoryData,
    staleTime,
    cacheTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled,
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};
