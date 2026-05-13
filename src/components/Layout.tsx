import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearToken, clearUser, getUser } from "@/lib/auth";
import { usePlayer } from "@/lib/player";
import { useSubscription } from "@/lib/subscription";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Home,
  Sparkles,
  Settings,
  Users,
  Mic2,
  Search,
  Menu,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Music2,
  LogOut,
  Crown,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/for-you", label: "For You", icon: Sparkles },
  { to: "/sound-studio", label: "Sound Studio", icon: Mic2 },
  { to: "/social", label: "Social", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { isFree } = useSubscription();
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(() =>
    typeof window !== "undefined" && !sessionStorage.getItem("pulsefy-upgrade-dismissed")
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  function dismissBanner() {
    sessionStorage.setItem("pulsefy-upgrade-dismissed", "1");
    setShowUpgradeBanner(false);
  }
  const [searchInput, setSearchInput] = useState("");
  const [searchDirty, setSearchDirty] = useState(false);
  const isLanding = location.pathname === "/about";
  const user = getUser();
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    seek,
    next,
    prev,
    toggleShuffle,
    isShuffle,
    cycleRepeat,
    repeatMode,
    setVolume,
  } = usePlayer();

  useEffect(() => {
    const query = new URLSearchParams(location.search).get("q") || "";
    setSearchInput(query);
    setSearchDirty(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!searchDirty) return;
    const nextQuery = searchInput.trim();
    const currentQuery = new URLSearchParams(location.search).get("q") || "";
    if (nextQuery === currentQuery && location.pathname === "/") return;

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (nextQuery) params.set("q", nextQuery);
      navigate(
        { pathname: "/", search: params.toString() ? `?${params.toString()}` : "" },
        { replace: true }
      );
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search, navigate, searchDirty, searchInput]);

  if (isLanding) return <Outlet />;

  const handleSignOut = () => {
    clearToken();
    clearUser();
    navigate("/auth");
  };

  const handleTopSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = searchInput.trim();
    if (query) params.set("q", query);
    navigate({ pathname: "/", search: params.toString() ? `?${params.toString()}` : "" });
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="flex min-h-screen w-full bg-background">

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border transition-all duration-300 flex flex-col ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border/60 shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black bg-gradient-primary bg-clip-text text-transparent tracking-tight">
                Pulsefy
              </h1>
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] bg-primary rounded-full h-1.5 animate-wave-1" />
                  <span className="w-[2px] bg-secondary rounded-full h-3 animate-wave-2" />
                  <span className="w-[2px] bg-primary rounded-full h-2 animate-wave-3" />
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground shrink-0"
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 transition-all duration-200 group ${
                isSidebarOpen ? "" : "justify-center"
              }`}
              activeClassName="!text-foreground bg-sidebar-accent/90 font-medium"
            >
              {/* Active left bar */}
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-r-full bg-gradient-primary opacity-0 transition-all duration-300 group-[.active]:h-6 group-[.active]:opacity-100" />
              <item.icon className="h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {isSidebarOpen && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user info when sidebar open */}
        {isSidebarOpen && user && (
          <div className="p-3 border-t border-sidebar-border/60 shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent/60 transition-colors cursor-pointer" onClick={() => navigate("/settings")}>
              <Avatar className="h-7 w-7 border border-primary/40 shrink-0">
                <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name || "User"}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN AREA ── */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-md px-6">
          <div className="flex-1 flex items-center gap-4">
            <form className="relative max-w-sm w-full" onSubmit={handleTopSearch}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => { setSearchDirty(true); setSearchInput(e.target.value); }}
                placeholder="Search songs, artists..."
                className="pl-9 h-9 bg-muted/40 border-border/50 rounded-full text-sm focus-visible:ring-primary/40"
              />
            </form>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-2 gap-2 hover:bg-muted rounded-full">
                  <Avatar className="h-7 w-7 border-2 border-primary/60">
                    <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm text-foreground truncate max-w-[120px]">
                    {user.name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/")}>Home</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/social")}>Social</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/sound-studio")}>Sound Studio</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/about">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
                  About
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-5">
                  Sign in
                </Button>
              </Link>
            </div>
          )}
        </header>

        {/* Free tier upgrade nudge — shown once per session */}
        {isFree && showUpgradeBanner && (
          <div className="border-b border-violet-500/20 bg-violet-500/5 px-4 py-2">
            <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-violet-300">
                <Crown className="h-4 w-4 shrink-0" />
                <span>You're on the <strong>Free plan</strong> — unlock all AI features with Premium.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-500 transition-colors"
                >
                  Upgrade
                </button>
                <button onClick={dismissBanner} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        {/* Page Content — keyed by location for fade-in on route change */}
        <main className="p-6 pb-32">
          <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── PLAYER BAR ── */}
      {currentTrack && (
        <div
          className="player-bar fixed bottom-0 right-0 z-50 border-t border-border/60 backdrop-blur-xl shadow-2xl"
          style={{
            left: isSidebarOpen ? 256 : 80,
            background: "linear-gradient(to right, hsl(224 28% 8%), hsl(250 22% 10%), hsl(224 28% 8%))",
          }}
        >
          {/* Accent progress line */}
          <div className="h-[2px] w-full bg-border/40 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-primary transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-2 md:gap-4 md:px-5 md:py-3">

            {/* Thumbnail — always visible */}
            <div className={`h-10 w-10 md:h-11 md:w-11 rounded-lg overflow-hidden bg-muted shrink-0 transition-all duration-300 ${isPlaying ? "shadow-glow-primary" : ""}`}>
              {currentTrack.image_url ? (
                <img src={currentTrack.image_url} alt={currentTrack.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-card">
                  <Music2 className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>

            {/* Track text — flex-1 on mobile (fills gap), fixed width on md+ */}
            <div className="flex-1 min-w-0 md:flex-none md:w-44 lg:w-64">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm text-foreground truncate">{currentTrack.title}</p>
                {isPlaying && (
                  <div className="flex items-end gap-[2px] h-3 shrink-0">
                    <span className="w-[2px] bg-primary rounded-full h-1.5 animate-wave-1" />
                    <span className="w-[2px] bg-secondary rounded-full h-2.5 animate-wave-2" />
                    <span className="w-[2px] bg-primary rounded-full h-3 animate-wave-3" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>

            {/* Controls
                Mobile:  inline row  [prev | play | next]
                md+:     flex-1 column  [shuffle prev play next repeat] / [seek bar]  */}
            <div className="flex flex-row items-center gap-0.5 shrink-0 md:flex-1 md:flex-col md:items-center md:gap-2 md:max-w-lg md:mx-auto md:shrink">
              <div className="flex items-center gap-0.5 md:gap-1">
                {/* Shuffle — lg+ only */}
                <Button
                  size="icon"
                  variant="ghost"
                  className={`hidden lg:inline-flex h-8 w-8 transition-colors ${isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={toggleShuffle}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </Button>

                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={prev}>
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-primary hover:opacity-90 shadow-glow-primary transition-transform active:scale-95"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>

                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={next}>
                  <SkipForward className="h-4 w-4" />
                </Button>

                {/* Repeat — lg+ only */}
                <Button
                  size="icon"
                  variant="ghost"
                  className={`hidden lg:inline-flex h-8 w-8 transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={cycleRepeat}
                >
                  <Repeat className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Seek bar — md+ only */}
              <div className="hidden md:flex items-center gap-2 w-full text-[11px] text-muted-foreground">
                <span className="tabular-nums w-8 text-right">{formatTime(progress)}</span>
                <Slider
                  value={[progress]}
                  max={duration || 1}
                  step={1}
                  onValueChange={(v) => seek(v[0] ?? 0)}
                  className="flex-1"
                />
                <span className="tabular-nums w-8">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume — lg+ only */}
            <div className="hidden lg:flex items-center gap-2 w-32 shrink-0">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Slider
                value={[Math.round(volume * 100)]}
                onValueChange={(v) => setVolume((v[0] ?? 0) / 100)}
                max={100}
                step={1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
