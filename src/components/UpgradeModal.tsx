import { Crown, Check, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/subscription";

const BENEFITS = [
  "AI Music Generation with MusicGen (Small, Medium, Large)",
  "Text-to-Speech in 8+ languages",
  "Video ads with up to 4 scenes",
  "Priority processing queue",
  "All future premium features",
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { upgrade, isUpgrading, isPremium } = useSubscription();

  function handleUpgrade() {
    upgrade();
    setTimeout(onClose, 1200);
  }

  if (isPremium && open) {
    onClose();
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border bg-card p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-violet-600/30 via-primary/20 to-secondary/20 p-7 pb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 ring-1 ring-violet-500/40">
              <Crown className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <Badge className="mb-1 bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">Premium</Badge>
              <h2 className="text-xl font-bold text-foreground">Unlock Pulsefy Premium</h2>
            </div>
          </div>
          <p className="relative mt-3 text-sm text-muted-foreground">
            Get full access to all AI generation tools with no restrictions.
          </p>
        </div>

        <div className="p-7 pt-5 space-y-5">
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                  <Check className="h-3 w-3 text-violet-400" />
                </div>
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/25"
            onClick={handleUpgrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Upgrading…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Upgrade Now — Free Demo
              </span>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No payment required — this is a demo upgrade for the thesis project.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
