import { useEffect, useMemo, useState } from "react";
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
  Volume2,
  Languages,
  Film,
  Download,
  MonitorPlay,
  Smartphone,
  Trash2,
  Upload,
  Lock,
  Crown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE, apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import { UpgradeModal } from "@/components/UpgradeModal";
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

type TtsResult = {
  id: string;
  text: string;
  audioUrl: string;
  durationSec: number;
  lang: string;
  createdAt: string;
};

const TTS_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Romanian", value: "ro" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Portuguese", value: "pt" },
  { label: "Dutch", value: "nl" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese (Simplified)", value: "zh-CN" },
  { label: "Arabic", value: "ar" },
  { label: "Hindi", value: "hi" },
  { label: "Russian", value: "ru" },
];

const MODEL_OPTIONS = [
  { label: "MusicGen Small (fast)", value: "facebook/musicgen-small" },
  { label: "MusicGen Medium (balanced)", value: "facebook/musicgen-medium" },
  { label: "MusicGen Large (best quality)", value: "facebook/musicgen-large" },
];

type VideoGeneration = {
  id: string;
  prompt: string;
  product_description: string | null;
  style: string;
  scene_count: number;
  aspect_ratio: "16:9" | "9:16";
  music_url: string | null;
  tts_url: string | null;
  video_url: string | null;
  status: "pending" | "completed" | "failed";
  error_message: string | null;
  source?: string;
  created_at: string;
};

export default function SoundStudio() {
  const token = getToken();
  const queryClient = useQueryClient();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { isFree, isPremium } = useSubscription();

  const [tab, setTab] = useState<"music" | "voiceover" | "video" | "upload">("music");
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Upload tab state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTtsUrl, setUploadTtsUrl] = useState("none");
  const [uploadMusicUrl, setUploadMusicUrl] = useState("none");

  // Music tab state
  const [prompt, setPrompt] = useState("");
  const [durationSec, setDurationSec] = useState("8");
  const [model, setModel] = useState("facebook/musicgen-small");
  const [modelChoice, setModelChoice] = useState<"pulsefy" | "musicgen">("musicgen");

  // Voiceover tab state
  const [ttsText, setTtsText] = useState("");
  const [ttsLang, setTtsLang] = useState("en");
  const [ttsSlow, setTtsSlow] = useState(false);

  // Video tab state
  const [videoProductName, setVideoProductName] = useState("");
  const [videoProductDesc, setVideoProductDesc] = useState("");
  const [videoStyle, setVideoStyle] = useState("vibrant");
  const [videoSceneCount, setVideoSceneCount] = useState(3);
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9");
  const [videoMusicUrl, setVideoMusicUrl] = useState("none");
  const [videoTtsUrl, setVideoTtsUrl] = useState("none");

  // Elapsed timer state — effects wired after mutations are declared below
  const [musicElapsed, setMusicElapsed] = useState(0);
  const [videoElapsed, setVideoElapsed] = useState(0);

  const generationsQuery = useQuery({
    queryKey: ["ai-generations"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/ai/generations");
      return (res.generations || []) as Generation[];
    },
  });

  const ttsQuery = useQuery({
    queryKey: ["tts-generations"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/ai/tts");
      return (res.items || []) as TtsResult[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const cleanPrompt = prompt.trim();
      if (cleanPrompt.length < 6) {
        throw new Error("Prompt must have at least 6 characters.");
      }
      const payload: { prompt: string; durationSec?: number; model?: string; modelChoice: "pulsefy" | "musicgen" } = {
        prompt: cleanPrompt,
        modelChoice,
      };
      const parsedDuration = Number(durationSec);
      if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
        payload.durationSec = parsedDuration;
      }
      if (modelChoice === "musicgen" && model.trim()) {
        payload.model = model.trim();
      }
      return apiFetch("/ai/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 402) setShowUpgrade(true);
    },
    onSuccess: async () => {
      setPrompt("");
      await queryClient.invalidateQueries({ queryKey: ["ai-generations"] });
    },
  });

  const ttsMutation = useMutation({
    mutationFn: async () => {
      const cleanText = ttsText.trim();
      if (!cleanText) throw new Error("Text cannot be empty.");
      return apiFetch("/ai/tts", {
        method: "POST",
        body: JSON.stringify({ text: cleanText, lang: ttsLang, slow: ttsSlow }),
      }) as Promise<{ audioUrl: string; durationSec: number }>;
    },
    onError: (err: Error & { status?: number }) => {
      if (err.status === 402) setShowUpgrade(true);
    },
    onSuccess: async (data: TtsResult) => {
      await queryClient.invalidateQueries({ queryKey: ["tts-generations"] });
      const track: PlayerTrack = {
        id: data.id,
        title: data.text.length > 64 ? data.text.slice(0, 64) + "…" : data.text,
        artist: "Pulsefy Voiceover",
        album: "TTS Generations",
        duration_sec: data.durationSec,
        genre: "TTS",
        audio_url: toAbsoluteUrl(data.audioUrl)!,
        image_url: null,
        license_url: null,
      };
      playTrack(track, [track]);
      setTtsText("");
    },
  });

  const deleteMusicMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/ai/generations/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-generations"] }),
  });

  const deleteTtsMutation = useMutation({
    mutationFn: (item: TtsResult) => apiFetch(`/ai/tts/${item.id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tts-generations"] }),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/ai/videos/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-videos"] }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("video", uploadFile);
      if (uploadTtsUrl !== "none") formData.append("ttsUrl", uploadTtsUrl);
      if (uploadMusicUrl !== "none") formData.append("musicUrl", uploadMusicUrl);
      const res = await fetch(`${API_BASE}/ai/video/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: async () => {
      setUploadFile(null);
      setUploadTtsUrl("none");
      setUploadMusicUrl("none");
      await queryClient.invalidateQueries({ queryKey: ["ai-videos"] });
    },
  });

  const videosQuery = useQuery({
    queryKey: ["ai-videos"],
    enabled: Boolean(token),
    refetchInterval: (query) => {
      const videos = query.state.data as VideoGeneration[] | undefined;
      return videos?.some((v) => v.status === "pending") ? 6000 : false;
    },
    queryFn: async () => {
      const res = await apiFetch("/ai/videos");
      return (res.videos || []) as VideoGeneration[];
    },
  });

  const videoMutation = useMutation({
    mutationFn: async () => {
      const name = videoProductName.trim();
      const desc = videoProductDesc.trim();
      if (!name) throw new Error("Product name is required.");
      if (desc.length < 6) throw new Error("Product description must be at least 6 characters.");
      return apiFetch("/ai/video", {
        method: "POST",
        body: JSON.stringify({
          productName:        name,
          productDescription: desc,
          style:              videoStyle,
          aspectRatio:        videoAspect,
          sceneCount:         videoSceneCount,
          musicUrl:           videoMusicUrl === "none" ? null : videoMusicUrl,
          ttsUrl:             videoTtsUrl === "none" ? null : videoTtsUrl,
        }),
      });
    },
    onSuccess: async () => {
      setVideoProductName("");
      setVideoProductDesc("");
      setVideoMusicUrl("none");
      setVideoTtsUrl("none");
      await queryClient.invalidateQueries({ queryKey: ["ai-videos"] });
    },
  });

  // Default free users to Pulsefy model; premium users keep their choice
  useEffect(() => {
    if (isFree) setModelChoice("pulsefy");
  }, [isFree]);

  useEffect(() => {
    if (!generateMutation.isPending) { setMusicElapsed(0); return; }
    const id = setInterval(() => setMusicElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [generateMutation.isPending]);

  useEffect(() => {
    if (!videoMutation.isPending) { setVideoElapsed(0); return; }
    const id = setInterval(() => setVideoElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [videoMutation.isPending]);

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
              <Badge variant="outline" className="text-muted-foreground text-xs">MusicGen · gTTS</Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Mic2 className="h-8 w-8 text-primary" />
              Sound Studio
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Generate original, copyright-free music or text-to-speech voiceovers for ads, content, and creative projects.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            <StatCard label="Completed" value={completedCount} color="secondary" />
            <StatCard label="Pending"   value={pendingCount}   color="primary" />
            <StatCard label="Failed"    value={failedCount}    color="destructive" />
          </div>
        </div>
      </Card>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-border bg-card/60 p-1 w-fit flex-wrap">
        {(["music", "voiceover", "video", "upload"] as const).map((t) => {
          const Icon = t === "music" ? Music2 : t === "voiceover" ? Volume2 : t === "video" ? Film : Upload;
          const label = t === "voiceover" ? "Voiceover" : t === "upload" ? "Upload" : t.charAt(0).toUpperCase() + t.slice(1);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all",
                tab === t
                  ? "bg-primary text-primary-foreground shadow-glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Music tab ─────────────────────────────────────────────────────────── */}
      {tab === "music" && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">

          {/* LEFT — presets + form */}
          <div className="space-y-6">
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

            {/* Create Track form */}
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
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); generateMutation.mutate(); }}>
                <div className="space-y-2">
                  <Label htmlFor="musicgen-prompt">Describe your music</Label>
                  <Textarea
                    id="musicgen-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. upbeat commercial pop with bright synths for a product launch ad"
                    className="min-h-[120px] bg-background/60 border-border"
                  />
                  <p className="text-xs text-muted-foreground">Be specific about mood, instruments, energy, and context.</p>
                </div>
                {/* Model selector */}
                <div className="space-y-2">
                  <Label>Generator Model</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pulsefy AI — free for everyone */}
                    <button
                      type="button"
                      onClick={() => setModelChoice("pulsefy")}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        modelChoice === "pulsefy"
                          ? "border-primary bg-primary/10 shadow-glow-primary"
                          : "border-border bg-card/60 hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Mic2 className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Free</Badge>
                      </div>
                      <p className="font-semibold text-sm text-foreground">Pulsefy AI</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Custom procedural synth</p>
                    </button>

                    {/* MusicGen — premium only */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isFree) { setShowUpgrade(true); return; }
                        setModelChoice("musicgen");
                      }}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all relative",
                        modelChoice === "musicgen" && isPremium
                          ? "border-violet-500/60 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                          : isFree
                          ? "border-border bg-card/40 opacity-70 cursor-pointer hover:border-violet-500/30"
                          : "border-border bg-card/60 hover:border-violet-500/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Sparkles className={cn("h-4 w-4", modelChoice === "musicgen" && isPremium ? "text-violet-400" : "text-muted-foreground")} />
                        {isFree
                          ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-violet-400 border-violet-500/30 gap-1"><Lock className="h-2.5 w-2.5" />Premium</Badge>
                          : <Badge className="text-[10px] px-1.5 py-0 bg-violet-500/20 text-violet-300 border-violet-500/30"><Crown className="h-2.5 w-2.5 mr-0.5" />Premium</Badge>
                        }
                      </div>
                      <p className="font-semibold text-sm text-foreground">MusicGen AI</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Meta's AI music model</p>
                    </button>
                  </div>
                </div>

                {/* Duration + MusicGen variant (only shown when MusicGen selected) */}
                <div className={cn("grid gap-4", modelChoice === "musicgen" && isPremium ? "sm:grid-cols-2" : "")}>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select value={durationSec} onValueChange={setDurationSec}>
                      <SelectTrigger id="duration" className="bg-background/60 border-border">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {[4, 8, 12, 16, 24, 30].map((s) => (
                          <SelectItem key={s} value={String(s)}>{s} seconds</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {modelChoice === "musicgen" && isPremium && (
                    <div className="space-y-2">
                      <Label htmlFor="model">MusicGen Quality</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger id="model" className="bg-background/60 border-border">
                          <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {generateMutation.isError && (
                  <Card className="p-3 border-destructive/60 bg-destructive/10 text-sm text-destructive">
                    {generateMutation.error instanceof Error ? generateMutation.error.message : "Music generation failed."}
                  </Card>
                )}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary" disabled={generateMutation.isPending}>
                  {generateMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generating… {musicElapsed}s</>
                    : <><Sparkles className="h-4 w-4" />Generate Track</>}
                </Button>
                {generateMutation.isPending && (
                  <p className="text-xs text-center text-muted-foreground">
                    {modelChoice === "musicgen" ? "Running MusicGen on CPU — small ~60s, medium ~200s, large ~5min." : "Running Pulsefy AI procedural generator…"}
                  </p>
                )}
              </form>
            </Card>

            {/* Style presets */}
            <Card className="p-6 border-border bg-gradient-card">
              <h3 className="text-base font-semibold">Style Presets</h3>
              <p className="mt-1 text-sm text-muted-foreground">Click to use as your prompt base.</p>
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
          </div>

          {/* RIGHT — notes + scrollable history */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:pr-1">
            <Card className="p-4 border-border bg-card/90">
              <div className="flex items-start gap-3">
                <Clock3 className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  MusicGen runs on CPU — expect <strong className="text-foreground">~60s</strong> (small), <strong className="text-foreground">~200s</strong> (medium), <strong className="text-foreground">~5 min</strong> (large). Pulsefy AI is instant.
                </p>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Recent Generations</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground text-xs">{(generationsQuery.data || []).length}</Badge>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border bg-background/70" onClick={() => generationsQuery.refetch()} disabled={generationsQuery.isFetching}>
                  <RefreshCcw className={cn("h-3 w-3", generationsQuery.isFetching && "animate-spin")} />
                </Button>
              </div>
            </div>

            {generationsQuery.isLoading && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-border bg-gradient-card overflow-hidden">
                    <div className="h-28 bg-muted animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                      <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!generationsQuery.isLoading && !generationsQuery.isError && (generationsQuery.data || []).length === 0 && (
              <Card className="p-8 border-border bg-gradient-card text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Music2 className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">No tracks yet</p>
                <p className="text-xs text-muted-foreground mt-1">Pick a format, write a prompt, and generate.</p>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              {(generationsQuery.data || []).map((generation, index) => {
                const playableTrack = toPlayerTrack(generation, index + 1);
                const canPlay = generation.status === "completed" && Boolean(playableTrack.audio_url);
                const isActive = currentTrack?.id === playableTrack.id;
                const shortPrompt = generation.prompt.length > 50 ? generation.prompt.slice(0, 50) + "…" : generation.prompt;
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
                    <div className="relative h-28 bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center overflow-hidden">
                      <div className="flex items-end gap-[2px] h-12 px-4 w-full">
                        {WAVEFORM_HEIGHTS.map((h, i) => (
                          <div key={i} className={cn("flex-1 rounded-full transition-all duration-300", isActive && isPlaying ? "bg-primary opacity-90" : "bg-primary/30 group-hover:bg-primary/50")}
                            style={{ height: `${h}%`, ...(isActive && isPlaying ? { animation: `wave-bar ${0.6 + (i % 5) * 0.15}s ease-in-out infinite`, animationDelay: `${i * 40}ms` } : {}) }} />
                        ))}
                      </div>
                      {canPlay && (
                        <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", isActive && isPlaying ? "bg-black/20" : "bg-black/0 group-hover:bg-black/30")}>
                          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-glow-primary transition-all duration-300 bg-gradient-primary", isActive && isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100")}>
                            {isActive && isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        <Badge className={cn("text-[9px] px-1.5 py-0", statusBadgeClass(generation.status))}>
                          {generation.status === "pending" ? <span className="flex items-center gap-1"><Loader2 className="h-2 w-2 animate-spin" />gen…</span> : generation.status}
                        </Badge>
                        {generation.status === "completed" && generation.lyrics && (
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0",
                            generation.lyrics === "pulsefy-lstm-v1"
                              ? "border-violet-500/40 text-violet-400"
                              : "border-border text-muted-foreground"
                          )}>
                            {generation.lyrics === "pulsefy-lstm-v1" ? "LSTM" : "synth"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{formatDate(generation.created_at)}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteMusicMutation.mutate(generation.id); }} disabled={deleteMusicMutation.isPending && deleteMusicMutation.variables === generation.id} className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-40">
                          {deleteMusicMutation.isPending && deleteMusicMutation.variables === generation.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                      </div>
                      <p className={cn("font-semibold text-xs leading-snug line-clamp-2", isActive ? "text-primary" : "text-foreground")}>{shortPrompt}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Voiceover tab ─────────────────────────────────────────────────────── */}
      {tab === "voiceover" && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">

          {/* LEFT — form + language pills */}
          <div className="space-y-6">
            <Card className="p-6 md:p-7 border-border bg-card/90">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary/15 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Generate Voiceover</h2>
                  <p className="text-sm text-muted-foreground">Convert text to speech and play it instantly.</p>
                </div>
              </div>
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); ttsMutation.mutate(); }}>
                <div className="space-y-2">
                  <Label htmlFor="tts-text">Text to speak</Label>
                  <Textarea
                    id="tts-text"
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="e.g. Welcome to Pulsefy — your AI-powered music studio."
                    className="min-h-[140px] bg-background/60 border-border"
                  />
                  <p className="text-xs text-muted-foreground">{ttsText.length} / 2000 characters</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tts-lang" className="flex items-center gap-1.5">
                      Language
                      {isFree && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground gap-1"><Lock className="h-2.5 w-2.5" />EN only</Badge>}
                    </Label>
                    <Select value={ttsLang} onValueChange={(val) => {
                      if (isFree && val !== "en") { setShowUpgrade(true); return; }
                      setTtsLang(val);
                    }}>
                      <SelectTrigger id="tts-lang" className="bg-background/60 border-border">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {TTS_LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value} disabled={isFree && l.value !== "en"}>
                            {l.label}{isFree && l.value !== "en" ? " (Premium)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Slow speech</Label>
                    <div className="flex items-center gap-3 h-10">
                      <Switch id="tts-slow" checked={ttsSlow} onCheckedChange={setTtsSlow} />
                      <label htmlFor="tts-slow" className="text-sm text-muted-foreground cursor-pointer">
                        {ttsSlow ? "Enabled" : "Disabled"}
                      </label>
                    </div>
                  </div>
                </div>
                {ttsMutation.isError && (
                  <Card className="p-3 border-destructive/60 bg-destructive/10 text-sm text-destructive">
                    {ttsMutation.error instanceof Error ? ttsMutation.error.message : "Voiceover generation failed."}
                  </Card>
                )}
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={ttsMutation.isPending || !ttsText.trim()}>
                  {ttsMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
                    : <><Volume2 className="h-4 w-4" />Generate Voiceover</>}
                </Button>
              </form>
            </Card>

            <Card className="p-6 border-border bg-gradient-card">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="h-4 w-4 text-secondary" />
                <h3 className="text-base font-semibold">Quick Language Select</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TTS_LANGUAGES.map((l) => {
                  const locked = isFree && l.value !== "en";
                  return (
                    <button key={l.value} type="button"
                      onClick={() => locked ? setShowUpgrade(true) : setTtsLang(l.value)}
                      className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                        ttsLang === l.value ? "border-secondary bg-secondary/15 text-secondary" :
                        locked ? "border-border bg-background/40 text-muted-foreground/40 cursor-pointer hover:border-violet-500/40" :
                        "border-border bg-background/70 text-muted-foreground hover:border-secondary/50 hover:text-foreground")}>
                      {locked && <Lock className="h-2.5 w-2.5" />}
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* RIGHT — notes + scrollable history */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:pr-1">
            <Card className="p-4 border-border bg-card/90">
              <div className="flex items-start gap-3">
                <Clock3 className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                <p className="text-sm text-muted-foreground">Uses Google TTS. Audio plays immediately and is saved to history below.</p>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Voiceovers</h2>
              <Badge variant="outline" className="text-muted-foreground text-xs">{(ttsQuery.data ?? []).length}</Badge>
            </div>

            {(ttsQuery.data ?? []).length === 0 && (
              <Card className="p-8 border-border bg-gradient-card text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
                  <Volume2 className="h-6 w-6 text-secondary" />
                </div>
                <p className="font-semibold">No voiceovers yet</p>
                <p className="text-xs text-muted-foreground mt-1">Type text on the left and hit Generate.</p>
              </Card>
            )}

            <div className="grid gap-3">
              {(ttsQuery.data ?? []).map((item, index) => {
                const track: PlayerTrack = { id: item.id, title: item.text.length > 64 ? item.text.slice(0, 64) + "…" : item.text, artist: "Pulsefy Voiceover", album: "TTS Generations", duration_sec: item.durationSec, genre: "TTS", audio_url: item.audioUrl, image_url: null, license_url: null };
                const isActive = currentTrack?.id === item.id;
                const langLabel = TTS_LANGUAGES.find((l) => l.value === item.lang)?.label ?? item.lang;
                return (
                  <Card key={item.id}
                    className={cn("group border-border bg-gradient-card overflow-hidden cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 hover:shadow-lg", isActive && "border-secondary/50 shadow-lg")}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => playTrack(track, (ttsQuery.data ?? []).map((t) => ({ id: t.id, title: t.text.length > 64 ? t.text.slice(0, 64) + "…" : t.text, artist: "Pulsefy Voiceover", album: "TTS Generations", duration_sec: t.durationSec, genre: "TTS", audio_url: t.audioUrl, image_url: null, license_url: null })))}
                  >
                    <div className="relative h-24 bg-gradient-to-br from-secondary/20 via-background to-primary/10 flex items-center justify-center overflow-hidden">
                      <div className="flex items-end gap-[2px] h-10 px-4 w-full">
                        {WAVEFORM_HEIGHTS.map((h, i) => (
                          <div key={i} className={cn("flex-1 rounded-full transition-all duration-300", isActive && isPlaying ? "bg-secondary opacity-90" : "bg-secondary/30 group-hover:bg-secondary/50")}
                            style={{ height: `${h}%`, ...(isActive && isPlaying ? { animation: `wave-bar ${0.6 + (i % 5) * 0.15}s ease-in-out infinite`, animationDelay: `${i * 40}ms` } : {}) }} />
                        ))}
                      </div>
                      <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", isActive && isPlaying ? "bg-black/20" : "bg-black/0 group-hover:bg-black/30")}>
                        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 bg-secondary", isActive && isPlaying ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100")}>
                          {isActive && isPlaying ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white ml-0.5" />}
                        </div>
                      </div>
                      <div className="absolute top-1.5 left-1.5">
                        <Badge className="text-[9px] px-1.5 py-0 bg-secondary/15 text-secondary border-secondary/40">{langLabel}</Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{formatDate(item.createdAt)}{item.durationSec > 0 ? ` · ${item.durationSec.toFixed(1)}s` : ""}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteTtsMutation.mutate(item); }} disabled={deleteTtsMutation.isPending && deleteTtsMutation.variables?.id === item.id} className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-40">
                          {deleteTtsMutation.isPending && deleteTtsMutation.variables?.id === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                      </div>
                      <p className={cn("font-semibold text-xs leading-snug line-clamp-2", isActive ? "text-secondary" : "text-foreground")}>{item.text}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Upload tab ───────────────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div className="space-y-6">
            <Card className="p-6 md:p-7 border-border bg-card/90">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Upload Your Video</h2>
                  <p className="text-sm text-muted-foreground">Add a voiceover and background music to your own video.</p>
                </div>
              </div>
              <div className="space-y-5">
                {/* File drop zone */}
                <div
                  className={cn(
                    "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    uploadFile ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-primary/5"
                  )}
                  onClick={() => document.getElementById("video-upload-input")?.click()}
                >
                  <input
                    id="video-upload-input"
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 100 * 1024 * 1024) {
                        alert("File must be under 100 MB");
                        return;
                      }
                      setUploadFile(file ?? null);
                    }}
                  />
                  {uploadFile ? (
                    <div className="space-y-1">
                      <Film className="mx-auto h-8 w-8 text-primary" />
                      <p className="font-medium text-foreground">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); (document.getElementById("video-upload-input") as HTMLInputElement).value = ""; }}
                        className="text-xs text-muted-foreground hover:text-destructive mt-1 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="font-medium text-foreground">Click to select a video</p>
                      <p className="text-xs text-muted-foreground">MP4, MOV, WebM — max 100 MB</p>
                    </div>
                  )}
                </div>

                {/* TTS picker */}
                <div className="space-y-2">
                  <Label>Add Voiceover <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select value={uploadTtsUrl} onValueChange={setUploadTtsUrl}>
                    <SelectTrigger className="bg-background/60 border-border"><SelectValue placeholder="Select a TTS recording" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(ttsQuery.data || []).map((item) => (
                        <SelectItem key={item.id} value={item.audioUrl}>
                          {item.text.length > 60 ? item.text.slice(0, 60) + "…" : item.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Music picker */}
                <div className="space-y-2">
                  <Label>Add Background Music <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select value={uploadMusicUrl} onValueChange={setUploadMusicUrl}>
                    <SelectTrigger className="bg-background/60 border-border"><SelectValue placeholder="Select an AI music track" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(generationsQuery.data || []).filter((g) => g.status === "completed" && g.audio_url).map((g) => (
                        <SelectItem key={g.id} value={g.audio_url!}>
                          {g.prompt.length > 60 ? g.prompt.slice(0, 60) + "…" : g.prompt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {uploadMutation.isError && (
                  <Card className="p-3 border-destructive/60 bg-destructive/10 text-sm text-destructive">
                    {uploadMutation.error instanceof Error ? uploadMutation.error.message : "Upload failed."}
                  </Card>
                )}

                <Button
                  className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary"
                  disabled={!uploadFile || uploadMutation.isPending}
                  onClick={() => uploadMutation.mutate()}
                >
                  {uploadMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
                    : <><Upload className="h-4 w-4" />Process Video</>}
                </Button>
                {uploadMutation.isPending && (
                  <p className="text-xs text-center text-muted-foreground">Merging audio tracks — usually a few seconds.</p>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT — processed videos */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:pr-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Uploaded Videos</h2>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border bg-background/70" onClick={() => videosQuery.refetch()} disabled={videosQuery.isFetching}>
                <RefreshCcw className={cn("h-3 w-3", videosQuery.isFetching && "animate-spin")} />
              </Button>
            </div>
            {(videosQuery.data || []).filter((v) => v.source === "uploaded").length === 0 && (
              <Card className="p-8 border-border bg-gradient-card text-center border-dashed">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">No uploaded videos yet</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a video and add audio above.</p>
              </Card>
            )}
            <div className="grid gap-4">
              {(videosQuery.data || []).filter((v) => v.source === "uploaded").map((video, index) => (
                <Card key={video.id}
                  className={cn("border-border bg-gradient-card overflow-hidden animate-in fade-in slide-in-from-bottom-3", video.status === "completed" && "hover:scale-[1.01] transition-transform duration-300")}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="relative bg-black aspect-video">
                    {video.status === "completed" && video.video_url ? (
                      <video src={toAbsoluteUrl(video.video_url)!} controls className="absolute inset-0 w-full h-full object-contain" preload="metadata" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        {video.status === "pending"
                          ? <><Loader2 className="h-7 w-7 text-primary animate-spin" /><p className="text-xs text-muted-foreground">Processing…</p></>
                          : <><Film className="h-7 w-7 text-destructive/60" /><p className="text-xs text-destructive">Failed</p></>}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={cn("text-[10px] px-2 py-0.5", statusBadgeClass(video.status as "pending" | "completed" | "failed"))}>
                        {video.status === "pending" ? <span className="flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" />processing</span> : video.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{formatDate(video.created_at)}</p>
                      <button type="button" onClick={() => deleteVideoMutation.mutate(video.id)} disabled={deleteVideoMutation.isPending && deleteVideoMutation.variables === video.id}
                        className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-40">
                        {deleteVideoMutation.isPending && deleteVideoMutation.variables === video.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {video.status === "completed" && video.video_url && (
                      <a href={toAbsoluteUrl(video.video_url)!} download className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                        <Download className="h-3 w-3" />Download MP4
                      </a>
                    )}
                    {video.status === "failed" && video.error_message && <p className="text-xs text-destructive line-clamp-2">{video.error_message}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* ── Video tab ─────────────────────────────────────────────────────────── */}
      {tab === "video" && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">

          {/* LEFT — form */}
          <Card className="p-6 md:p-7 border-border bg-card/90">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Generate Ad Video</h2>
                <p className="text-sm text-muted-foreground">AI scene images + Ken Burns animation + your audio.</p>
              </div>
            </div>
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); videoMutation.mutate(); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video-product-name">Product name</Label>
                  <input id="video-product-name" type="text" value={videoProductName} onChange={(e) => setVideoProductName(e.target.value)} placeholder="e.g. AuraGlow Serum"
                    className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    Scenes
                    {isFree && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground gap-1"><Lock className="h-2.5 w-2.5" />max 2</Badge>}
                  </Label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((n) => {
                      const locked = isFree && n > 2;
                      return (
                        <button key={n} type="button"
                          onClick={() => locked ? setShowUpgrade(true) : setVideoSceneCount(n)}
                          className={cn("flex-1 rounded-lg border py-2 text-sm font-medium transition-all flex items-center justify-center gap-1",
                            videoSceneCount === n && !locked ? "border-primary bg-primary/10 text-primary" :
                            locked ? "border-border bg-background/40 text-muted-foreground/40 cursor-pointer hover:border-violet-500/40" :
                            "border-border bg-background/60 text-muted-foreground hover:border-primary/40")}>
                          {locked && <Lock className="h-3 w-3" />}
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-product-desc">Product description</Label>
                <Textarea id="video-product-desc" value={videoProductDesc} onChange={(e) => setVideoProductDesc(e.target.value)}
                  placeholder="e.g. Luxury anti-aging serum with hyaluronic acid and vitamin C, packaged in a minimalist glass bottle"
                  className="min-h-[100px] bg-background/60 border-border" />
                <p className="text-xs text-muted-foreground">Be specific — mention colours, materials, and the feeling you want to evoke.</p>
              </div>
              <div className="space-y-2">
                <Label>Visual style</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(["minimalist", "vibrant", "cinematic", "corporate", "lifestyle"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setVideoStyle(s)}
                      className={cn("rounded-lg border py-2 text-xs font-medium capitalize transition-all", videoStyle === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/60 text-muted-foreground hover:border-primary/40")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aspect ratio</Label>
                <div className="flex gap-3">
                  {([["16:9", "Landscape"], ["9:16", "Portrait"]] as const).map(([ratio, label]) => (
                    <button key={ratio} type="button" onClick={() => setVideoAspect(ratio)}
                      className={cn("flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all", videoAspect === ratio ? "border-primary bg-primary/10 text-primary" : "border-border bg-background/60 text-muted-foreground hover:border-primary/40")}>
                      {ratio === "16:9" ? <MonitorPlay className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                      {ratio} — {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="video-music">Background music <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select value={videoMusicUrl} onValueChange={setVideoMusicUrl}>
                    <SelectTrigger id="video-music" className="bg-background/60 border-border"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(generationsQuery.data || []).filter((g) => g.status === "completed" && g.audio_url).map((g) => (
                        <SelectItem key={g.id} value={g.audio_url!}>{g.prompt.length > 48 ? g.prompt.slice(0, 48) + "…" : g.prompt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-tts">Voiceover <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select value={videoTtsUrl} onValueChange={setVideoTtsUrl}>
                    <SelectTrigger id="video-tts" className="bg-background/60 border-border"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(ttsQuery.data ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.audioUrl}>{t.text.length > 48 ? t.text.slice(0, 48) + "…" : t.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-3">Generate music and voiceover in the other tabs first — they'll appear here automatically.</p>
              {videoMutation.isError && (
                <Card className="p-3 border-destructive/60 bg-destructive/10 text-sm text-destructive">
                  {videoMutation.error instanceof Error ? videoMutation.error.message : "Video generation failed."}
                </Card>
              )}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary" disabled={videoMutation.isPending}>
                {videoMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Generating… {videoElapsed}s</>
                  : <><Sparkles className="h-4 w-4" />Generate Video</>}
              </Button>
              {videoMutation.isPending && (
                <p className="text-xs text-center text-muted-foreground">
                  Generating scene images and compositing video — usually 30–90s depending on scene count.
                </p>
              )}
            </form>
          </Card>

          {/* RIGHT — notes + scrollable history */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto lg:pr-1">
            <Card className="p-4 border-border bg-gradient-card">
              <div className="flex items-start gap-3">
                <Film className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">How it works</p>
                  <p className="text-xs text-muted-foreground mt-1">Pollinations.ai generates {videoSceneCount} scene images, animates them with Ken Burns, then stitches an MP4. Takes ~1–2 min.</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border bg-card/90">
              <div className="flex items-start gap-3">
                <Clock3 className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                <p className="text-xs text-muted-foreground">Voiceover plays at full volume, background music is ducked to 35%.</p>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Generated Videos</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground text-xs">{(videosQuery.data || []).length}</Badge>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-border bg-background/70" onClick={() => videosQuery.refetch()} disabled={videosQuery.isFetching}>
                  <RefreshCcw className={cn("h-3 w-3", videosQuery.isFetching && "animate-spin")} />
                </Button>
              </div>
            </div>

            {videosQuery.isLoading && (
              <div className="grid gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="border-border bg-gradient-card overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                      <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!videosQuery.isLoading && (videosQuery.data || []).length === 0 && (
              <Card className="p-8 border-border bg-gradient-card text-center">
                <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Film className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">No videos yet</p>
                <p className="text-xs text-muted-foreground mt-1">Fill in the form and generate your first ad video.</p>
              </Card>
            )}

            <div className="grid gap-4">
              {(videosQuery.data || []).map((video, index) => (
                <Card key={video.id}
                  className={cn("border-border bg-gradient-card overflow-hidden animate-in fade-in slide-in-from-bottom-3", video.status === "completed" && "hover:scale-[1.01] transition-transform duration-300")}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className={cn("relative bg-black", video.aspect_ratio === "9:16" ? "aspect-[9/16] max-h-56" : "aspect-video")}>
                    {video.status === "completed" && video.video_url ? (
                      <video src={toAbsoluteUrl(video.video_url)!} controls className="absolute inset-0 w-full h-full object-contain" preload="metadata" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        {video.status === "pending"
                          ? <><Loader2 className="h-7 w-7 text-primary animate-spin" /><p className="text-xs text-muted-foreground">Generating scenes…</p></>
                          : <><Film className="h-7 w-7 text-destructive/60" /><p className="text-xs text-destructive">Failed</p></>}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <Badge className={cn("text-[10px] px-2 py-0.5", statusBadgeClass(video.status as "pending" | "completed" | "failed"))}>
                        {video.status === "pending" ? <span className="flex items-center gap-1"><Loader2 className="h-2.5 w-2.5 animate-spin" />generating</span> : video.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">{video.aspect_ratio}</Badge>
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{formatDate(video.created_at)} · {video.scene_count} scenes · {video.style}</p>
                      <button type="button" onClick={() => deleteVideoMutation.mutate(video.id)} disabled={deleteVideoMutation.isPending && deleteVideoMutation.variables === video.id}
                        className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors disabled:opacity-40">
                        {deleteVideoMutation.isPending && deleteVideoMutation.variables === video.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="font-semibold text-sm leading-snug text-foreground">{video.prompt}</p>
                    {video.product_description && <p className="text-xs text-muted-foreground line-clamp-2">{video.product_description}</p>}
                    {video.status === "failed" && video.error_message && <p className="text-xs text-destructive line-clamp-2">{video.error_message}</p>}
                    {video.status === "completed" && video.video_url && (
                      <a href={toAbsoluteUrl(video.video_url)!} download className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1">
                        <Download className="h-3 w-3" />Download MP4
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
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
