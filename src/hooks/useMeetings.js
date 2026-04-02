import { useQuery } from "@tanstack/react-query";
import { fetchMeeting } from "services/meeting.service";

export const useMeetings = () => {
  return useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeeting,
    staleTime: 1000 * 60 * 5,
  });
};