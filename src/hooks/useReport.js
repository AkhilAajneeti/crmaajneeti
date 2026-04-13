import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchreportLeads } from "services/report.service"

export const useReport = ({ limit, page, filters }) => {
    return useQuery({
        queryKey: ["report", limit, page, filters],
        queryFn: () => fetchreportLeads({ limit, page, filters }),
        placeholderData: keepPreviousData,
    })
}
