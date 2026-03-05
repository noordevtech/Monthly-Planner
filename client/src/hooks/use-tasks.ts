import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useTasks(date: string) {
  return useQuery({
    queryKey: [api.tasks.list.path, date],
    queryFn: async () => {
      const url = `${api.tasks.list.path}?date=${encodeURIComponent(date)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { date: string; title: string }) => {
      const res = await fetch(api.tasks.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, variables.date] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, ...updates }: { id: number; date: string; title?: string; completed?: boolean }) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, result.date] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date }: { id: number; date: string }) => {
      const url = buildUrl(api.tasks.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return { date };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path, result.date] });
    },
  });
}
