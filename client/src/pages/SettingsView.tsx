import { useState } from "react";
import { Settings, Key, Loader2, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SettingsView() {
  const { user, updateSettings } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) return;

    updateSettings.mutate(
      { openaiApiKey: key },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: "OpenAI API key updated successfully." });
          setApiKey("");
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleRemoveKey = () => {
    updateSettings.mutate(
      { openaiApiKey: null },
      {
        onSuccess: () => {
          toast({ title: "Removed", description: "OpenAI API key has been removed." });
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h1 data-testid="text-settings-header" className="text-xl md:text-2xl font-bold tracking-wide text-foreground">
          Settings
        </h1>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">OpenAI API Key</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Required for generating AI reports from your tasks. Your key is stored securely and only used for report generation.
            </p>
          </div>

          <div className="px-6 py-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                {user?.hasOpenaiKey ? (
                  <span data-testid="text-key-status" className="flex items-center gap-1 text-green-600 font-medium">
                    <Check className="w-4 h-4" />
                    API key configured
                  </span>
                ) : (
                  <span data-testid="text-key-status" className="text-amber-600 font-medium">
                    No API key set
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3">
              <div className="relative">
                <input
                  data-testid="input-openai-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={user?.hasOpenaiKey ? "Enter new key to replace existing one..." : "sk-..."}
                  className="w-full px-4 py-2 pr-10 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  data-testid="button-save-key"
                  type="submit"
                  disabled={updateSettings.isPending || !apiKey.trim()}
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  {user?.hasOpenaiKey ? "Update Key" : "Save Key"}
                </Button>
                {user?.hasOpenaiKey && (
                  <Button
                    data-testid="button-remove-key"
                    type="button"
                    variant="outline"
                    onClick={handleRemoveKey}
                    disabled={updateSettings.isPending}
                  >
                    Remove Key
                  </Button>
                )}
              </div>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              You can get an API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
