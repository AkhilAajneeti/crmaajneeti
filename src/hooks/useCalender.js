import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchAttendanceById, fetchAttendStreamById, fetchcalenderDetails } from "services/calender.service"

export const useCalender = ({ limit, page, filters }) => {
    return useQuery({
        queryKey: ["calender", page, limit, filters],
        queryFn: () => fetchcalenderDetails({ limit, page, filters }),
        placeholderData: keepPreviousData,
    })
}
export const useCalenderById = (id) => {
    return useQuery({
        queryKey: ["calenderById", id],
        queryFn: () => fetchAttendanceById(id),
        placeholderData: keepPreviousData,
    })
}

export const useCalenderStream = (leadId, isOpen, activeTab) => {
  return useQuery({
    queryKey: ["calender-stream", leadId],

    queryFn: () => fetchAttendStreamById(leadId),

    enabled: !!leadId && isOpen && activeTab === "stream", // 🔥 IMPORTANT

    // select: (data) => data?.list || [], // cleaner
  });
};