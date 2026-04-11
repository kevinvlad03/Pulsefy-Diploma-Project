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

// Decorative waveform bar heights for the card art (16 bars)
const WAVEFORM_HEIGHTS = [30, 55, 70, 45, 85, 60, 40, 75, 50, 90, 35, 65, 80, 45, 60, 35];

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

          <Card className="p-6 border-border bg-card/90">
            <div className="flex items-start gap-3">
              <Clock3 className="h-5 w-5 mt-0.5 text-secondary" />
              <div>
                <h3 className="text-base font-semibold">Generation Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Runs on CPU — small model is fastest. Results appear in history after completion.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Generation history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Recent Generations</h2>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-muted-foreground">
              {(generationsQuery.data || []).length} total
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-border bg-background/70"
              onClick={() => generationsQuery.refetch()}
              disabled={generationsQuery.isFetching}
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", generationsQuery.isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>

        {generationsQuery.isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border bg-gradient-card overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {generationsQuery.isError && (
          <Card className="p-4 border-destructive/50 bg-destructive/10 text-sm text-destructive">
            Failed to load generation history.
          </Card>
        )}

        {!generationsQuery.isLoading &&
          !generationsQuery.isError &&
          (generationsQuery.data || []).length === 0 && (
            <Card className="p-10 border-border bg-gradient-card text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Music2 className="h-7 w-7 text-primary" />
              </div>
              <p className="font-semibold text-lg">No tracks yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Pick a format above, write a prompt, and create your first copyright-free track.
              </p>
            </Card>
          )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(generationsQuery.data || []).map((generation, index) => {
            const playableTrack = toPlayerTrack(generation, index + 1);
            const canPlay = generation.status === "completed" && Boolean(playableTrack.audio_url);
            const isActive = currentTrack?.id === playableTrack.id;
            const shortPrompt = generation.prompt.length > 60
              ? generation.prompt.slice(0, 60) + "…"
              : generation.prompt;

            return (
              <Card
                key={generation.id}
                className={cn(
                  "group border-border bg-gradient-card overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 duration-500",
                  canPlay && "hover:scale-[1.02] hover:shadow-glow-primary cursor-pointer",
                  isActive && "border-primary/50 shadow-glow-primary"
                )}
                style={{ animationDelay: `${index * 60}ms` }}
                onClick={() => canPlay && playTrack(playableTrack, playableTracks)}
              >
                {/* Art area */}
                <div className="relative h-40 bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center overflow-hidden">
                  {/* Decorative waveform bars */}
                  <div className="flex items-end gap-[3px] h-16 px-6 w-full">
                    {WAVEFORM_HEIGHTS.map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-full transition-all duration-300",
                          isActive && isPlaying
                            ? "bg-primary opacity-90"
                            : "bg-primary/30 group-hover:bg-primary/50"
                        )}
                        style={{
                          height: `${h}%`,
                          ...(isActive && isPlaying
                            ? { animation: `wave-bar ${0.6 + (i % 5) * 0.15}s ease-in-out infinite`, animationDelay: `${i * 40}ms` }
                            : {}),
                        }}
                      />
                    ))}
                  </div>

                  {/* Play button overlay */}
                  {canPlay && (
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-300",
                      isActive && isPlaying ? "bg-black/20" : "bg-black/0 group-hover:bg-black/30"
                    )}>
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center shadow-glow-primary transition-all duration-300",
                        "bg-gradient-primary",
                        isActive && isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
                      )}>
                        {isActive && isPlaying
                          ? <Pause className="h-5 w-5 text-white" />
                          : <Play className="h-5 w-5 text-white ml-0.5" />}
                      </div>
                    </div>
                  )}

                  {/* Status badge top-left */}
                  <div className="absolute top-2 left-2">
                    <Badge className={cn("text-[10px] px-2 py-0.5", statusBadgeClass(generation.status))}>
                      {generation.status === "pending" ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          generating
                        </span>
                      ) : generation.status}
                    </Badge>
                  </div>

                  {/* Live wave indicator top-right */}
                  {isActive && isPlaying && (
                    <div className="absolute top-2 right-2 flex items-end gap-[2px] h-4">
                      <span className="w-[3px] bg-primary rounded-full h-2 animate-wave-1" />
                      <span className="w-[3px] bg-secondary rounded-full h-3 animate-wave-2" />
                      <span className="w-[3px] bg-primary rounded-full h-4 animate-wave-3" />
                      <span className="w-[3px] bg-secondary rounded-full h-2 animate-wave-4" />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                    {formatDate(generation.created_at)}
                  </p>
                  <p className={cn(
                    "font-semibold text-sm leading-snug line-clamp-2",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {shortPrompt}
                  </p>
                  {generation.lyrics && (
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">
                      {generation.lyrics.split("\n")[0]}
                    </p>
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
