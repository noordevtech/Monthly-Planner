import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Circle, FileText, Loader2, Pencil, X, Save, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { type Task, type Report } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { clientApiPaths } from "@shared/routes";

interface TasksViewProps {
  clientId: number;
}

export default function TasksView({ clientId }: TasksViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState("");

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const { data: tasks, isLoading } = useTasks(clientId, dateStr);
  const createTask = useCreateTask(clientId);
  const updateTask = useUpdateTask(clientId);
  const deleteTask = useDeleteTask(clientId);
  const { toast } = useToast();
  const paths = clientApiPaths(clientId);
  const queryClient = useQueryClient();

  const reportQueryKey = [paths.reports.byDate, dateStr];

  const { data: savedReport, isLoading: isLoadingReport } = useQuery<Report | null>({
    queryKey: reportQueryKey,
    queryFn: async () => {
      const res = await fetch(`${paths.reports.byDate}?date=${encodeURIComponent(dateStr)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const res = await apiRequest("PATCH", paths.reports.update(id), { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportQueryKey });
      setIsEditing(false);
      toast({ title: "Saved", description: "Report updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", paths.reports.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportQueryKey });
      toast({ title: "Deleted", description: "Report deleted." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const goToToday = () => { setCurrentDate(new Date()); setIsEditing(false); };
  const prevDay = () => { setCurrentDate(subDays(currentDate, 1)); setIsEditing(false); };
  const nextDay = () => { setCurrentDate(addDays(currentDate, 1)); setIsEditing(false); };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", paths.tasks.report, { date: dateStr });
      await res.json();
      queryClient.invalidateQueries({ queryKey: reportQueryKey });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate report", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    createTask.mutate(
      { date: dateStr, title },
      {
        onSuccess: () => {
          setNewTaskTitle("");
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleToggle = (task: Task) => {
    updateTask.mutate({ id: task.id, date: task.date, completed: !task.completed });
  };

  const handleDelete = (task: Task) => {
    deleteTask.mutate({ id: task.id, date: task.date });
  };

  const startEditing = () => {
    if (savedReport) {
      setEditContent(savedReport.content);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const saveEdit = () => {
    if (!savedReport || !editContent.trim()) return;
    updateReportMutation.mutate({ id: savedReport.id, content: editContent.trim() });
  };

  const handleDeleteReport = () => {
    if (!savedReport) return;
    deleteReportMutation.mutate(savedReport.id);
  };

  const handleCopyReport = async () => {
    if (!savedReport) return;
    const content = savedReport.content;
    const html = content
      .split('\n')
      .map(line => {
        if (line.trim() === '---') return '<hr>';
        const withBold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<p style="margin:0 0 4px 0">${withBold}</p>`;
      })
      .join('');

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([content.replace(/\*\*/g, '')], { type: 'text/plain' }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(content.replace(/\*\*/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
  const completedCount = tasks?.filter((t: Task) => t.completed).length || 0;
  const totalCount = tasks?.length || 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button data-testid="button-prev-day" size="icon" variant="ghost" onClick={prevDay}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-[260px] text-center">
            <h1 data-testid="text-date-header" className="text-xl md:text-2xl font-bold tracking-wide text-foreground select-none">
              {format(currentDate, "EEEE, MMMM d, yyyy")}
            </h1>
          </div>
          <Button data-testid="button-next-day" size="icon" variant="ghost" onClick={nextDay}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {!isToday && (
            <Button data-testid="button-go-today" variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          )}
          <div data-testid="text-task-count" className="px-4 py-2 rounded-md bg-muted text-sm font-medium">
            {completedCount}/{totalCount} completed
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
          <input
            data-testid="input-new-task"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button data-testid="button-add-task" type="submit" disabled={createTask.isPending || !newTaskTitle.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </form>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading tasks...</div>
        ) : tasks && tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium">No tasks for this day</p>
            <p className="text-sm mt-1">Add your first task above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks?.map((task: Task) => (
              <div
                key={task.id}
                data-testid={`task-item-${task.id}`}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-card
                  transition-colors duration-150
                  ${task.completed ? "opacity-60" : ""}
                `}
              >
                <button
                  data-testid={`button-toggle-task-${task.id}`}
                  onClick={() => handleToggle(task)}
                  className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {task.completed ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <span
                  data-testid={`text-task-title-${task.id}`}
                  className={`flex-1 text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {task.title}
                </span>

                <Button
                  data-testid={`button-delete-task-${task.id}`}
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(task)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <Button
              data-testid="button-generate-report"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              variant="outline"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {savedReport ? "Regenerate AI Report" : "Generate AI Report"}
                </>
              )}
            </Button>
          </div>
        )}

        {isLoadingReport ? (
          <div className="mt-4 text-center text-muted-foreground text-sm">Loading report...</div>
        ) : savedReport && (
          <div data-testid="report-section" className="mt-4 border border-border rounded-md bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">AI Report</span>
              </div>
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <>
                    <Button
                      data-testid="button-save-report"
                      size="sm"
                      variant="ghost"
                      onClick={saveEdit}
                      disabled={updateReportMutation.isPending || !editContent.trim()}
                    >
                      {updateReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      data-testid="button-cancel-edit-report"
                      size="sm"
                      variant="ghost"
                      onClick={cancelEditing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      data-testid="button-copy-report"
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyReport}
                    >
                      {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      data-testid="button-edit-report"
                      size="sm"
                      variant="ghost"
                      onClick={startEditing}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid="button-delete-report"
                      size="sm"
                      variant="ghost"
                      onClick={handleDeleteReport}
                      disabled={deleteReportMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                data-testid="textarea-edit-report"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-4 text-sm leading-relaxed bg-background border-0 focus:outline-none focus:ring-0 resize-y min-h-[120px]"
              />
            ) : (
              <div data-testid="text-ai-report" className="p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {savedReport.content.split('\n').map((line, i) => {
                  if (line.trim() === '---') {
                    return <hr key={i} className="my-3 border-border" />;
                  }
                  const boldParsed = line.split(/\*\*(.*?)\*\*/).map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  );
                  return <span key={i}>{boldParsed}{'\n'}</span>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
