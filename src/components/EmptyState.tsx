import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 px-8 py-20 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--primary-glow),transparent_60%)] opacity-30" />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          No subscriptions yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Start by adding your first recurring expense. We'll track renewals
          and surface what's coming up.
        </p>
        <Button onClick={onAdd} className="mt-6">
          <Plus className="mr-1.5 h-4 w-4" /> Add your first subscription
        </Button>
      </div>
    </div>
  );
}
