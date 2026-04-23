import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  daysUntil,
  formatMoney,
  type Subscription,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

interface Props {
  sub: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

export function SubscriptionCard({ sub, onEdit, onDelete }: Props) {
  const days = daysUntil(sub.renewalDate);
  const soon = days >= 0 && days <= 7;
  const overdue = days < 0;

  const renewalLabel = overdue
    ? `Overdue by ${Math.abs(days)}d`
    : days === 0
      ? "Renews today"
      : days === 1
        ? "Renews tomorrow"
        : `In ${days} days`;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-card)]",
        soon && "border-warning/40 bg-warning/[0.03]",
        overdue && "border-destructive/40 bg-destructive/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl">
            {sub.emoji}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {sub.name}
            </div>
            <div className="text-xs text-muted-foreground">{sub.category}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onEdit(sub)}
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:text-destructive"
            onClick={() => onDelete(sub.id)}
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight text-foreground">
            {formatMoney(sub.cost, sub.currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            per {sub.cycle === "monthly" ? "month" : "year"}
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-xs font-medium",
              soon && "text-warning",
              overdue && "text-destructive",
              !soon && !overdue && "text-muted-foreground",
            )}
          >
            {renewalLabel}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {new Date(sub.renewalDate + "T00:00:00").toLocaleDateString(
              undefined,
              { month: "short", day: "numeric" },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
