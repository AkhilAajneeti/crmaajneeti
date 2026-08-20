import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchLeads, fetchLeadsCount, fetchNewLeads } from "services/leads.service"

export const useLeads = () => {
    return useQuery({
        queryKey: ["leads"],
        queryFn: () => fetchLeads(),
        placeholderData: keepPreviousData,
    })
}

//use my month & filter dash board
export const useLeadsCount = (filters) => {
    return useQuery({
        queryKey: ["leads-count", filters], // 🔥 important for caching
        queryFn: () => fetchLeadsCount(filters),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5, // cache 5 min
        gcTime: 1000 * 60 * 30, // keep in memory 30 min (v5 name; was cacheTime)
    });
};
export const useNewLeads = ({ limit, page, filters, sort }) => {
    return useQuery({
        queryKey: ["leads", limit, page, JSON.stringify(filters), JSON.stringify(sort)],
        queryFn: () => fetchNewLeads({ limit, page, filters, sort }),
        placeholderData: keepPreviousData,
    })
}
