import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, Users, Pencil, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Client } from "@shared/schema";

const LANGUAGES = [
  "English", "French", "Spanish", "Portuguese", "German",
  "Italian", "Dutch", "Arabic", "Chinese", "Japanese",
  "Korean", "Russian", "Turkish", "Hindi", "Polish",
  "Swedish", "Norwegian", "Danish", "Finnish", "Czech",
];

export default function ClientsView() {
  const [newName, setNewName] = useState("");
  const [newLanguage, setNewLanguage] = useState("English");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLanguage, setEditLanguage] = useState("English");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const createClient = useMutation({
    mutationFn: async (data: { name: string; language: string }) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setNewName("");
      setNewLanguage("English");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, name, language }: { id: number; name: string; language: string }) => {
      const res = await apiRequest("PATCH", `/api/clients/${id}`, { name, language });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setEditingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createClient.mutate({ name, language: newLanguage });
  };

  const handleSaveEdit = (id: number) => {
    const name = editName.trim();
    if (!name) return;
    updateClient.mutate({ id, name, language: editLanguage });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h1 data-testid="text-clients-header" className="text-xl md:text-2xl font-bold tracking-wide text-foreground">
          Clients
        </h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            data-testid="input-new-client"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Client name..."
            className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            data-testid="select-new-language"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <Button data-testid="button-add-client" type="submit" disabled={createClient.isPending || !newName.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </form>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading clients...</div>
        ) : clients && clients.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No clients yet</p>
            <p className="text-sm mt-1">Add your first client above to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients?.map((client) => (
              <div
                key={client.id}
                data-testid={`client-item-${client.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-card transition-colors duration-150 hover:bg-muted/50"
              >
                {editingId === client.id ? (
                  <form
                    className="flex-1 flex gap-2 items-center"
                    onSubmit={(e) => { e.preventDefault(); handleSaveEdit(client.id); }}
                  >
                    <input
                      data-testid={`input-edit-client-${client.id}`}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <select
                      data-testid={`select-edit-language-${client.id}`}
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      className="px-2 py-1 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <Button data-testid={`button-save-edit-${client.id}`} size="sm" type="submit">Save</Button>
                    <Button data-testid={`button-cancel-edit-${client.id}`} size="sm" variant="outline" type="button" onClick={() => setEditingId(null)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <button
                      data-testid={`button-open-client-${client.id}`}
                      onClick={() => navigate(`/clients/${client.id}/calendar`)}
                      className="flex-1 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {client.name}
                    </button>
                    <span
                      data-testid={`text-client-language-${client.id}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded bg-muted"
                    >
                      <Globe className="w-3 h-3" />
                      {client.language}
                    </span>
                    <Button
                      data-testid={`button-edit-client-${client.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => { setEditingId(client.id); setEditName(client.name); setEditLanguage(client.language); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid={`button-delete-client-${client.id}`}
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteClient.mutate(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
