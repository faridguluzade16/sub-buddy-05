// Detects recurring subscriptions from bank statement text using Lovable AI.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Cap input size to keep tokens sane
    const truncated = text.length > 60000 ? text.slice(0, 60000) : text;

    const systemPrompt = `You are a financial analyst that extracts RECURRING SUBSCRIPTION charges from bank statement text.
A charge is recurring if the same merchant appears 2+ times at a regular interval (monthly or yearly), OR if it is a clearly known subscription service (Netflix, Spotify, Adobe, ChatGPT, iCloud, etc.) even if it appears once.
IGNORE: one-off purchases, transfers, ATM withdrawals, refunds, salary deposits, restaurants, gas stations, retail purchases.
Detect currency from symbols ($, €, £, ₼) or codes (USD, EUR, GBP, AZN). Default to USD if unclear.
Pick the latest charge date you can see for each merchant as the next renewal_date estimate (ISO yyyy-mm-dd).
Categorize as Entertainment, Productivity, Health, or Other.
Return ONLY via the tool call. If nothing recurring is found, return an empty array.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "report_subscriptions",
          description: "Report the detected recurring subscriptions.",
          parameters: {
            type: "object",
            properties: {
              subscriptions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Merchant / service name, cleaned up (e.g. 'Netflix' not 'NETFLIX.COM 866-...')." },
                    cost: { type: "number", description: "Charge amount per cycle." },
                    currency: { type: "string", enum: ["USD", "EUR", "GBP", "AZN"] },
                    cycle: { type: "string", enum: ["monthly", "yearly"] },
                    renewalDate: { type: "string", description: "Estimated next renewal date in yyyy-mm-dd format." },
                    category: { type: "string", enum: ["Entertainment", "Productivity", "Health", "Other"] },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["name", "cost", "currency", "cycle", "renewalDate", "category", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["subscriptions"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Bank statement text:\n\n${truncated}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_subscriptions" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let subscriptions: unknown[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        subscriptions = Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [];
      } catch (e) {
        console.error("Failed to parse tool args:", e);
      }
    }

    return new Response(JSON.stringify({ subscriptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-subscriptions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
