import { useQuery } from '@tanstack/react-query'
import { fetchAccountType, fetchSources, fetchStatus } from 'services/others.service';

export const useMetaData = () => {
    return useQuery({
        queryKey: ["meta"],
        queryFn: async () => {
            const [sources, status, ,types] = await Promise.all([
                fetchSources(),
                fetchStatus(),
                fetchAccountType(),
            ]);

            return {
                sources: sources.options || [],
                status: status.options || [],
                type: types.options || [],
            };
        },
        staleTime: 10 * 60 * 1000,
    });
}
