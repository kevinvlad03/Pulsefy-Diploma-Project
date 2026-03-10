import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wand2,
  Sparkles,
  Clock3,
  Music2,
  Loader2,
  Play,
  Pause,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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

const DURATION_OPTIONS = [4, 8, 12, 16, 24, 30];

const PROMPT_SUGGESTIONS = [
  "cinematic ambient with soft piano and slow evolving synths",
  "upbeat synthwave with punchy drums and bright arpeggios",
  "melodic lo-fi hip hop with warm vinyl texture",
  "epic rock intro with heavy guitars and driving rhythm",
];

export default function AIGenerator() {
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
      const payload: {
        prompt: string;
        durationSec?: number;
        model?: string;
      } = {
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
      .filter((generation) => generation.status === "completed" && Boolean(generation.audio_url))
      .map((generation, index) => toPlayerTrack(generation, index + 1));
  }, [generationsQuery.data]);

  const completedCount = playableTracks.length;
  const failedCount = (generationsQuery.data || []).filter((item) => item.status === "failed").length;
  const pendingCount = (generationsQuery.data || []).filter((item) => item.status === "pending").length;

  if (!token) {
    return (
      <Card className="relative overflow-hidden p-8 md:p-10 bg-gradient-card border-border">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-10 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative space-y-5">
          <Badge className="bg-primary/15 text-primary border-primary/40">AI Studio</Badge>
          <h1 className="text-4xl font-bold leading-tight">
            Sign in to generate songs with <span className="bg-gradient-primary bg-clip-text text-transparent">MusicGen</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Prompt-based generation is private to your account. Sign in and start creating tracks you can instantly play in Pulsefy&apos;s global player.
          </p>
          <Link to="/auth">
            <Button className="bg-primary hover:bg-primary/90 shadow-glow-primary">
              Go to Sign In
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="relative overflow-hidden p-7 md:p-8 border-border bg-gradient-card">
        <div className="absolute -top-20 right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Badge className="bg-primary/15 text-primary border-primary/40">MusicGen by Meta</Badge>
            <h1 className="text-4xl font-bold tracking-tight">AI Song Generator</h1>
            <p className="max-w-2xl text-muted-foreground">
              Describe a mood, texture, or arrangement and generate a fresh clip. Completed results can be sent directly to the global player.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatCard label="Completed" value={completedCount} />
            <StatCard label="Pending" value={pendingCount} />
            <StatCard label="Failed" value={failedCount} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-6 md:p-7 border-border bg-card/90">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Prompt Studio</h2>
              <p className="text-sm text-muted-foreground">Simple controls, fast generation.</p>
            </div>
          </div>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              generateMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="musicgen-prompt">Prompt</Label>
              <Textarea
                id="musicgen-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: cinematic ambient with soft piano and slow evolving synths"
                className="min-h-[128px] bg-background/60 border-border"
              />
              <p className="text-xs text-muted-foreground">At least 6 characters. Keep it descriptive for better outputs.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={durationSec} onValueChange={setDurationSec}>
                  <SelectTrigger id="duration" className="bg-background/60 border-border">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((seconds) => (
                      <SelectItem key={seconds} value={String(seconds)}>
                        {seconds} seconds
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="bg-background/60 border-border"
                  placeholder="facebook/musicgen-small"
                />
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
                  Generate Audio
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border-border bg-gradient-card">
            <h3 className="text-lg font-semibold">Prompt Ideas</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click a suggestion to populate the prompt instantly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  {example}
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
                  Track creation can take a bit on CPU. The newest generation appears in history after completion.
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
              <p className="font-medium">No generations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Write a prompt above and generate your first clip.
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

                    <div>
                      <p className="text-sm text-muted-foreground">Lyrics</p>
                      <p className="text-foreground whitespace-pre-wrap break-words text-sm">
                        {generation.lyrics || "No lyrics produced."}
                      </p>
                    </div>
                  </div>

                  {canPlay ? (
                    <Button
                      className="bg-primary hover:bg-primary/90 md:self-center"
                      onClick={() => playTrack(playableTrack, playableTracks)}
                    >
                      {isCurrentTrack && isPlaying ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause in Player
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Play in Player
                        </>
                      )}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="md:self-center text-muted-foreground">
                      {generation.status === "pending" ? "Generating..." : "No playable audio"}
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
    artist: "Pulsefy AI",
    album: "MusicGen Generations",
    duration_sec: 0,
    genre: "AI",
    audio_url: toAbsoluteUrl(generation.audio_url),
    image_url: null,
    license_url: null,
  };
}

function summarizePrompt(prompt: string, index: number) {
  const value = prompt.trim();
  if (!value) return `AI Generation #${index}`;
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
    second: "2-digit",
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
