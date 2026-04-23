import { useEffect, useState, useCallback } from "react";
import {
  loadSubscriptions,
  saveSubscriptions,
  type Subscription,
} from "@/lib/subscriptions";

export function useSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSubs(loadSubscriptions());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSubscriptions(subs);
  }, [subs, hydrated]);

  const upsert = useCallback((sub: Subscription) => {
    setSubs((prev) => {
      const idx = prev.findIndex((s) => s.id === sub.id);
      if (idx === -1) return [sub, ...prev];
      const next = [...prev];
      next[idx] = sub;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { subs, upsert, remove, hydrated };
}
