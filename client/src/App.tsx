import { Switch, Route, Link, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Calendar, ListTodo, FileText, ArrowLeft, LogOut, Settings, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import ClientsView from "@/pages/ClientsView";
import CalendarView from "@/pages/CalendarView";
import TasksView from "@/pages/TasksView";
import MonthlyReportsView from "@/pages/MonthlyReportsView";
import SettingsView from "@/pages/SettingsView";
import { useAuth } from "@/hooks/use-auth";
import { type Client } from "@shared/schema";

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Calendar className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Work Calendar</h1>
        </div>
        <p className="text-muted-foreground mb-8 text-lg">
          Manage your clients, track work hours, and generate AI-powered daily reports.
        </p>
        <a
          href="/api/login"
          data-testid="button-login"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-md bg-primary text-primary-foreground font-medium text-lg hover:bg-primary/90 transition-colors"
        >
          <KeyRound className="w-5 h-5" />
          Sign In with Replit
        </a>
      </div>
    </div>
  );
}

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

function TopBar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email || "User";

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
      <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
        Work Calendar
      </Link>
      <div className="flex items-center gap-2">
        {user?.profileImageUrl && (
          <img
            src={user.profileImageUrl}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        )}
        <span data-testid="text-username" className="text-sm text-muted-foreground">
          {displayName}
        </span>
        <Link
          href="/settings"
          data-testid="link-settings"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            location === "/settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <Button
          data-testid="button-logout"
          size="sm"
          variant="ghost"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-1" />
          Sign Out
        </Button>
      </div>
    </header>
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

function AuthenticatedApp() {
  return (
    <>
      <TopBar />
      <Switch>
        <Route path="/" component={ClientsView} />
        <Route path="/settings" component={SettingsView} />
        <Route path="/clients/:id/calendar" component={ClientCalendarPage} />
        <Route path="/clients/:id/tasks" component={ClientTasksPage} />
        <Route path="/clients/:id/reports" component={ClientReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 flex flex-col">
            <AppRouter />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
