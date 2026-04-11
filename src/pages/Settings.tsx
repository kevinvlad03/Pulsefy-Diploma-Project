import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getToken, getUser, setUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type AccountUser = {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  created_at: string;
};

export default function Settings() {
  const token = getToken();
  const storedUser = getUser();
  const [name, setName] = useState(storedUser?.name || "");
  const [bio, setBio] = useState(storedUser?.bio || "");
  const [savedMessage, setSavedMessage] = useState("");

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
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || null,
        }),
      });
      return res.user as AccountUser;
    },
    onSuccess: (user) => {
      setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
      });
      setSavedMessage("Profile updated.");
    },
  });

  if (!token) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Sign in to access account settings.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your public profile and account identity.</p>
      </div>

      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="text-lg font-semibold text-foreground">
              {meQuery.data?.name || storedUser?.name || "Loading..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {meQuery.data?.email || storedUser?.email || ""}
            </p>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border space-y-5">
        <div>
          <p className="text-lg font-semibold text-foreground">Public Profile</p>
          <p className="text-sm text-muted-foreground mt-1">
            This information is used across social discovery and profile previews.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-name">Display Name</Label>
          <Input
            id="settings-name"
            value={name}
            onChange={(event) => {
              setSavedMessage("");
              setName(event.target.value);
            }}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-bio">Bio</Label>
          <Textarea
            id="settings-bio"
            value={bio}
            onChange={(event) => {
              setSavedMessage("");
              setBio(event.target.value);
            }}
            placeholder="Tell other users what you listen to or create."
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">{bio.length}/280</p>
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-destructive">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to update profile."}
          </p>
        )}

        {savedMessage && <p className="text-sm text-muted-foreground">{savedMessage}</p>}

        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || name.trim().length < 2 || bio.length > 280}
        >
          {saveMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </Card>
    </div>
  );
}
