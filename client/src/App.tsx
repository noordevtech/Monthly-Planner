import { Switch, Route, Link, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Calendar, ListTodo, FileText, ArrowLeft, Users } from "lucide-react";
import NotFound from "@/pages/not-found";
import ClientsView from "@/pages/ClientsView";
import CalendarView from "@/pages/CalendarView";
import TasksView from "@/pages/TasksView";
import MonthlyReportsView from "@/pages/MonthlyReportsView";
import { type Client } from "@shared/schema";

function ClientNavBar({ clientId }: { clientId: number }) {
  const [location] = useLocation();
  const base = `/clients/${clientId}`;

  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
  });

  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-border bg-card">
      <Link
        href="/"
        data-testid="link-back-clients"
        className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Clients
      </Link>
      <span className="text-muted-foreground mr-3 text-sm font-medium">
        {client?.name || "..."}
      </span>
      <Link
        href={`${base}/calendar`}
        data-testid="link-calendar"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          location === `${base}/calendar` ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </Link>
      <Link
        href={`${base}/tasks`}
        data-testid="link-tasks"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          location === `${base}/tasks` ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <ListTodo className="w-4 h-4" />
        Tasks
      </Link>
      <Link
        href={`${base}/reports`}
        data-testid="link-reports"
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          location === `${base}/reports` ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <FileText className="w-4 h-4" />
        Reports
      </Link>
    </nav>
  );
}

function ClientCalendarPage() {
  const [, params] = useRoute("/clients/:id/calendar");
  const clientId = Number(params?.id);
  if (!clientId) return <NotFound />;
  return (
    <>
      <ClientNavBar clientId={clientId} />
      <CalendarView clientId={clientId} />
    </>
  );
}

function ClientTasksPage() {
  const [, params] = useRoute("/clients/:id/tasks");
  const clientId = Number(params?.id);
  if (!clientId) return <NotFound />;
  return (
    <>
      <ClientNavBar clientId={clientId} />
      <TasksView clientId={clientId} />
    </>
  );
}

function ClientReportsPage() {
  const [, params] = useRoute("/clients/:id/reports");
  const clientId = Number(params?.id);
  if (!clientId) return <NotFound />;
  return (
    <>
      <ClientNavBar clientId={clientId} />
      <MonthlyReportsView clientId={clientId} />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ClientsView} />
      <Route path="/clients/:id/calendar" component={ClientCalendarPage} />
      <Route path="/clients/:id/tasks" component={ClientTasksPage} />
      <Route path="/clients/:id/reports" component={ClientReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
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
