import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchAccountById, fetchAccounts } from "services/account.service"

export const useAccounts = ({limit,page}) => {
    return useQuery({
        queryKey: ["accounts",page,limit],
        queryFn: ()=>fetchAccounts({limit,page}),
        placeholderData: keepPreviousData,
    })
}
export const useAccountById = (id) => {
    return useQuery({
        queryKey: ["accounts",id],
        queryFn: ()=>fetchAccountById(id),
        placeholderData: keepPreviousData,
    })
}
