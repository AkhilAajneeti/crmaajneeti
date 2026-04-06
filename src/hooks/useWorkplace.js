import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchWorkPlace } from "services/workplace.service"

export const useWorkPlace = ({limit,page,startDate,endDate}) => {
    return useQuery({
        queryKey: ["workplace",page,limit,startDate,endDate],
        queryFn: ()=>fetchWorkPlace({limit,page,startDate,endDate}),
        placeholderData: keepPreviousData,
    })
}