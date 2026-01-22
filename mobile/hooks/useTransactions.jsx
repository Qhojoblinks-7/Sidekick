import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../services/apiService';

export const useAddTransaction = () => {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      // This is the magic line: it tells the Dashboard its data is old
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};