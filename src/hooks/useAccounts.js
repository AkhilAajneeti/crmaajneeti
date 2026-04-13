import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchAccountById, fetchAccounts } from "services/account.service"

export const useAccounts = ({limit,page,filters}) => {
    return useQuery({
        queryKey: ["accounts",page,limit,filters],
        queryFn: ()=>fetchAccounts({limit,page,filters}),
        placeholderData: keepPreviousData,
    })
}
export const useAccountById = (id) => {
    return useQuery({
        queryKey: ["accounts",id],
        queryFn: ()=>fetchAccountById(id),
        enabled: !!id,
    })
}
