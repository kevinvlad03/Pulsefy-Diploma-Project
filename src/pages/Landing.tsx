import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music2,
  Sparkles,
  Mic2,
  Users,
  Zap,
  Play,
  ChevronRight,
  TrendingUp,
  Volume2,
  Star,
} from "lucide-react";

// Intersection-observer hook for scroll animations
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const FEATURES = [
  {
    icon: Music2,
    color: "primary",
    title: "Vast Music Library",
    desc: "Millions of licensed tracks via Jamendo — browse, search, and play across every genre instantly.",
  },
  {
    icon: Sparkles,
    color: "secondary",
    title: "AI Recommendations",
    desc: "Your listening history drives a personalised feed. The more you listen, the smarter it gets.",
  },
  {
    icon: Mic2,
    color: "primary",
    title: "Sound Studio",
    desc: "Generate copyright-free music in seconds. Pick a format — TikTok 8s, Instagram 12s, YouTube 30s — describe the vibe, done.",
  },
  {
    icon: Users,
    color: "secondary",
    title: "Social & Playlists",
    desc: "Follow creators, share playlists, and discover what your network is listening to right now.",
  },
  {
    icon: TrendingUp,
    color: "primary",
    title: "Trending Discovery",
    desc: "A daily-refreshing feed shows what's hot across genres so you never run out of new music.",
  },
  {
    icon: Volume2,
    color: "secondary",
    title: "Persistent Player",
    desc: "The global player bar keeps music going as you navigate — shuffle, repeat, queue, all there.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Sign up free", desc: "Create your account in under a minute. No credit card needed." },
  { step: "02", title: "Explore & listen", desc: "Browse the library, search any artist or genre, hit play." },
  { step: "03", title: "Get AI picks", desc: "After a few plays, your AI Picks feed updates with personalised suggestions." },
  { step: "04", title: "Create in Sound Studio", desc: "Pick an ad format, describe your sound, and generate a copyright-free track." },
];

export default function Landing() {
  const featuresSection = useInView();
  const howItWorks = useInView();
  const studioSection = useInView();
  const ctaSection = useInView();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-background/70 backdrop-blur-md border-b border-border/50">
        <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Pulsefy</span>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-glow-primary">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated gradient blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/20 blur-3xl animate-blob-delay-2" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-blob-delay-4" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <Badge
            className="mb-6 bg-primary/15 text-primary border-primary/40 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <Zap className="h-3 w-3 mr-1" />
            AI-powered music & ad creation
          </Badge>

          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150"
            style={{ lineHeight: 1.05 }}
          >
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-shimmer">
              Pulsefy
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/80 mb-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            Stream. Discover. Create.
          </p>
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450">
            Your all-in-one platform for music streaming, AI-powered recommendations,
            and copyright-free audio generation for ads and content.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow-primary text-base px-8 h-12 gap-2">
                <Play className="h-4 w-4" />
                Start listening free
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="border-border hover:border-primary/60 hover:bg-primary/5 text-base px-8 h-12 gap-2">
                Explore the app
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mini social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 animate-in fade-in duration-700 delay-750">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span>Thesis project 2025</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Music2 className="h-4 w-4 text-secondary" />
              <span>Powered by Jamendo + MusicGen</span>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 px-6" ref={featuresSection.ref}>
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Badge className="mb-4 bg-secondary/15 text-secondary border-secondary/40">Everything in one place</Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Built for creators & listeners
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`group p-6 rounded-2xl border border-border bg-gradient-card hover:border-primary/40 hover:shadow-glow-primary transition-all duration-500 cursor-default ${
                  featuresSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: featuresSection.inView ? `${i * 80}ms` : "0ms" }}
              >
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                    feature.color === "primary" ? "bg-primary/10" : "bg-secondary/10"
                  }`}
                >
                  <feature.icon
                    className={`h-5 w-5 ${feature.color === "primary" ? "text-primary" : "text-secondary"}`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-card/30 to-background" ref={howItWorks.ref}>
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              howItWorks.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Badge className="mb-4 bg-primary/15 text-primary border-primary/40">Simple by design</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">How it works</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className={`relative transition-all duration-700 ${
                  howItWorks.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: howItWorks.inView ? `${i * 100}ms` : "0ms" }}
              >
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="relative z-10 p-6 rounded-2xl border border-border/60 bg-card/60 h-full">
                  <span className="text-4xl font-black bg-gradient-primary bg-clip-text text-transparent block mb-3">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOUND STUDIO HIGHLIGHT ── */}
      <section className="py-24 px-6" ref={studioSection.ref}>
        <div className="max-w-5xl mx-auto">
          <div
            className={`relative overflow-hidden rounded-3xl border border-primary/30 p-8 md:p-14 transition-all duration-700 ${
              studioSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ background: "linear-gradient(135deg, hsl(220 20% 10%) 0%, hsl(270 30% 14%) 100%)" }}
          >
            {/* Blobs inside card */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-secondary/20 blur-3xl" />

            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <Badge className="bg-primary/15 text-primary border-primary/40">
                  <Mic2 className="h-3 w-3 mr-1" />
                  Sound Studio
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Create ad music in{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">seconds</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  No licence fees. No studio. Just describe the vibe — energetic TikTok jingle,
                  warm Instagram reel background, cinematic YouTube opener — and Sound Studio generates it.
                </p>
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 shadow-glow-primary gap-2">
                    Try Sound Studio
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Visual mock of ad format cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "TikTok", time: "8s", color: "from-pink-500/20 to-purple-500/20" },
                  { label: "Instagram", time: "12s", color: "from-orange-500/20 to-pink-500/20" },
                  { label: "YouTube Bumper", time: "16s", color: "from-red-500/20 to-orange-500/20" },
                  { label: "Pre-roll", time: "30s", color: "from-blue-500/20 to-cyan-500/20" },
                ].map((fmt) => (
                  <div
                    key={fmt.label}
                    className={`rounded-xl border border-white/10 bg-gradient-to-br ${fmt.color} p-4 backdrop-blur-sm`}
                  >
                    <p className="font-semibold text-foreground text-sm">{fmt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmt.time} track</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center" ref={ctaSection.ref}>
        <div
          className={`max-w-2xl mx-auto transition-all duration-700 ${
            ctaSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Ready to start?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Free to use. No credit card. Just music.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow-primary text-base px-10 h-12">
                Create free account
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="border-border hover:border-primary/60 text-base px-10 h-12">
                Browse as guest
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Pulsefy</span>
          <p className="text-sm text-muted-foreground">
            Thesis project — Faculty of Computer Science, 2025
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">App</Link>
            <Link to="/auth" className="hover:text-primary transition-colors">Sign in</Link>
            <Link to="/sound-studio" className="hover:text-primary transition-colors">Sound Studio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
