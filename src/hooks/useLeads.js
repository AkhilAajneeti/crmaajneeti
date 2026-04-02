import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchLeads, fetchNewLeads } from "services/leads.service"

export const useLeads = () => {
    return useQuery({
        queryKey: ["leads"],
        queryFn: ()=>fetchLeads(),
        placeholderData: keepPreviousData,
    })
}
export const useNewLeads = ({limit,page}) => {
    return useQuery({
        queryKey: ["leads",limit,page],
        queryFn: ()=>fetchNewLeads({limit,page}),
        placeholderData: keepPreviousData,
    })
}
