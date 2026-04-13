import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchAccountById, fetchAccounts } from "services/account.service"
import { fetchKnowledge, fetchKnowledgeById } from "services/knowledge.service"

export const useKnowledge = ({limit,page,filters}) => {
    return useQuery({
        queryKey: ["knowledgeBase",page,limit,filters],
        queryFn: ()=>fetchKnowledge({limit,page,filters}),
        placeholderData: keepPreviousData,
    })
}
export const useKnowledgeById = (id) => {
    return useQuery({
        queryKey: ["knowledgeBaseid",id],
        queryFn: ()=>fetchKnowledgeById(id),
        enabled: !!id,
    })
}
