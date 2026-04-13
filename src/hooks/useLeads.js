import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchLeads, fetchLeadsCount, fetchNewLeads } from "services/leads.service"

export const useLeads = () => {
    return useQuery({
        queryKey: ["leads"],
        queryFn: ()=>fetchLeads(),
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
  });
};
export const useNewLeads = ({limit,page,filters}) => {
    return useQuery({
        queryKey: ["leads",limit,page,filters],
        queryFn: ()=>fetchNewLeads({limit,page,filters}),
        placeholderData: keepPreviousData,
    })
}
