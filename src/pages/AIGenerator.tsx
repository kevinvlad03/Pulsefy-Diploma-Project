import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mic2,
  Sparkles,
  Clock3,
  Music2,
  Loader2,
  Play,
  Pause,
  RefreshCcw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE, apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { usePlayer, type PlayerTrack } from "@/lib/player";

type Generation = {
  id: string;
  prompt: string;
  lyrics: string | null;
  audio_url: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

const AD_FORMATS = [
  { label: "TikTok", duration: "8", desc: "8s — snappy hook" },
  { label: "Instagram Reel", duration: "12", desc: "12s — product intro" },
  { label: "YouTube Bumper", duration: "16", desc: "16s — brand moment" },
  { label: "YouTube Pre-roll", duration: "30", desc: "30s — full story" },
];

const MUSIC_STYLES = [
  { label: "Upbeat & Commercial", value: "upbeat commercial pop with bright synths and punchy beat" },
  { label: "Cinematic / Epic", value: "epic cinematic orchestral with rising tension and powerful drums" },
  { label: "Lo-fi & Relaxed", value: "melodic lo-fi hip hop with warm vinyl texture and mellow piano" },
  { label: "Electronic / EDM", value: "energetic EDM drop with driving bass and festival synths" },
  { label: "Acoustic & Warm", value: "acoustic guitar with warm fingerpicking and soft ambient pads" },
  { label: "Dark & Dramatic", value: "dark ambient with deep bass pulses and eerie atmospheric layers" },
];

const MODEL_OPTIONS = [
  { label: "MusicGen Small (fast)", value: "facebook/musicgen-small" },
  { label: "MusicGen Medium (balanced)", value: "facebook/musicgen-medium" },
  { label: "MusicGen Large (best quality)", value: "facebook/musicgen-large" },
];

export default function SoundStudio() {
  const token = getToken();
  const queryClient = useQueryClient();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const [prompt, setPrompt] = useState("");
  const [durationSec, setDurationSec] = useState("8");
  const [model, setModel] = useState("facebook/musicgen-small");

  const generationsQuery = useQuery({
    queryKey: ["ai-generations"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/ai/generations");
      return (res.generations || []) as Generation[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const cleanPrompt = prompt.trim();
      if (cleanPrompt.length < 6) {
        throw new Error("Prompt must have at least 6 characters.");
      }
      const payload: { prompt: string; durationSec?: number; model?: string } = {
        prompt: cleanPrompt,
      };
      const parsedDuration = Number(durationSec);
      if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
        payload.durationSec = parsedDuration;
      }
      if (model.trim()) {
        payload.model = model.trim();
      }
      return apiFetch("/ai/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      setPrompt("");
      await queryClient.invalidateQueries({ queryKey: ["ai-generations"] });
    },
  });

  const playableTracks = useMemo(() => {
    const generations = generationsQuery.data || [];
    return generations
      .filter((g) => g.status === "completed" && Boolean(g.audio_url))
      .map((g, i) => toPlayerTrack(g, i + 1));
  }, [generationsQuery.data]);

  const completedCount = playableTracks.length;
  const failedCount = (generationsQuery.data || []).filter((g) => g.status === "failed").length;
  const pendingCount = (generationsQuery.data || []).filter((g) => g.status === "pending").length;

  if (!token) {
    return (
      <Card className="relative overflow-hidden p-8 md:p-10 bg-gradient-card border-border">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative space-y-5">
          <Badge className="bg-primary/15 text-primary border-primary/40">Sound Studio</Badge>
          <h1 className="text-4xl font-bold leading-tight">
            Sign in to create music with{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Sound Studio</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Generate original tracks and ad music — copyright-free, instantly playable in Pulsefy.
          </p>
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary/90 shadow-glow-primary">
              Sign in to get started
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="relative overflow-hidden p-7 md:p-8 border-border bg-gradient-card">
        <div className="absolute -top-20 right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/15 text-primary border-primary/40">Sound Studio</Badge>
              <Badge variant="outline" className="text-muted-foreground text-xs">Powered by MusicGen</Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Mic2 className="h-8 w-8 text-primary" />
              Sound Studio
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Generate original, copyright-free music for ads, content, and creative projects. Pick a format, describe your sound, and create.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <StatCard label="Completed" value={completedCount} color="secondary" />
            <StatCard label="Pending" value={pendingCount} color="primary" />
            <StatCard label="Failed" value={failedCount} color="destructive" />
          </div>
        </div>
      </Card>

      {/* Ad Format Quick-Select */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Ad Format Presets</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AD_FORMATS.map((fmt) => (
            <button
              key={fmt.label}
              type="button"
              onClick={() => setDurationSec(fmt.duration)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all hover:border-primary/60 hover:bg-primary/5",
                durationSec === fmt.duration
                  ? "border-primary bg-primary/10 shadow-glow-primary"
                  : "border-border bg-card/60"
              )}
            >
              <p className="font-semibold text-foreground text-sm">{fmt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{fmt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generator form + sidebar */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-6 md:p-7 border-border bg-card/90">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Mic2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create Track</h2>
              <p className="text-sm text-muted-foreground">Describe the sound and generate.</p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              generateMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="musicgen-prompt">Describe your music</Label>
              <Textarea
                id="musicgen-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. upbeat commercial pop with bright synths for a product launch ad"
                className="min-h-[120px] bg-background/60 border-border"
              />
              <p className="text-xs text-muted-foreground">Be specific about mood, instruments, energy, and context for best results.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={durationSec} onValueChange={setDurationSec}>
                  <SelectTrigger id="duration" className="bg-background/60 border-border">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[4, 8, 12, 16, 24, 30].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model Quality</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model" className="bg-background/60 border-border">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {generateMutation.isError && (
              <Card className="p-3 border-destructive/60 bg-destructive/10 text-sm text-destructive">
                {generateMutation.error instanceof Error
                  ? generateMutation.error.message
                  : "Music generation failed."}
              </Card>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Track
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border-border bg-gradient-card">
            <h3 className="text-lg font-semibold">Style Presets</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click to use as your prompt base.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MUSIC_STYLES.map((style) => (
                <button
                  key={style.label}
                  type="button"
                  onClick={() => setPrompt(style.value)}
                  className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  {style.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-border bg-card/90 space-y-3">
            <div className="flex items-start gap-3">
              <Clock3 className="h-5 w-5 mt-0.5 text-secondary" />
              <div>
                <h3 className="text-base font-semibold">Generation Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Runs on CPU — small model is fastest. Results appear in history after completion.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-border bg-background/70"
              onClick={() => generationsQuery.refetch()}
              disabled={generationsQuery.isFetching}
            >
              <RefreshCcw className={cn("h-4 w-4", generationsQuery.isFetching && "animate-spin")} />
              Refresh History
            </Button>
          </Card>
        </div>
      </div>

      {/* Generation history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Recent Generations</h2>
          <Badge variant="outline" className="text-muted-foreground">
            {(generationsQuery.data || []).length} total
          </Badge>
        </div>

        {generationsQuery.isLoading && (
          <Card className="p-4 border-border bg-card text-sm text-muted-foreground">
            Loading generations...
          </Card>
        )}

        {generationsQuery.isError && (
          <Card className="p-4 border-destructive/50 bg-destructive/10 text-sm text-destructive">
            Failed to load generation history.
          </Card>
        )}

        {!generationsQuery.isLoading &&
          !generationsQuery.isError &&
          (generationsQuery.data || []).length === 0 && (
            <Card className="p-8 border-border bg-card text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Music2 className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">No tracks generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a format above, write a prompt, and create your first track.
              </p>
            </Card>
          )}

        <div className="grid gap-4">
          {(generationsQuery.data || []).map((generation, index) => {
            const playableTrack = toPlayerTrack(generation, index + 1);
            const canPlay = Boolean(playableTrack.audio_url) && generation.status === "completed";
            const isCurrentTrack = currentTrack?.id === playableTrack.id;
            return (
              <Card key={generation.id} className="p-5 border-border bg-gradient-card">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusBadgeClass(generation.status)}>
                        {generation.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(generation.created_at)}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prompt</p>
                      <p className="text-foreground break-words">{generation.prompt}</p>
                    </div>
                    {generation.lyrics && (
                      <div>
                        <p className="text-sm text-muted-foreground">Lyrics</p>
                        <p className="text-foreground whitespace-pre-wrap break-words text-sm">
                          {generation.lyrics}
                        </p>
                      </div>
                    )}
                  </div>

                  {canPlay ? (
                    <Button
                      className="bg-primary hover:bg-primary/90 md:self-center shrink-0"
                      onClick={() => playTrack(playableTrack, playableTracks)}
                    >
                      {isCurrentTrack && isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Play
                        </>
                      )}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="md:self-center text-muted-foreground shrink-0">
                      {generation.status === "pending" ? "Generating..." : "No audio"}
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function toPlayerTrack(generation: Generation, index: number): PlayerTrack {
  return {
    id: `ai-${generation.id}`,
    title: summarizePrompt(generation.prompt, index),
    artist: "Pulsefy Sound Studio",
    album: "Generated Tracks",
    duration_sec: 0,
    genre: "AI",
    audio_url: toAbsoluteUrl(generation.audio_url),
    image_url: null,
    license_url: null,
  };
}

function summarizePrompt(prompt: string, index: number) {
  const value = prompt.trim();
  if (!value) return `Generated Track #${index}`;
  return value.length > 64 ? `${value.slice(0, 64)}...` : value;
}

function toAbsoluteUrl(audioUrl: string | null) {
  if (!audioUrl) return null;
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) return audioUrl;
  return `${API_BASE}${audioUrl.startsWith("/") ? audioUrl : `/${audioUrl}`}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusBadgeClass(status: Generation["status"]) {
  switch (status) {
    case "completed":
      return "bg-secondary/15 text-secondary border-secondary/40";
    case "pending":
      return "bg-primary/15 text-primary border-primary/40";
    case "failed":
      return "bg-destructive/15 text-destructive border-destructive/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: "primary" | "secondary" | "destructive" }) {
  const colorClass = {
    primary: "text-primary",
    secondary: "text-secondary",
    destructive: "text-destructive",
  }[color];
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold", colorClass)}>{value}</p>
    </div>
  );
}
