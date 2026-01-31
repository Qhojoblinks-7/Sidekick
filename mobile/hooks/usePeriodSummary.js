import { useQuery } from '@tanstack/react-query';
import { apiCall, SessionExpiredError } from '../services/apiService';
import { router } from 'expo-router';
import * as SecureStore from "expo-secure-store";

// Session expiration handler registry
const sessionExpiredHandlers = new Set();

// Register a session expiration handler
export const registerSessionExpiredHandler = (handler) => {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
};

// Trigger all session expiration handlers
const triggerSessionExpired = async () => {
  console.log("Session expired, clearing tokens and notifying handlers...");
  // Clear tokens
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  // Notify all handlers
  sessionExpiredHandlers.forEach(handler => handler());
  // Navigate to auth
  router.replace('/auth');
};

const usePeriodSummary = (period) => {
  return useQuery({
    queryKey: ['periodSummary', period.startDate.toISOString(), period.endDate.toISOString()],
    queryFn: async () => {
      const response = await apiCall(`/api/summary/period/?start_date=${period.startDate.toISOString()}&end_date=${period.endDate.toISOString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Period summary API error:', response.status, errorText);
        throw new Error(`Failed to fetch period summary: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onError: async (error) => {
      if (error instanceof SessionExpiredError) {
        await triggerSessionExpired();
      }
    },
  });
};

export default usePeriodSummary;
