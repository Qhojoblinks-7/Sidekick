import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { apiCall } from '../services/apiService';
import { addTransaction, addExpense, setSummary } from '../store/store';

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { summary } = useSelector(state => state.data);

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
    onSuccess: (result) => {
      dispatch(addTransaction(result));
      const today = new Date().toDateString();
      const txDate = new Date(result.created_at).toDateString();
      if (txDate === today) {
        const updatedSummary = {
          ...summary,
          net_profit: summary.net_profit + parseFloat(result.rider_profit || 0),
          total_debt: summary.total_debt + parseFloat(result.platform_debt || 0),
        };
        dispatch(setSummary(updatedSummary));
      }
      // This is the magic line: it tells the Dashboard its data is old
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
  });
};

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { summary } = useSelector(state => state.data);

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
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodSummary'] });
    },
  });
};