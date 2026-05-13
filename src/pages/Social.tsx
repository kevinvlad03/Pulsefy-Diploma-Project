import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  Users, UserPlus, UserCheck, Music2, Heart, MessageCircle,
  Trophy, Bell, Trash2, Send, Zap, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialUser = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  created_at: string;
  followers_count: number;
  following_count?: number;
  public_playlists_count: number;
  generations_count: number;
  is_following: boolean;
};

type PublicPlaylist = {
  id: string;
  name: string;
  description: string | null;
  track_count: number;
  likes_count: number;
  liked_by_me: boolean;
  created_at: string;
};

type ProfileResponse = {
  profile: SocialUser;
  playlists: PublicPlaylist[];
};

type Comment = {
  id: string;
  user_id: string;
  user_name: string;
  body: string;
  created_at: string;
};

type Notification = {
  id: string;
  actor_id: string;
  actor_name: string;
  action_type: "follow" | "like" | "comment";
  target_id: string | null;
  is_read: boolean;
  created_at: string;
};

type LeaderboardUser = {
  id: string;
  name: string;
  bio: string | null;
  followers_count: number;
  generations_count: number;
};

type Tab = "discover" | "following" | "leaderboard" | "notifications";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Social() {
  const token = getToken();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ["social-me"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/social/me");
      return res.profile as SocialUser;
    },
  });

  const discoverQuery = useQuery({
    queryKey: ["social-discover"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/social/discover");
      return (res.users || []) as SocialUser[];
    },
  });

  const followingQuery = useQuery({
    queryKey: ["social-following"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/social/following");
      return (res.users || []) as SocialUser[];
    },
  });

  const profileQuery = useQuery({
    queryKey: ["social-profile", selectedUserId],
    enabled: Boolean(token) && Boolean(selectedUserId),
    queryFn: async () => {
      const res = await apiFetch(`/social/users/${selectedUserId}`);
      return res as ProfileResponse;
    },
  });

  const leaderboardQuery = useQuery({
    queryKey: ["social-leaderboard"],
    enabled: Boolean(token) && activeTab === "leaderboard",
    queryFn: async () => {
      const res = await apiFetch("/social/leaderboard");
      return (res.users || []) as LeaderboardUser[];
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["social-notifications"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/social/notifications");
      return (res.notifications || []) as Notification[];
    },
  });

  const unreadCount = (notificationsQuery.data || []).filter((n) => !n.is_read).length;

  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      apiFetch(`/social/follow/${userId}`, { method: isFollowing ? "DELETE" : "POST" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["social-me"] }),
        queryClient.invalidateQueries({ queryKey: ["social-discover"] }),
        queryClient.invalidateQueries({ queryKey: ["social-following"] }),
        queryClient.invalidateQueries({ queryKey: ["social-notifications"] }),
        selectedUserId
          ? queryClient.invalidateQueries({ queryKey: ["social-profile", selectedUserId] })
          : Promise.resolve(),
      ]);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ playlistId, liked }: { playlistId: string; liked: boolean }) =>
      apiFetch(`/social/playlists/${playlistId}/like`, { method: liked ? "DELETE" : "POST" }),
    onSuccess: () => {
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ["social-profile", selectedUserId] });
      }
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async () => apiFetch("/social/notifications/read", { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-notifications"] }),
  });

  const handleSelectUser = (id: string) => {
    setSelectedUserId(id);
    if (activeTab !== "discover" && activeTab !== "following") {
      setActiveTab("discover");
    }
  };

  if (!token) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Social</h1>
        <p className="text-muted-foreground">Sign in to discover people, follow profiles, and explore public playlists.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Social</h1>
          <p className="text-muted-foreground mt-2">Follow listeners, explore public playlists, and build your creative network.</p>
        </div>
      </div>

      {/* My Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Followers"       value={meQuery.data?.followers_count ?? 0} />
        <StatCard label="Following"       value={meQuery.data?.following_count ?? 0} />
        <StatCard label="Public Playlists" value={meQuery.data?.public_playlists_count ?? 0} />
        <StatCard label="Generations"     value={meQuery.data?.generations_count ?? 0} highlight />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-0">
        {(["discover", "following", "leaderboard", "notifications"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "notifications" && unreadCount > 0) {
                markReadMutation.mutate();
              }
            }}
            className={`relative px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "notifications" ? (
              <span className="flex items-center gap-1.5">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
            ) : tab === "leaderboard" ? (
              <span className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </span>
            ) : (
              tab.charAt(0).toUpperCase() + tab.slice(1)
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "leaderboard" ? (
        <LeaderboardPanel users={leaderboardQuery.data || []} loading={leaderboardQuery.isLoading} myId={meQuery.data?.id} />
      ) : activeTab === "notifications" ? (
        <NotificationsPanel notifications={notificationsQuery.data || []} loading={notificationsQuery.isLoading} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Left: User Lists */}
          <div className="space-y-6">
            {activeTab === "discover" && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-foreground">Discover People</h2>
                  <Badge variant="outline">{discoverQuery.data?.length || 0} users</Badge>
                </div>
                {discoverQuery.isLoading && (
                  <Card className="p-4 bg-card border-border text-sm text-muted-foreground">Loading users...</Card>
                )}
                {!discoverQuery.isLoading && (discoverQuery.data || []).length === 0 && (
                  <Card className="p-4 bg-card border-border text-sm text-muted-foreground">No users to discover yet.</Card>
                )}
                <div className="grid gap-4">
                  {(discoverQuery.data || []).map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      selected={selectedUserId === user.id}
                      onSelect={() => setSelectedUserId(user.id)}
                      onToggleFollow={() => followMutation.mutate({ userId: user.id, isFollowing: user.is_following })}
                      busy={followMutation.isPending}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeTab === "following" && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-foreground">Following</h2>
                  <Badge variant="outline">{followingQuery.data?.length || 0} profiles</Badge>
                </div>
                {(followingQuery.data || []).length === 0 ? (
                  <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
                    Follow a user to build your network.
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {(followingQuery.data || []).map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        selected={selectedUserId === user.id}
                        onSelect={() => setSelectedUserId(user.id)}
                        onToggleFollow={() => followMutation.mutate({ userId: user.id, isFollowing: user.is_following })}
                        busy={followMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right: Profile Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Profile Preview</h2>
            {!selectedUserId && (
              <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
                Select a user to preview their profile and public playlists.
              </Card>
            )}
            {selectedUserId && profileQuery.isLoading && (
              <Card className="p-6 bg-card border-border text-sm text-muted-foreground">Loading profile...</Card>
            )}
            {selectedUserId && profileQuery.data && (
              <ProfilePreview
                profile={profileQuery.data.profile}
                playlists={profileQuery.data.playlists}
                currentUserId={meQuery.data?.id ?? ""}
                onToggleFollow={() =>
                  followMutation.mutate({
                    userId: profileQuery.data!.profile.id,
                    isFollowing: profileQuery.data!.profile.is_following,
                  })
                }
                onToggleLike={(playlistId, liked) => likeMutation.mutate({ playlistId, liked })}
                followBusy={followMutation.isPending}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProfilePreview ───────────────────────────────────────────────────────────

function ProfilePreview({
  profile,
  playlists,
  currentUserId,
  onToggleFollow,
  onToggleLike,
  followBusy,
}: {
  profile: SocialUser;
  playlists: PublicPlaylist[];
  currentUserId: string;
  onToggleFollow: () => void;
  onToggleLike: (playlistId: string, liked: boolean) => void;
  followBusy: boolean;
}) {
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);

  return (
    <Card className="p-6 bg-gradient-card border-border space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary shrink-0">
              {profile.name ? (
                <span className="text-lg font-bold text-white">{profile.name[0].toUpperCase()}</span>
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-foreground truncate">{profile.name}</p>
              <p className="text-xs text-muted-foreground">
                Member since {new Date(profile.created_at).getFullYear()}
              </p>
            </div>
          </div>
          <Button
            variant={profile.is_following ? "outline" : "default"}
            className={profile.is_following ? "" : "bg-primary hover:bg-primary/90"}
            onClick={onToggleFollow}
            disabled={followBusy}
          >
            {profile.is_following ? (
              <><UserCheck className="h-4 w-4 mr-2" />Following</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" />Follow</>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {profile.bio || "This user has not added a bio yet."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Followers"    value={profile.followers_count}       compact />
        <StatCard label="Following"    value={profile.following_count ?? 0}  compact />
        <StatCard label="Public Lists" value={profile.public_playlists_count} compact />
        <StatCard label="Generations"  value={profile.generations_count}     compact highlight />
      </div>

      {/* Public Playlists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-foreground">Public Playlists</p>
          <Badge variant="outline">{playlists.length}</Badge>
        </div>

        {playlists.length === 0 ? (
          <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
            No public playlists yet.
          </Card>
        ) : (
          <div className="space-y-3">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="space-y-2">
                <Card className="p-4 bg-card/80 border-border">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{playlist.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {playlist.description || "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {playlist.track_count} tracks
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Like button */}
                      <button
                        onClick={() => onToggleLike(playlist.id, playlist.liked_by_me)}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          playlist.liked_by_me
                            ? "text-red-500 hover:text-red-400"
                            : "text-muted-foreground hover:text-red-500"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${playlist.liked_by_me ? "fill-current" : ""}`} />
                        <span>{playlist.likes_count}</span>
                      </button>
                      {/* Comments toggle */}
                      <button
                        onClick={() =>
                          setExpandedPlaylistId(
                            expandedPlaylistId === playlist.id ? null : playlist.id
                          )
                        }
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>

                {expandedPlaylistId === playlist.id && (
                  <div className="ml-4 border-l-2 border-border pl-4">
                    <PlaylistComments playlistId={playlist.id} currentUserId={currentUserId} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── PlaylistComments ─────────────────────────────────────────────────────────

function PlaylistComments({ playlistId, currentUserId }: { playlistId: string; currentUserId: string }) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["playlist-comments", playlistId],
    queryFn: async () => {
      const res = await apiFetch(`/social/playlists/${playlistId}/comments`);
      return (res.comments || []) as Comment[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (text: string) =>
      apiFetch(`/social/playlists/${playlistId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["playlist-comments", playlistId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) =>
      apiFetch(`/social/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-comments", playlistId] });
    },
  });

  return (
    <div className="space-y-3">
      {commentsQuery.isLoading && (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      )}

      {!commentsQuery.isLoading && (commentsQuery.data || []).length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
      )}

      <div className="space-y-2">
        {(commentsQuery.data || []).map((comment) => (
          <div key={comment.id} className="flex items-start gap-2 group">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground">{comment.user_name} </span>
              <span className="text-xs text-muted-foreground">{comment.body}</span>
            </div>
            {comment.user_id === currentUserId && (
              <button
                onClick={() => deleteMutation.mutate(comment.id)}
                disabled={deleteMutation.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add comment */}
      <div className="flex gap-2 pt-1">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && body.trim()) {
              e.preventDefault();
              addMutation.mutate(body.trim());
            }
          }}
          placeholder="Add a comment…"
          maxLength={500}
          className="flex-1 bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          size="sm"
          className="h-8 px-2 bg-primary hover:bg-primary/90"
          disabled={!body.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate(body.trim())}
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── LeaderboardPanel ─────────────────────────────────────────────────────────

function LeaderboardPanel({
  users,
  loading,
  myId,
}: {
  users: LeaderboardUser[];
  loading: boolean;
  myId?: string;
}) {
  if (loading) {
    return (
      <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
        Loading leaderboard…
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
        No generations yet. Be the first to create something!
      </Card>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Ranked by total completed AI generations (music, video, voiceover).
      </p>
      <div className="grid gap-3">
        {users.map((user, idx) => (
          <Card
            key={user.id}
            className={`p-4 border-border flex items-center gap-4 ${
              user.id === myId ? "bg-primary/5 border-primary/40" : "bg-card"
            }`}
          >
            <div className="w-8 text-center shrink-0">
              {idx < 3 ? (
                <span className="text-xl">{medals[idx]}</span>
              ) : (
                <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {user.name}
                {user.id === myId && (
                  <Badge className="ml-2 bg-primary/10 text-primary border-primary text-[10px]">You</Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.bio || "No bio"}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-right">
              <div>
                <p className="text-lg font-bold text-foreground flex items-center gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  {user.generations_count}
                </p>
                <p className="text-xs text-muted-foreground">generations</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{user.followers_count}</p>
                <p className="text-xs text-muted-foreground">followers</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── NotificationsPanel ───────────────────────────────────────────────────────

function NotificationsPanel({
  notifications,
  loading,
}: {
  notifications: Notification[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
        Loading notifications…
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
        No notifications yet. When someone follows you or interacts with your playlists, it will show here.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <Card
          key={n.id}
          className={`p-4 border-border flex items-center gap-3 ${
            n.is_read ? "bg-card" : "bg-primary/5 border-primary/30"
          }`}
        >
          <div className="shrink-0">
            {n.action_type === "follow" && <UserPlus className="h-5 w-5 text-primary" />}
            {n.action_type === "like"   && <Heart className="h-5 w-5 text-red-500" />}
            {n.action_type === "comment" && <MessageCircle className="h-5 w-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{n.actor_name}</span>
              {n.action_type === "follow"  && " started following you"}
              {n.action_type === "like"    && " liked your playlist"}
              {n.action_type === "comment" && " commented on your playlist"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(n.created_at).toLocaleDateString(undefined, {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          {!n.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({
  user,
  selected,
  onSelect,
  onToggleFollow,
  busy,
}: {
  user: SocialUser;
  selected: boolean;
  onSelect: () => void;
  onToggleFollow: () => void;
  busy: boolean;
}) {
  return (
    <Card
      className={`p-5 border-border cursor-pointer transition-all ${
        selected ? "bg-gradient-card shadow-glow-primary" : "bg-card hover:bg-muted/40"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <p className="font-semibold text-foreground truncate">{user.name}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio || "No bio yet."}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">{user.followers_count} followers</Badge>
            <Badge variant="outline">{user.public_playlists_count} playlists</Badge>
            <Badge variant="outline" className="text-primary border-primary/40">
              <Zap className="h-3 w-3 mr-1" />
              {user.generations_count} generations
            </Badge>
          </div>
        </div>

        <Button
          variant={user.is_following ? "outline" : "default"}
          className={user.is_following ? "" : "bg-primary hover:bg-primary/90"}
          disabled={busy}
          onClick={(e) => { e.stopPropagation(); onToggleFollow(); }}
        >
          {user.is_following ? (
            <><UserCheck className="h-4 w-4 mr-2" />Following</>
          ) : (
            <><UserPlus className="h-4 w-4 mr-2" />Follow</>
          )}
        </Button>
      </div>
    </Card>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  compact = false,
  highlight = false,
}: {
  label: string;
  value: number;
  compact?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={`border-border ${compact ? "p-3 bg-card/80" : "p-5 bg-gradient-card"} ${highlight ? "border-primary/40" : ""}`}>
      <p className={`text-sm ${highlight ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </Card>
  );
}
