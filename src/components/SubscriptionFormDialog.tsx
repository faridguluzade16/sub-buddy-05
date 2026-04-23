import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  emojiFor,
  type BillingCycle,
  type Category,
  type Currency,
  type Subscription,
} from "@/lib/subscriptions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Subscription | null;
  onSave: (sub: Subscription) => void;
}

const CATEGORIES: Category[] = [
  "Entertainment",
  "Productivity",
  "Health",
  "Other",
];
const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "AZN"];
const EMOJIS = [
  "💳", "🎬", "🎧", "📺", "🎮", "📦", "📝", "🎨", "🐙", "🤖",
  "🧠", "💬", "📹", "📁", "☁️", "🔐", "🅰️", "🖌️", "📐", "🦉",
  "📖", "🧘", "🌙", "🚴", "🏃", "⌚", "📰", "🏰",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💳");
  const [emojiTouched, setEmojiTouched] = useState(false);
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [renewalDate, setRenewalDate] = useState(todayISO());
  const [category, setCategory] = useState<Category>("Entertainment");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setEmoji(initial?.emoji ?? "💳");
      setEmojiTouched(!!initial);
      setCost(initial ? String(initial.cost) : "");
      setCurrency(initial?.currency ?? "USD");
      setCycle(initial?.cycle ?? "monthly");
      setRenewalDate(initial?.renewalDate ?? todayISO());
      setCategory(initial?.category ?? "Entertainment");
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  // Auto-update emoji as the user types name, until they pick one manually.
  useEffect(() => {
    if (!emojiTouched && name) {
      setEmoji(emojiFor(name));
    }
  }, [name, emojiTouched]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(cost);
    if (!name.trim() || isNaN(parsed) || parsed < 0) return;

    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      emoji,
      cost: parsed,
      currency,
      cycle,
      renewalDate,
      category,
      notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit subscription" : "New subscription"}
          </DialogTitle>
          <DialogDescription>
            Track recurring expenses and never miss a renewal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-secondary/30 p-2 max-h-28 overflow-y-auto">
              {EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => {
                    setEmoji(e);
                    setEmojiTouched(true);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors ${
                    emoji === e
                      ? "bg-primary/20 ring-1 ring-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="9.99"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Billing cycle</Label>
              <Select
                value={cycle}
                onValueChange={(v) => setCycle(v as BillingCycle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewal">Next renewal</Label>
              <Input
                id="renewal"
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Family plan, shared with…"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {initial ? "Save changes" : "Add subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
