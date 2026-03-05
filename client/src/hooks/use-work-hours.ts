import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApiPaths } from "@shared/routes";

export function useTimeSlots(clientId: number, month: string) {
  const paths = clientApiPaths(clientId);
  return useQuery({
    queryKey: [paths.timeSlots.list, month],
    queryFn: async () => {
      const url = `${paths.timeSlots.list}?month=${encodeURIComponent(month)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch time slots");
      return res.json();
    },
  });
}

export function useBulkSaveSlots(clientId: number) {
  const queryClient = useQueryClient();
  const paths = clientApiPaths(clientId);

  return useMutation({
    mutationFn: async (data: { date: string; slots: { startTime: string; endTime: string }[] }) => {
      const res = await fetch(paths.timeSlots.bulkSave, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      const month = variables.date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: [paths.timeSlots.list, month] });
    },
  });
}
