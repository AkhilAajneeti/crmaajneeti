// hooks/useUsers.js
import { useQuery } from "@tanstack/react-query";
import { fetchProfileDetail, fetchProfiles, fetchUser, fetchUserById } from "services/user.service";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};
export const useProfiles = () => {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};
export const useUserById = (id,isopen) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => fetchUserById(id),
    staleTime: 1000 * 60 * 5, // 5 min cache
    enabled: !!id && isopen,
  });
};
export const useProfileById = (id,isopen) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => fetchProfileDetail(id),
    staleTime: 1000 * 60 * 5, // 5 min cache
    enabled: !!id && isopen,
  });
};