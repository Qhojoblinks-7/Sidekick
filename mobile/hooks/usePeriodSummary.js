import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../services/apiService';

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
  });
};

export default usePeriodSummary;