import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query"
import {
    fetchAccountById,
    fetchAccounts,
    fetchAccountsCountByType,
} from "services/account.service"

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

// One count query per account type, cached independently. These are
// maxSize=1 requests, so each costs a single row of payload; a long
// staleTime keeps them from refiring every time the list page changes.
export const useAccountTypeCounts = (types = []) => {
    const results = useQueries({
        queries: types.map((type) => ({
            queryKey: ["accounts", "count", type],
            queryFn: () => fetchAccountsCountByType(type),
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        })),
    })

    return {
        counts: types.reduce(
            (acc, type, i) => ({ ...acc, [type]: results[i]?.data ?? 0 }),
            {},
        ),
        isLoading: results.some((r) => r.isLoading),
    }
}
