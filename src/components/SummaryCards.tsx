import {
  formatMoney,
  monthlyCost,
  yearlyCost,
  type Subscription,
} from "@/lib/subscriptions";

interface Props {
  subs: Subscription[];
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      )}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export function SummaryCards({ subs }: Props) {
  // Normalize totals into a base display currency (USD) only when mixed currencies.
  // For simplicity, display totals in the most common currency.
  const currencyCount = subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.currency] = (acc[s.currency] ?? 0) + 1;
    return acc;
  }, {});
  const baseCurrency =
    (Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] as
      | Subscription["currency"]
      | undefined) ?? "USD";

  const sameCurrency = subs.filter((s) => s.currency === baseCurrency);
  const monthly = sameCurrency.reduce((sum, s) => sum + monthlyCost(s), 0);
  const yearly = sameCurrency.reduce((sum, s) => sum + yearlyCost(s), 0);

  const mostExpensive = [...subs].sort(
    (a, b) => monthlyCost(b) - monthlyCost(a),
  )[0];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Monthly"
        value={formatMoney(monthly, baseCurrency)}
        hint={
          subs.length !== sameCurrency.length
            ? `${baseCurrency} subs only`
            : "across all plans"
        }
      />
      <Stat
        label="Yearly"
        value={formatMoney(yearly, baseCurrency)}
        hint="projected spend"
      />
      <Stat label="Active" value={String(subs.length)} hint="subscriptions" />
      <Stat
        label="Top spend"
        value={
          mostExpensive
            ? `${mostExpensive.emoji} ${mostExpensive.name}`
            : "—"
        }
        hint={
          mostExpensive
            ? `${formatMoney(monthlyCost(mostExpensive), mostExpensive.currency)}/mo`
            : "no data"
        }
      />
    </div>
  );
}
