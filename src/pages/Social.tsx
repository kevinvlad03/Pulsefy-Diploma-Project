import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Users, UserPlus, UserCheck, Music2 } from "lucide-react";

type SocialUser = {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  created_at: string;
  followers_count: number;
  following_count?: number;
  public_playlists_count: number;
  is_following: boolean;
};

type PublicPlaylist = {
  id: string;
  name: string;
  description: string | null;
  track_count: number;
  created_at: string;
};

type ProfileResponse = {
  profile: SocialUser;
  playlists: PublicPlaylist[];
};

export default function Social() {
  const token = getToken();
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (selectedUserId) return;
    const firstFollowed = followingQuery.data?.[0]?.id;
    const firstDiscover = discoverQuery.data?.[0]?.id;
    if (firstFollowed || firstDiscover) {
      setSelectedUserId(firstFollowed || firstDiscover || null);
    }
  }, [discoverQuery.data, followingQuery.data, selectedUserId]);

  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      return apiFetch(`/social/follow/${userId}`, {
        method: isFollowing ? "DELETE" : "POST",
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["social-me"] }),
        queryClient.invalidateQueries({ queryKey: ["social-discover"] }),
        queryClient.invalidateQueries({ queryKey: ["social-following"] }),
        selectedUserId
          ? queryClient.invalidateQueries({ queryKey: ["social-profile", selectedUserId] })
          : Promise.resolve(),
      ]);
    },
  });

  if (!token) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Social</h1>
        <p className="text-muted-foreground">Sign in to discover people, follow profiles, and explore public playlists.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Social</h1>
          <p className="text-muted-foreground mt-2">Follow listeners, explore public playlists, and start building a network.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary">First Social Slice</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Followers" value={meQuery.data?.followers_count ?? 0} />
        <StatCard label="Following" value={meQuery.data?.following_count ?? 0} />
        <StatCard label="Public Playlists" value={meQuery.data?.public_playlists_count ?? 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-foreground">Discover People</h2>
              <Badge variant="outline">{discoverQuery.data?.length || 0} users</Badge>
            </div>

            {discoverQuery.isLoading && (
              <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
                Loading users...
              </Card>
            )}

            {!discoverQuery.isLoading && (discoverQuery.data || []).length === 0 && (
              <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
                No users to discover yet.
              </Card>
            )}

            <div className="grid gap-4">
              {(discoverQuery.data || []).map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  selected={selectedUserId === user.id}
                  onSelect={() => setSelectedUserId(user.id)}
                  onToggleFollow={() =>
                    followMutation.mutate({ userId: user.id, isFollowing: user.is_following })
                  }
                  busy={followMutation.isPending}
                />
              ))}
            </div>
          </section>

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
                    onToggleFollow={() =>
                      followMutation.mutate({ userId: user.id, isFollowing: user.is_following })
                    }
                    busy={followMutation.isPending}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Profile Preview</h2>
          {!selectedUserId && (
            <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
              Select a user to preview their profile and public playlists.
            </Card>
          )}

          {selectedUserId && profileQuery.isLoading && (
            <Card className="p-6 bg-card border-border text-sm text-muted-foreground">
              Loading profile...
            </Card>
          )}

          {profileQuery.data && (
            <Card className="p-6 bg-gradient-card border-border space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{profileQuery.data.profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profileQuery.data.profile.email}</p>
                  </div>
                  <Button
                    variant={profileQuery.data.profile.is_following ? "outline" : "default"}
                    className={profileQuery.data.profile.is_following ? "" : "bg-primary hover:bg-primary/90"}
                    onClick={() =>
                      followMutation.mutate({
                        userId: profileQuery.data!.profile.id,
                        isFollowing: profileQuery.data!.profile.is_following,
                      })
                    }
                    disabled={followMutation.isPending}
                  >
                    {profileQuery.data.profile.is_following ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profileQuery.data.profile.bio || "This user has not added a bio yet."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Followers" value={profileQuery.data.profile.followers_count} compact />
                <StatCard label="Following" value={profileQuery.data.profile.following_count ?? 0} compact />
                <StatCard label="Public Lists" value={profileQuery.data.profile.public_playlists_count} compact />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">Public Playlists</p>
                  <Badge variant="outline">{profileQuery.data.playlists.length}</Badge>
                </div>

                {profileQuery.data.playlists.length === 0 ? (
                  <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
                    No public playlists yet.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {profileQuery.data.playlists.map((playlist) => (
                      <Card key={playlist.id} className="p-4 bg-card/80 border-border">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Music2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{playlist.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {playlist.description || "No description"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {playlist.track_count} tracks
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

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
          <p className="text-sm text-muted-foreground truncate mt-1">{user.email}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {user.bio || "No bio yet."}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">{user.followers_count} followers</Badge>
            <Badge variant="outline">{user.public_playlists_count} public playlists</Badge>
          </div>
        </div>

        <Button
          variant={user.is_following ? "outline" : "default"}
          className={user.is_following ? "" : "bg-primary hover:bg-primary/90"}
          disabled={busy}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFollow();
          }}
        >
          {user.is_following ? (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Follow
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function StatCard({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  return (
    <Card className={`border-border ${compact ? "p-3 bg-card/80" : "p-5 bg-gradient-card"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </Card>
  );
}
