import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { clearToken, clearUser, getUser } from "@/lib/auth";
import { usePlayer } from "@/lib/player";
import {
  Home,
  Music,
  Sparkles,
  TestTube,
  Settings,
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
} from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: Music },
  { to: "/player", label: "Player", icon: Music },
  { to: "/ai-recommendations", label: "AI Recommendations", icon: Sparkles },
  { to: "/ai-generator", label: "Song Generator", icon: Sparkles },
  { to: "/test", label: "Test Lab", icon: TestTube },
  { to: "/admin", label: "Admin", icon: Settings },
];

export const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const isLanding = location.pathname === "/";
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

  if (isLanding) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {isSidebarOpen && (
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Pulsefy
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto hover:bg-sidebar-accent"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="space-y-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all"
              activeClassName="bg-sidebar-accent text-primary font-medium shadow-glow-primary"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isSidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-6">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs, artists, playlists..."
                className="pl-10 bg-background/50 border-border"
              />
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearToken();
                  clearUser();
                }}
              >
                Sign out
              </Button>
              <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarFallback className="bg-gradient-primary text-white">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Sign in
              </Button>
            </Link>
          )}
        </header>

        {/* Page Content */}
        <main className="p-6 pb-28">
          <Outlet />
        </main>
      </div>

      {currentTrack && (
        <div
          className="fixed bottom-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl shadow-2xl"
          style={{ left: isSidebarOpen ? 256 : 80 }}
        >
          <div className="flex flex-col gap-2 px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                  {currentTrack.image_url ? (
                    <img
                      src={currentTrack.image_url}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Music2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{currentTrack.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center">
                <Button
                  size="icon"
                  variant="ghost"
                  className={isShuffle ? "text-primary" : ""}
                  onClick={toggleShuffle}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={prev}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-glow-primary"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" onClick={next}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={repeatMode !== "off" ? "text-primary" : ""}
                  onClick={cycleRepeat}
                >
                  <Repeat className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full lg:w-48">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[Math.round(volume * 100)]}
                  onValueChange={(value) => setVolume((value[0] ?? 0) / 100)}
                  max={100}
                  step={1}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">{formatTime(progress)}</span>
              <Slider
                value={[progress]}
                max={duration || 1}
                step={1}
                onValueChange={(value) => seek(value[0] ?? 0)}
              />
              <span className="tabular-nums">{formatTime(duration)}</span>
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
