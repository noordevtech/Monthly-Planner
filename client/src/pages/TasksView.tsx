import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { type Task } from "@shared/schema";

export default function TasksView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const { data: tasks, isLoading } = useTasks(dateStr);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  const goToToday = () => setCurrentDate(new Date());
  const prevDay = () => setCurrentDate(subDays(currentDate, 1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));

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

  const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
  const completedCount = tasks?.filter(t => t.completed).length || 0;
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
            {tasks?.map((task) => (
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
      </div>
    </div>
  );
}
