import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createWorkplacePost, fetchWorkPlace, fetchWorkPlaceById, updateWorkplacePost, workplaceActivitesById, workplaceStreamById, workPlaceSubscription, workPlaceUnsubscribe } from "services/workplace.service"

export const useWorkPlace = ({ limit, page, filters }) => {
    return useQuery({
        queryKey: ["workplace", page, limit, filters],
        queryFn: () => fetchWorkPlace({ limit, page, filters }),
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
        queryKey: ["workplace-stream", leadId],
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

//activity
export const useworkplaceActivity = (leadId, isOpen) => {
    return useQuery({
        queryKey: ["workplace-activity", leadId],
        queryFn: () => workplaceActivitesById(leadId),
        enabled: !!leadId && isOpen,
    });
};
// --------------- Stream posts ---------------
// Workplace-only: the leads stream hooks are a separate cache entry and a
// separate entity, so nothing here reaches into them.
//
// Both mutations refresh ["workplace-stream", noteId], which is the key
// useworkplaceStream reads from.
export const useCreateWorkplacePost = (noteId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (post) => createWorkplacePost({ noteId, post }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["workplace-stream", noteId],
            });
        },
    });
};

export const useUpdateWorkplacePost = (noteId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, post }) => updateWorkplacePost({ postId, post }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["workplace-stream", noteId],
            });
        },
    });
};
