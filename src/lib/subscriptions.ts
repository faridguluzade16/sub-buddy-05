export type BillingCycle = "monthly" | "yearly";
export type Currency = "USD" | "EUR" | "GBP" | "AZN";
export type Category = "Entertainment" | "Productivity" | "Health" | "Other";

export interface Subscription {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  currency: Currency;
  cycle: BillingCycle;
  renewalDate: string; // ISO date (yyyy-mm-dd)
  category: Category;
  notes?: string;
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AZN: "₼",
};

const EMOJI_MAP: Record<string, string> = {
  netflix: "🎬",
  spotify: "🎧",
  youtube: "📺",
  "youtube premium": "📺",
  "apple music": "🎵",
  "amazon prime": "📦",
  "prime video": "🎞️",
  disney: "🏰",
  "disney+": "🏰",
  hbo: "🎭",
  hulu: "📺",
  notion: "📝",
  figma: "🎨",
  github: "🐙",
  "chatgpt": "🤖",
  openai: "🤖",
  claude: "🧠",
  slack: "💬",
  zoom: "📹",
  dropbox: "📁",
  "google one": "☁️",
  icloud: "☁️",
  "1password": "🔐",
  bitwarden: "🔐",
  adobe: "🅰️",
  canva: "🖌️",
  linear: "📐",
  vercel: "▲",
  netlify: "🌐",
  cloudflare: "☁️",
  "apple tv": "📺",
  twitch: "🎮",
  "xbox game pass": "🎮",
  playstation: "🎮",
  steam: "🎮",
  duolingo: "🦉",
  audible: "🎧",
  kindle: "📖",
  medium: "📰",
  nyt: "📰",
  peloton: "🚴",
  strava: "🏃",
  fitbit: "⌚",
  headspace: "🧘",
  calm: "🌙",
};

export function emojiFor(name: string): string {
  const key = name.trim().toLowerCase();
  if (EMOJI_MAP[key]) return EMOJI_MAP[key];
  for (const k of Object.keys(EMOJI_MAP)) {
    if (key.includes(k)) return EMOJI_MAP[k];
  }
  return "💳";
}

export function monthlyCost(s: Subscription): number {
  return s.cycle === "monthly" ? s.cost : s.cost / 12;
}

export function yearlyCost(s: Subscription): number {
  return s.cycle === "yearly" ? s.cost : s.cost * 12;
}

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatMoney(amount: number, currency: Currency): string {
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STORAGE_KEY = "subtrack:subscriptions:v1";

export function loadSubscriptions(): Subscription[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Subscription[];
  } catch {
    return [];
  }
}

export function saveSubscriptions(subs: Subscription[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}
