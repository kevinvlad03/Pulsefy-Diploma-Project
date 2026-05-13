import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "./api";
import { getToken, setUser } from "./auth";

export type SubscriptionTier = 'free' | 'premium';

export function useSubscription() {
  const queryClient = useQueryClient();
  const token = getToken();

  const meQuery = useQuery({
    queryKey: ["subscription-me"],
    enabled: Boolean(token),
    staleTime: 60_000,
    queryFn: async () => {
      const res = await apiFetch("/auth/me");
      return res.user as { subscription_tier: SubscriptionTier };
    },
  });

  const tier: SubscriptionTier = meQuery.data?.subscription_tier ?? 'free';

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/auth/upgrade", { method: "POST" });
      return res.user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["subscription-me"] });
      queryClient.invalidateQueries({ queryKey: ["settings-me"] });
      toast.success("Welcome to Pulsefy Premium! All features unlocked.");
    },
    onError: () => {
      toast.error("Upgrade failed. Please try again.");
    },
  });

  return {
    tier,
    isPremium: tier === 'premium',
    isFree: tier === 'free',
    upgrade: () => upgradeMutation.mutate(),
    isUpgrading: upgradeMutation.isPending,
  };
}
