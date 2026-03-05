import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTimeSlots(month: string) {
  return useQuery({
    queryKey: [api.timeSlots.list.path, month],
    queryFn: async () => {
      const url = `${api.timeSlots.list.path}?month=${encodeURIComponent(month)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch time slots");
      return api.timeSlots.list.responses[200].parse(await res.json());
    },
  });
}

export function useBulkSaveSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { date: string; slots: { startTime: string; endTime: string }[] }) => {
      const validated = api.timeSlots.bulkSave.input.parse(data);
      const res = await fetch(api.timeSlots.bulkSave.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }
      return api.timeSlots.bulkSave.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      const month = variables.date.substring(0, 7);
      queryClient.invalidateQueries({ queryKey: [api.timeSlots.list.path, month] });
    },
  });
}
