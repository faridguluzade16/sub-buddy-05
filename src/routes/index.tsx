import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { SummaryCards } from "@/components/SummaryCards";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { SubscriptionFormDialog } from "@/components/SubscriptionFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { daysUntil, type Subscription } from "@/lib/subscriptions";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Subtrack — Subscription Tracker" },
      {
        name: "description",
        content:
          "Track recurring subscriptions, monitor monthly and yearly spend, and never miss a renewal.",
      },
    ],
  }),
});

function Index() {
  const { subs, upsert, remove, hydrated } = useSubscriptions();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const sorted = useMemo(
    () =>
      [...subs].sort(
        (a, b) => daysUntil(a.renewalDate) - daysUntil(b.renewalDate),
      ),
    [subs],
  );

  const renewingSoon = sorted.filter((s) => {
    const d = daysUntil(s.renewalDate);
    return d >= 0 && d <= 7;
  });

  function handleAdd() {
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(sub: Subscription) {
    setEditing(sub);
    setOpen(true);
  }

  return (
    <div className="min-h-screen">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
              <span className="text-sm font-bold">S</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Subtrack
              </div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">
                Subscription tracker
              </div>
            </div>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <div className="mb-8 animate-[fade-in_0.4s_ease-out]">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your subscriptions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A quiet ledger of everything that auto-charges your card.
          </p>
        </div>

        {hydrated && subs.length === 0 ? (
          <div className="animate-[slide-up_0.5s_ease-out]">
            <EmptyState onAdd={handleAdd} />
          </div>
        ) : (
          <div className="space-y-10">
            <section className="animate-[slide-up_0.4s_ease-out]">
              <SummaryCards subs={subs} />
            </section>

            {renewingSoon.length > 0 && (
              <section className="animate-[slide-up_0.5s_ease-out]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                  </span>
                  <h2 className="text-sm font-medium text-foreground">
                    Renewing in the next 7 days
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {renewingSoon.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {renewingSoon.map((s) => (
                    <SubscriptionCard
                      key={s.id}
                      sub={s}
                      onEdit={handleEdit}
                      onDelete={remove}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="animate-[slide-up_0.6s_ease-out]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">
                  All subscriptions
                </h2>
                <span className="text-xs text-muted-foreground">
                  {subs.length} total
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((s) => (
                  <SubscriptionCard
                    key={s.id}
                    sub={s}
                    onEdit={handleEdit}
                    onDelete={remove}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <SubscriptionFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={upsert}
      />
    </div>
  );
}
