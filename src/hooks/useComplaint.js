import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchComplainById, fetchComplaints } from "services/complaint.service"

export const useComplaint = ({ limit, page, filters }) => {
    return useQuery({
        queryKey: ["complaint", page, limit, filters],
        queryFn: () => fetchComplaints({ limit, page, filters }),
        placeholderData: keepPreviousData,
    })
}
export const useComplaintById = (id, mode) => {

    return useQuery({
        queryKey: ["complaint", id],
        queryFn: () => fetchComplainById(id),
        enabled: !!id && mode === "view",
    })
}