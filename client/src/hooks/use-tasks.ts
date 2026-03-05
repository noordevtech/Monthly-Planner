import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApiPaths } from "@shared/routes";

export function useTasks(clientId: number, date: string) {
  const paths = clientApiPaths(clientId);
  return useQuery({
    queryKey: [paths.tasks.list, date],
    queryFn: async () => {
      const url = `${paths.tasks.list}?date=${encodeURIComponent(date)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
}

export function useCreateTask(clientId: number) {
  const queryClient = useQueryClient();
  const paths = clientApiPaths(clientId);
  return useMutation({
    mutationFn: async (data: { date: string; title: string }) => {
      const res = await fetch(paths.tasks.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [paths.tasks.list, variables.date] });
    },
  });
}

export function useUpdateTask(clientId: number) {
  const queryClient = useQueryClient();
  const paths = clientApiPaths(clientId);
  return useMutation({
    mutationFn: async ({ id, date, ...updates }: { id: number; date: string; title?: string; completed?: boolean }) => {
      const res = await fetch(paths.tasks.update(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: [paths.tasks.list, result.date] });
    },
  });
}

export function useDeleteTask(clientId: number) {
  const queryClient = useQueryClient();
  const paths = clientApiPaths(clientId);
  return useMutation({
    mutationFn: async ({ id, date }: { id: number; date: string }) => {
      const res = await fetch(paths.tasks.delete(id), {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return { date };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [paths.tasks.list, result.date] });
    },
  });
}
