import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

// Fetch work hours for a specific month
export function useWorkHours(month: string) {
  return useQuery({
    queryKey: [api.workHours.list.path, month],
    queryFn: async () => {
      const url = `${api.workHours.list.path}?month=${encodeURIComponent(month)}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) {
        throw new Error("Failed to fetch work hours");
      }
      
      const data = await res.json();
      return api.workHours.list.responses[200].parse(data);
    },
  });
}

// Upsert work hours for a specific day
export function useUpsertWorkHours() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.workHours.upsert.input>) => {
      const validated = api.workHours.upsert.input.parse(data);
      
      const res = await fetch(api.workHours.upsert.path, {
        method: api.workHours.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.workHours.upsert.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to save work hours");
      }
      
      return api.workHours.upsert.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate the query for the month that contains this date
      const month = data.date.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
      queryClient.invalidateQueries({ queryKey: [api.workHours.list.path, month] });
      queryClient.invalidateQueries({ queryKey: [api.workHours.list.path] });
    },
  });
}
