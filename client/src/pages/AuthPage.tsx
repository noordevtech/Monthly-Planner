import { useState } from "react";
import { Calendar, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, register } = useAuth();
  const { toast } = useToast();

  const isPending = login.isPending || register.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { username: username.trim(), password };

    if (!data.username || !data.password) return;

    const mutation = isLogin ? login : register;
    mutation.mutate(data, {
      onError: (err: Error) => {
        toast({ title: "Error", description: err.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Work Calendar</h1>
        </div>

        <div className="border border-border rounded-lg bg-card p-6 shadow-sm">
          <h2 data-testid="text-auth-title" className="text-xl font-semibold text-foreground mb-6 text-center">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
                Username
              </label>
              <input
                data-testid="input-username"
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                data-testid="input-password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            <Button
              data-testid="button-auth-submit"
              type="submit"
              disabled={isPending || !username.trim() || !password}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              data-testid="button-toggle-auth"
              type="button"
              onClick={() => { setIsLogin(!isLogin); setUsername(""); setPassword(""); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
