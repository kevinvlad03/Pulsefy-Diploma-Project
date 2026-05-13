import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getToken, getUser, setUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { CheckCircle2, User, Crown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/subscription";
import { UpgradeModal } from "@/components/UpgradeModal";

type AccountUser = {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  created_at: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Settings() {
  const token = getToken();
  const storedUser = getUser();
  const [name, setName] = useState(storedUser?.name || "");
  const [bio, setBio] = useState(storedUser?.bio || "");
  const [savedMessage, setSavedMessage] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { tier, isFree } = useSubscription();

  const meQuery = useQuery({
    queryKey: ["settings-me"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/auth/me");
      return res.user as AccountUser;
    },
  });

  useEffect(() => {
    if (!meQuery.data) return;
    setName(meQuery.data.name || "");
    setBio(meQuery.data.bio || "");
  }, [meQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() || null }),
      });
      return res.user as AccountUser;
    },
    onSuccess: (user) => {
      setUser({ id: user.id, email: user.email, name: user.name, bio: user.bio });
      setSavedMessage("Profile updated successfully.");
      setTimeout(() => setSavedMessage(""), 4000);
    },
  });

  if (!token) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Sign in to access account settings.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  const displayName = meQuery.data?.name || storedUser?.name || "";
  const memberSince = meQuery.data?.created_at
    ? new Date(meQuery.data.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your public profile and account identity.</p>
      </div>

      {/* Account overview */}
      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary shrink-0">
            {displayName ? (
              <span className="text-2xl font-bold text-white">{initials(displayName)}</span>
            ) : (
              <User className="h-7 w-7 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground truncate">{displayName || "Loading…"}</p>
            <p className="text-sm text-muted-foreground truncate">{meQuery.data?.email || storedUser?.email}</p>
            {memberSince && (
              <p className="text-xs text-muted-foreground/70 mt-1">Member since {memberSince}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-violet-400" />
          Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <Badge className={tier === 'premium'
              ? "mt-1 bg-violet-500/20 text-violet-300 border-violet-500/30"
              : "mt-1 bg-muted/50 text-muted-foreground border-muted"
            }>
              {tier === 'premium' ? '✦ Premium' : 'Free'}
            </Badge>
          </div>
          {isFree ? (
            <Button onClick={() => setShowUpgrade(true)} className="bg-violet-600 hover:bg-violet-500 text-white">
              <Crown className="h-4 w-4 mr-2" /> Upgrade
            </Button>
          ) : (
            <p className="text-sm text-violet-400 flex items-center gap-1">
              <Check className="h-4 w-4" /> All features unlocked
            </p>
          )}
        </div>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      </Card>

      {/* Public Profile */}
      <Card className="p-6 bg-card border-border">
        <div className="mb-6">
          <p className="text-lg font-semibold text-foreground">Public Profile</p>
          <p className="text-sm text-muted-foreground mt-1">
            Visible to other users on the Social page and in profile previews.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Display Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => { setSavedMessage(""); setName(e.target.value); }}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-bio">Bio</Label>
              <span className={`text-xs tabular-nums ${bio.length > 260 ? "text-destructive" : "text-muted-foreground"}`}>
                {bio.length}/280
              </span>
            </div>
            <Textarea
              id="settings-bio"
              value={bio}
              onChange={(e) => { setSavedMessage(""); setBio(e.target.value); }}
              placeholder="Tell other users what you listen to or create."
              className="min-h-[110px] resize-none"
              maxLength={280}
            />
          </div>

          {saveMutation.isError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2">
              <p className="text-sm text-destructive">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to update profile."}
              </p>
            </div>
          )}

          {savedMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-primary">{savedMessage}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || name.trim().length < 2 || bio.length > 280}
            >
              {saveMutation.isPending ? "Saving…" : "Save Profile"}
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setName(meQuery.data?.name || storedUser?.name || "");
                setBio(meQuery.data?.bio || storedUser?.bio || "");
                setSavedMessage("");
              }}
              disabled={saveMutation.isPending}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
