import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Subscription } from "@/lib/subscriptions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface DbRow {
  id: string;
  name: string;
  emoji: string;
  cost: number | string;
  currency: Subscription["currency"];
  billing_cycle: Subscription["cycle"];
  renewal_date: string;
  category: Subscription["category"];
  notes: string | null;
}

function fromRow(r: DbRow): Subscription {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    cost: typeof r.cost === "string" ? parseFloat(r.cost) : r.cost,
    currency: r.currency,
    cycle: r.billing_cycle,
    renewalDate: r.renewal_date,
    category: r.category,
    notes: r.notes ?? undefined,
  };
}

export function useSubscriptions() {
  const { user, loading: authLoading } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSubs([]);
      setHydrated(true);
      return;
    }
    let cancelled = false;
    setHydrated(false);
    supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("Couldn't load subscriptions");
        } else {
          setSubs((data ?? []).map((d) => fromRow(d as DbRow)));
        }
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const upsert = useCallback(
    async (sub: Subscription) => {
      if (!user) return;
      const exists = subs.some((s) => s.id === sub.id);
      const payload = {
        id: sub.id,
        user_id: user.id,
        name: sub.name,
        emoji: sub.emoji,
        cost: sub.cost,
        currency: sub.currency,
        billing_cycle: sub.cycle,
        renewal_date: sub.renewalDate,
        category: sub.category,
        notes: sub.notes ?? null,
      };
      // Optimistic
      setSubs((prev) => {
        const idx = prev.findIndex((s) => s.id === sub.id);
        if (idx === -1) return [sub, ...prev];
        const next = [...prev];
        next[idx] = sub;
        return next;
      });
      const { error } = exists
        ? await supabase
            .from("subscriptions")
            .update(payload)
            .eq("id", sub.id)
        : await supabase.from("subscriptions").insert(payload);
      if (error) toast.error("Couldn't save subscription");
    },
    [user, subs],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      setSubs((prev) => prev.filter((s) => s.id !== id));
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);
      if (error) toast.error("Couldn't delete subscription");
    },
    [user],
  );

  return { subs, upsert, remove, hydrated };
}
