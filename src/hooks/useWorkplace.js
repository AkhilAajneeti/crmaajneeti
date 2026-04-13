import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchWorkPlace, fetchWorkPlaceById, workplaceStreamById, workPlaceSubscription, workPlaceUnsubscribe } from "services/workplace.service"

export const useWorkPlace = ({ limit, page, filters}) => {
    return useQuery({
        queryKey: ["workplace", page, limit,filters],
        queryFn: () => fetchWorkPlace({ limit, page,filters }),
        placeholderData: keepPreviousData,
    })
}
export const useWorkPlaceById = (id, isOpen) => {
    console.log(id);

    return useQuery({
        queryKey: ["workplaceById", id],
        queryFn: () => fetchWorkPlaceById({ id }),
        enabled: !!id && isOpen,
    })
}
export const useworkplaceStream = (leadId, isOpen) => {
  return useQuery({
    queryKey: ["lead-stream", leadId],
    queryFn: () => workplaceStreamById(leadId),
    enabled: !!leadId && isOpen,
  });
};
// use mutation for post


export const useWorkPlaceSubs = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isFollowed }) => {
            return isFollowed
                ? workPlaceUnsubscribe({ id })
                : workPlaceSubscription({ id });
        },

        // ⚡ instant UI update
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries(["workplaceById", id]);

            const previousData = queryClient.getQueryData(["workplaceById", id]);

            if (previousData) {
                queryClient.setQueryData(["workplaceById", id], {
                    ...previousData,
                    isFollowed: !previousData.isFollowed,
                });
            }

            return { previousData };
        },

        // ❌ rollback if error
        onError: (_, variables, context) => {
            queryClient.setQueryData(
                ["workplaceById", variables.id],
                context.previousData
            );
        },

        // 🔄 sync with backend (NO delay feeling)
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["workplaceById", variables.id]);
        },
    });
};