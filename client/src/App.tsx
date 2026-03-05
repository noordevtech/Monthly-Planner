import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Calendar, ListTodo } from "lucide-react";
import NotFound from "@/pages/not-found";
import CalendarView from "@/pages/CalendarView";
import TasksView from "@/pages/TasksView";

function NavBar() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card">
      <Link
        href="/"
        data-testid="link-calendar"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          location === "/" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </Link>
      <Link
        href="/tasks"
        data-testid="link-tasks"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          location === "/tasks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <ListTodo className="w-4 h-4" />
        Tasks
      </Link>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={CalendarView} />
      <Route path="/tasks" component={TasksView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <div className="flex-1 flex flex-col">
            <Router />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
