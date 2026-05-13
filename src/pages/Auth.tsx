import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { Music2, Sparkles, Mic2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const data = await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, name, password }),
        });
        setToken(data.token);
        setUser(data.user);
      } else {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        setUser(data.user);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-10rem)] -mx-6 -my-6 px-6 overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[15%] left-[10%] h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute bottom-[15%] right-[10%] h-72 w-72 rounded-full bg-secondary/20 blur-3xl animate-blob-delay-2" />
        <div className="absolute top-[50%] right-[30%] h-48 w-48 rounded-full bg-primary/10 blur-3xl animate-blob-delay-4" />
      </div>

      <div className="relative w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <Music2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-primary bg-clip-text text-transparent animate-shimmer">
            Pulsefy
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "login"
              ? "Welcome back — pick up where you left off."
              : "Join thousands of creators building with AI music."}
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[
            { icon: Sparkles, label: "AI Picks" },
            { icon: Mic2,     label: "Sound Studio" },
            { icon: Music2,   label: "Vast Library" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground">
              <Icon className="h-3 w-3 text-primary" />
              {label}
            </div>
          ))}
        </div>

        {/* Form card */}
        <Card className="p-7 bg-gradient-card border-border/80 shadow-2xl">
          <div className="space-y-1 mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Enter your credentials to continue."
                : "Takes less than a minute."}
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Minimum 6 characters" : "Your password"}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary font-semibold h-11" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Card>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            className="text-primary font-medium hover:underline"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
