import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/pdf-extract";
import {
  emojiFor,
  formatMoney,
  type Subscription,
} from "@/lib/subscriptions";
import { toast } from "sonner";

interface DetectedSub {
  name: string;
  cost: number;
  currency: Subscription["currency"];
  cycle: Subscription["cycle"];
  renewalDate: string;
  category: Subscription["category"];
  confidence: "high" | "medium" | "low";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (sub: Subscription) => Promise<void> | void;
}

type Stage = "idle" | "extracting" | "detecting" | "review" | "importing";

export function ImportStatementDialog({ open, onOpenChange, onImport }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [detected, setDetected] = useState<DetectedSub[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("idle");
    setDetected([]);
    setSelected(new Set());
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File too large (max 15MB)");
      return;
    }
    try {
      setStage("extracting");
      const text = await extractPdfText(file);
      if (text.trim().length < 50) {
        toast.error("Couldn't extract text — is this a scanned PDF?");
        setStage("idle");
        return;
      }
      setStage("detecting");
      const { data, error } = await supabase.functions.invoke(
        "detect-subscriptions",
        { body: { text } },
      );
      if (error) {
        toast.error(error.message || "Detection failed");
        setStage("idle");
        return;
      }
      const subs = (data?.subscriptions ?? []) as DetectedSub[];
      if (subs.length === 0) {
        toast.info("No recurring subscriptions detected in this statement.");
        setStage("idle");
        return;
      }
      setDetected(subs);
      setSelected(new Set(subs.map((_, i) => i)));
      setStage("review");
    } catch (e) {
      console.error(e);
      toast.error("Failed to read PDF");
      setStage("idle");
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleImport() {
    setStage("importing");
    const picks = detected.filter((_, i) => selected.has(i));
    for (const d of picks) {
      const sub: Subscription = {
        id: crypto.randomUUID(),
        name: d.name,
        emoji: emojiFor(d.name),
        cost: d.cost,
        currency: d.currency,
        cycle: d.cycle,
        renewalDate: d.renewalDate,
        category: d.category,
      };
      await onImport(sub);
    }
    toast.success(`Imported ${picks.length} subscription${picks.length === 1 ? "" : "s"}`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Import from bank statement
          </DialogTitle>
          <DialogDescription>
            Upload a PDF bank statement. We'll detect recurring subscriptions
            automatically — no bank login needed.
          </DialogDescription>
        </DialogHeader>

        {stage === "idle" && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <FileUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drop a PDF here or click to choose</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Your file is processed locally; only extracted text is sent for analysis.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {(stage === "extracting" || stage === "detecting") && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">
              {stage === "extracting" ? "Reading PDF…" : "Detecting subscriptions…"}
            </div>
          </div>
        )}

        {stage === "review" && (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {detected.map((d, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
              >
                <Checkbox
                  checked={selected.has(i)}
                  onCheckedChange={() => toggle(i)}
                />
                <span className="text-xl">{emojiFor(d.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{d.name}</span>
                    <Badge
                      variant={d.confidence === "high" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {d.confidence}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(d.cost, d.currency)} / {d.cycle} · {d.category}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {stage === "importing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">Importing…</div>
          </div>
        )}

        {stage === "review" && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => reset()}>
              Start over
            </Button>
            <Button onClick={handleImport} disabled={selected.size === 0}>
              <Check className="mr-1 h-4 w-4" />
              Import {selected.size} selected
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
