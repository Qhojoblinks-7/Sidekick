import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../services/apiService';

const usePeriodSummary = (period) => {
  return useQuery({
    queryKey: ['periodSummary', period.startDate.toISOString(), period.endDate.toISOString()],
    queryFn: async () => {
      const response = await apiCall(`/api/summary/period/?start_date=${period.startDate.toISOString()}&end_date=${period.endDate.toISOString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch period summary');
      }
      return response.json();
    },
  });
};

export default usePeriodSummary;