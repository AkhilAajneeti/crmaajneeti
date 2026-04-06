import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchcalenderDetails } from "services/calender.service"

export const useCalender = ({limit,page,startDate,endDate}) => {
    return useQuery({
        queryKey: ["calender",page,limit,startDate,endDate],
        queryFn: ()=>fetchcalenderDetails({limit,page,startDate,endDate}),
        placeholderData: keepPreviousData,
    })
}