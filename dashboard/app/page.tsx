"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { addDays, format, isBefore, differenceInDays } from "date-fns";
import {
  Brain, Flame, Coffee, CreditCard,
  Calendar, X, MapPin, Clock, BarChart2, Zap,
} from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  date:      string;
  terminal:  string;
  amount:    number;
  isDeposit: boolean;
  category:  string;
}

interface Persona {
  title:       string;
  emoji:       string;
  description: string;
  gradient:    string;
  ring:        string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY   = "watcard-txns-v1";
const TIMESTAMP_KEY = "watcard-ts-v1";
const BALANCE_KEY   = "watcard-bal-v1";

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: "#3b82f6",
  Dining:    "#f59e0b",
  Laundry:   "#8b5cf6",
  Academic:  "#10b981",
  Other:     "#6b7280",
};

const TOD_COLORS: Record<string, string> = {
  Morning:      "#f59e0b",
  Lunch:        "#3b82f6",
  Dinner:       "#f97316",
  "Late Night": "#6366f1",
};

// ─── Framer Motion Variants ───────────────────────────────────────────────────

const STAGGER: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const FADE_UP: Variants = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

// ─── Recharts Dark Tooltip Style ──────────────────────────────────────────────

const TT = {
  backgroundColor: "#1a2035",
  border:          "1px solid rgba(255,255,255,0.08)",
  borderRadius:    "12px",
  boxShadow:       "0 20px 40px rgba(0,0,0,0.6)",
  color:           "#f1f5f9",
  fontSize:        "12px",
};

// ─── Pure Helper Functions ────────────────────────────────────────────────────

/** "01481 : POS-FS-UWP MARKET-37" → "UWP MARKET" */
function cleanTerminal(raw: string): string {
  const after = raw.includes(":")
    ? raw.split(":").slice(1).join(":").trim()
    : raw.trim();
  return after
    .replace(/^POS-FS-/i, "")
    .replace(/-\d+$/, "")
    .replace(/-$/, "")
    .trim();
}

/** "2026-02-25 22:21:45" → "Feb 25" */
function formatDay(dateStr: string): string {
  const ymd = dateStr.split(" ")[0];
  if (!ymd) return "";
  const [, mm, dd] = ymd.split("-");
  const M = ["Jan","Feb","Mar","Apr","May","Jun",
             "Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${M[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}`;
}

function getTimeBucket(dateStr: string): "Morning" | "Lunch" | "Dinner" | "Late Night" {
  const h = parseInt((dateStr.split(" ")[1] ?? "0").split(":")[0], 10);
  if (h >=  5 && h < 11) return "Morning";
  if (h >= 11 && h < 16) return "Lunch";
  if (h >= 16 && h < 21) return "Dinner";
  return "Late Night";
}

/**
 * Evaluates spending patterns and returns a dynamic persona.
 * Checks are ordered by specificity — most dramatic habits surface first.
 */
function getPersona(p: {
  totalSpent:     number;
  coffeeTax:      number;
  junkFoodTax:    number;
  lateNightSpend: number;
  dailyBurnRate:  number;
  diningTotal:    number;
  groceriesTotal: number;
  academicTotal:  number;
}): Persona {
  const { totalSpent, coffeeTax, junkFoodTax, lateNightSpend,
          dailyBurnRate, diningTotal, groceriesTotal, academicTotal } = p;

  const lnPct    = totalSpent > 0 ? lateNightSpend / totalSpent : 0;
  const coffPct  = totalSpent > 0 ? coffeeTax      / totalSpent : 0;
  const dinePct  = totalSpent > 0 ? diningTotal    / totalSpent : 0;
  const grocPct  = totalSpent > 0 ? groceriesTotal / totalSpent : 0;

  if (lnPct > 0.25)
    return {
      title:       "The Midnight Snacker",
      emoji:       "🌙",
      description: `${(lnPct * 100).toFixed(0)}% of spending happens after 9 PM`,
      gradient:    "from-indigo-950 to-purple-950",
      ring:        "ring-indigo-500/30",
    };

  if (coffeeTax > 80 || coffPct > 0.15)
    return {
      title:       "The Caffeine Addict",
      emoji:       "☕",
      description: `$${coffeeTax.toFixed(2)} poured into coffee shops`,
      gradient:    "from-amber-950 to-orange-950",
      ring:        "ring-amber-500/30",
    };

  if (junkFoodTax > 40)
    return {
      title:       "The Late-Night Gourmet",
      emoji:       "🍟",
      description: `$${junkFoodTax.toFixed(2)} in late-night dining runs`,
      gradient:    "from-rose-950 to-red-950",
      ring:        "ring-rose-500/30",
    };

  if (dinePct > 0.55)
    return {
      title:       "The Campus Foodie",
      emoji:       "🍜",
      description: `${(dinePct * 100).toFixed(0)}% of budget spent dining out`,
      gradient:    "from-orange-950 to-yellow-950",
      ring:        "ring-orange-500/30",
    };

  if (grocPct > 0.45)
    return {
      title:       "The Smart Shopper",
      emoji:       "🛒",
      description: `${(grocPct * 100).toFixed(0)}% on groceries — impressively frugal`,
      gradient:    "from-emerald-950 to-teal-950",
      ring:        "ring-emerald-500/30",
    };

  if (academicTotal > 25)
    return {
      title:       "The Scholar",
      emoji:       "📚",
      description: `$${academicTotal.toFixed(2)} invested in academic tools`,
      gradient:    "from-blue-950 to-cyan-950",
      ring:        "ring-blue-500/30",
    };

  if (dailyBurnRate < 8)
    return {
      title:       "The Budget Master",
      emoji:       "💰",
      description: `Only $${dailyBurnRate.toFixed(2)}/day — most frugal on campus`,
      gradient:    "from-green-950 to-emerald-950",
      ring:        "ring-green-500/30",
    };

  return {
    title:       "The Campus Explorer",
    emoji:       "🎓",
    description: "Well-rounded spending across the University of Waterloo",
    gradient:    "from-slate-900 to-gray-900",
    ring:        "ring-slate-500/20",
  };
}

// ─── Shared card shell ────────────────────────────────────────────────────────

const CARD = "rounded-2xl border border-white/[0.10] bg-white/[0.04] backdrop-blur-sm";

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [raw,          setRaw]          = useState("");
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error,        setError]        = useState("");
  const [lastUpdated,  setLastUpdated]  = useState<string | null>(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [animKey,      setAnimKey]      = useState(0);

  // Hydrate from localStorage on first client render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) { setTransactions(parsed); setAnimKey(1); }
      }
      const ts  = localStorage.getItem(TIMESTAMP_KEY);
      if (ts)  setLastUpdated(ts);
      const bal = localStorage.getItem(BALANCE_KEY);
      if (bal) setBalanceInput(bal);
    } catch { /* ignore corrupted data */ }
  }, []);

  // Persist balance input whenever it changes
  useEffect(() => {
    if (balanceInput) localStorage.setItem(BALANCE_KEY, balanceInput);
    else              localStorage.removeItem(BALANCE_KEY);
  }, [balanceInput]);

  function handleGenerate() {
    if (!raw.trim()) { setError("Paste your JSON data first."); return; }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) { setError("Expected a JSON array."); return; }
      const ts = new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
      localStorage.setItem(STORAGE_KEY,   JSON.stringify(parsed));
      localStorage.setItem(TIMESTAMP_KEY, ts);
      setLastUpdated(ts);
      setTransactions(parsed as Transaction[]);
      setAnimKey(k => k + 1);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function handleClear() {
    [STORAGE_KEY, TIMESTAMP_KEY, BALANCE_KEY].forEach(k => localStorage.removeItem(k));
    setTransactions(null);
    setRaw("");
    setLastUpdated(null);
    setBalanceInput("");
    setError("");
  }

  // ── Core derivations ─────────────────────────────────────────────────────────

  const purchases = useMemo(
    () => (transactions ?? []).filter(t => !t.isDeposit),
    [transactions]
  );

  const elapsedDays = useMemo(() => {
    if (!purchases.length) return 1;
    const ymd = purchases.map(t => t.date.split(" ")[0]).sort();
    const ms  = new Date(ymd[ymd.length - 1]).getTime() - new Date(ymd[0]).getTime();
    return Math.max(1, Math.round(ms / 86_400_000));
  }, [purchases]);

  const dateRange = useMemo(() => {
    if (!purchases.length) return "";
    const ymd = purchases.map(t => t.date.split(" ")[0]).sort();
    return `${formatDay(ymd[0])} – ${formatDay(ymd[ymd.length - 1])}`;
  }, [purchases]);

  const totalSpent = useMemo(
    () => purchases.reduce((s, t) => s + t.amount, 0),
    [purchases]
  );

  const dailyBurnRate = elapsedDays > 0 ? totalSpent / elapsedDays : 0;

  const coffeeTax = useMemo(() =>
    purchases
      .filter(t => {
        const u = t.terminal.toUpperCase();
        return u.includes("STARBUCKS") || u.includes("TH-") ||
               u.includes("TH ") || u.includes("WILLIAMS");
      })
      .reduce((s, t) => s + t.amount, 0),
  [purchases]);

  // Late-night dining only
  const junkFoodTax = useMemo(() =>
    purchases
      .filter(t => getTimeBucket(t.date) === "Late Night" && t.category === "Dining")
      .reduce((s, t) => s + t.amount, 0),
  [purchases]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [purchases]);

  // Persona — self-contained so deps are minimal
  const persona = useMemo(() => {
    const lateNightSpend = purchases
      .filter(t => getTimeBucket(t.date) === "Late Night")
      .reduce((s, t) => s + t.amount, 0);
    return getPersona({
      totalSpent,
      coffeeTax,
      junkFoodTax,
      lateNightSpend,
      dailyBurnRate,
      diningTotal:    categoryTotals.find(c => c.name === "Dining")?.total    ?? 0,
      groceriesTotal: categoryTotals.find(c => c.name === "Groceries")?.total ?? 0,
      academicTotal:  categoryTotals.find(c => c.name === "Academic")?.total  ?? 0,
    });
  }, [purchases, categoryTotals, totalSpent, coffeeTax, junkFoodTax, dailyBurnRate]);

  // Runway forecast
  const { runoutDate, daysLeft, runningOut } = useMemo(() => {
    const now = new Date();
    // Semester end: April 30 if Jan–Apr, else Dec 15
    const semEnd = now.getMonth() <= 3
      ? new Date(now.getFullYear(), 3, 30)
      : new Date(now.getFullYear(), 11, 15);
    const bal   = parseFloat(balanceInput) || 0;
    const rDays = bal > 0 && dailyBurnRate > 0 ? bal / dailyBurnRate : 0;
    const rDate = rDays > 0 ? addDays(now, rDays) : null;
    return {
      runoutDate: rDate,
      daysLeft:   rDate ? differenceInDays(rDate, now) : null,
      runningOut: rDate ? isBefore(rDate, semEnd) : false,
    };
  }, [balanceInput, dailyBurnRate]);

  // Daily spend trend for AreaChart
  const dailySpend = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach(t => {
      const day = t.date.split(" ")[0];
      map[day] = (map[day] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, total]) => ({ day: formatDay(day), total }));
  }, [purchases]);

  // Weekday vs Weekend — average spend per active day in each group
  const weekdayWeekend = useMemo(() => {
    const wdMap: Record<string, number> = {};
    const weMap: Record<string, number> = {};
    purchases.forEach(t => {
      const ymd  = t.date.split(" ")[0];
      const [yr, mo, dy] = ymd.split("-").map(Number);
      const isWE = new Date(yr, mo - 1, dy).getDay() % 6 === 0; // 0=Sun, 6=Sat
      if (isWE) weMap[ymd] = (weMap[ymd] ?? 0) + t.amount;
      else      wdMap[ymd] = (wdMap[ymd] ?? 0) + t.amount;
    });
    const wdTotal = Object.values(wdMap).reduce((s, v) => s + v, 0);
    const weTotal = Object.values(weMap).reduce((s, v) => s + v, 0);
    const wdCount = Object.keys(wdMap).length;
    const weCount = Object.keys(weMap).length;
    return [
      { name: "Weekday", avg: wdCount > 0 ? wdTotal / wdCount : 0, total: wdTotal },
      { name: "Weekend", avg: weCount > 0 ? weTotal / weCount : 0, total: weTotal },
    ];
  }, [purchases]);

  // Time of day
  const timeOfDay = useMemo(() => {
    const map: Record<string, number> = { Morning: 0, Lunch: 0, Dinner: 0, "Late Night": 0 };
    purchases.forEach(t => { map[getTimeBucket(t.date)] += t.amount; });
    return (["Morning", "Lunch", "Dinner", "Late Night"] as const)
      .map(name => ({ name, total: map[name] }));
  }, [purchases]);

  // Top 5 locations by total spend
  const topLocations = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach(t => {
      const name = cleanTerminal(t.terminal);
      map[name] = (map[name] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));
  }, [purchases]);

  // Table — newest first, all entries including deposits
  const sortedTxns = useMemo(
    () => [...(transactions ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  // ── Input State ─────────────────────────────────────────────────────────────

  if (!transactions) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0d18] px-4">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md space-y-6"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-900/60">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">WatCard Intelligence</h1>
              <p className="text-xs text-gray-500">University of Waterloo</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-gray-400">
            Use the Chrome Extension to copy your transaction history, then paste
            it below to generate your personal spending intelligence report.
          </p>

          <textarea
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] p-4
                       font-mono text-xs text-gray-300 placeholder:text-gray-600
                       outline-none transition
                       focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20"
            rows={8}
            placeholder="Paste WatCard JSON Data Here"
            value={raw}
            onChange={e => setRaw(e.target.value)}
          />

          {error && (
            <p className="text-xs text-red-400">⚠ {error}</p>
          )}

          <button
            onClick={handleGenerate}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white
                       shadow-lg shadow-blue-900/50
                       transition hover:bg-blue-500 active:scale-[0.98]"
          >
            Generate Intelligence Report
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Dashboard State ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0d18]">
      {/* Subtle top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-blue-950/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/60">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                WatCard Intelligence
              </h1>
              <p className="text-xs text-gray-400">
                {lastUpdated ? `Updated ${lastUpdated}` : "University of Waterloo"}
              </p>
            </div>
            {dateRange && (
              <span className="hidden items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-xs text-gray-400 sm:inline-flex">
                {dateRange} · {elapsedDays}d elapsed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Runway balance input */}
            <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 transition focus-within:border-blue-500/30 focus-within:ring-1 focus-within:ring-blue-500/20">
              <span className="text-sm font-medium text-gray-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Current balance"
                value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                className="w-36 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none
                           [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                           [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025]
                         px-3.5 py-2 text-xs font-medium text-gray-400
                         transition hover:bg-white/[0.06] hover:text-white"
            >
              <X size={12} /> Clear
            </button>
          </div>
        </header>

        {/* ── Animated Dashboard Body ── */}
        <motion.div
          key={animKey}
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >

          {/* ── Row 1: KPI Bento Grid ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Card 1 — Total Spend + Daily Burn Rate */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <CreditCard size={16} className="text-blue-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Total Spend
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white">
                ${totalSpent.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {purchases.length} transactions over {elapsedDays} elapsed days
              </p>
              <div className="mt-4 border-t border-white/[0.05] pt-3.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Flame size={12} className="text-orange-400" />
                  True daily burn rate
                </div>
                <p className="mt-1 text-xl font-bold text-orange-300">
                  ${dailyBurnRate.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-gray-400">/ day</span>
                </p>
              </div>
            </motion.div>

            {/* Card 2 — Runway Forecaster */}
            <motion.div
              variants={FADE_UP}
              className={`${CARD} p-5 ${
                runningOut
                  ? "border-red-500/20 bg-red-950/20"
                  : runoutDate
                  ? "border-emerald-500/15 bg-emerald-950/10"
                  : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  runningOut ? "bg-red-500/10" : runoutDate ? "bg-emerald-500/10" : "bg-white/[0.05]"
                }`}>
                  <Calendar
                    size={16}
                    className={runningOut ? "text-red-400" : runoutDate ? "text-emerald-400" : "text-gray-500"}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Runway
                </span>
              </div>

              {runoutDate ? (
                <>
                  <p className={`text-3xl font-bold tracking-tight ${
                    runningOut ? "text-red-300" : "text-emerald-300"
                  }`}>
                    {daysLeft}d left
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Balance runs out{" "}
                    <span className={`font-semibold ${runningOut ? "text-red-400" : "text-emerald-400"}`}>
                      {format(runoutDate, "MMM d, yyyy")}
                    </span>
                  </p>
                  {runningOut && (
                    <p className="mt-2 text-xs font-medium text-red-500">
                      ⚠ Before semester end — top up soon
                    </p>
                  )}
                  <div className="mt-4 border-t border-white/[0.05] pt-3.5">
                    <p className="text-xs text-gray-400">
                      ${parseFloat(balanceInput).toFixed(2)} at ${dailyBurnRate.toFixed(2)}/day
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-1 space-y-1.5">
                  <p className="text-sm font-semibold text-gray-300">Enter your balance</p>
                  <p className="text-xs leading-relaxed text-gray-400">
                    Type your remaining WatCard balance in the header field to
                    see your exact runway forecast.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Card 3 — Coffee Tax + Junk Food Tax */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                  <Coffee size={16} className="text-amber-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Taxes
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white">
                ${coffeeTax.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Coffee tax · Starbucks, TH, Williams
              </p>
              <div className="mt-4 border-t border-white/[0.05] pt-3.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Zap size={12} className="text-rose-400" />
                  Late-night dining tax
                </div>
                <p className="mt-1 text-xl font-bold text-rose-300">
                  ${junkFoodTax.toFixed(2)}
                </p>
              </div>
            </motion.div>

            {/* Card 4 — Persona Badge */}
            <motion.div
              variants={FADE_UP}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ring-1
                          ${persona.gradient} ${persona.ring}
                          border-white/[0.08]`}
            >
              {/* Decorative glows */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.03] blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/[0.02] blur-xl" />

              <div className="mb-3 flex items-start justify-between">
                <span className="text-4xl leading-none">{persona.emoji}</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Persona
                </span>
              </div>
              <p className="text-base font-bold leading-tight text-white">
                {persona.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                {persona.description}
              </p>
              <div className="mt-4 border-t border-white/[0.07] pt-3">
                <p className="text-xs text-white/40">Based on your spending DNA</p>
              </div>
            </motion.div>
          </div>

          {/* ── Row 2: Daily Trend + Weekday vs Weekend ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

            {/* Daily Spend Trend — AreaChart */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5 lg:col-span-3`}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="block h-4 w-1 rounded-full bg-blue-500" />
                <h2 className="text-sm font-semibold text-gray-200">Daily Spend Trend</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailySpend} margin={{ left: 0, right: 8, top: 4, bottom: 44 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    angle={-40}
                    textAnchor="end"
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    width={44}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TT}
                    formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Spent"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#areaGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Weekday vs Weekend */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5 lg:col-span-2`}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="block h-4 w-1 rounded-full bg-violet-500" />
                <h2 className="text-sm font-semibold text-gray-200">Avg Spend / Day</h2>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekdayWeekend} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2740" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    width={44}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TT}
                    formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Avg / day"]}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#8b5cf6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Summary pills */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {weekdayWeekend.map((w, i) => (
                  <div key={w.name} className="rounded-xl bg-white/[0.03] p-3 text-center">
                    <span className="inline-block h-1.5 w-4 rounded-full mb-1.5"
                          style={{ background: i === 0 ? "#3b82f6" : "#8b5cf6" }} />
                    <p className="text-xs text-gray-400">{w.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-white tabular-nums">
                      ${w.total.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Row 3: Time of Day | Top Locations | Category Donut ── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Time of Day */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5`}>
              <div className="mb-4 flex items-center gap-2">
                <Clock size={13} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-200">Time of Day</h2>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={timeOfDay}
                  layout="vertical"
                  margin={{ left: 4, right: 28, top: 4, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={76}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TT}
                    formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Spent"]}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                    {timeOfDay.map(e => (
                      <Cell key={e.name} fill={TOD_COLORS[e.name] ?? "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Top 5 Locations */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5`}>
              <div className="mb-5 flex items-center gap-2">
                <MapPin size={13} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-200">Top Locations</h2>
              </div>
              <div className="space-y-4">
                {topLocations.map((loc, i) => {
                  const pct = topLocations[0]?.total > 0
                    ? (loc.total / topLocations[0].total) * 100
                    : 0;
                  return (
                    <div key={i}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center
                                           rounded-full bg-white/[0.09] text-xs font-bold text-gray-400">
                            {i + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-gray-200">
                            {loc.name}
                          </span>
                        </div>
                        <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-gray-300">
                          ${loc.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${pct}%`,
                            transition: "width 0.9s cubic-bezier(0.23, 1, 0.32, 1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Category Donut */}
            <motion.div variants={FADE_UP} className={`${CARD} p-5`}>
              <div className="mb-2 flex items-center gap-2">
                <BarChart2 size={13} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-200">By Category</h2>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={74}
                    paddingAngle={3}
                    dataKey="total"
                    stroke="none"
                  >
                    {categoryTotals.map(e => (
                      <Cell key={e.name} fill={CATEGORY_COLORS[e.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TT}
                    formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Spent"]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom legend */}
              <div className="mt-2 space-y-2">
                {categoryTotals.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: CATEGORY_COLORS[c.name] ?? "#6b7280" }}
                      />
                      <span className="text-xs text-gray-300">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-gray-300">
                      ${c.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Row 4: Transaction Table ── */}
          <motion.div
            variants={FADE_UP}
            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]"
          >
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-4">
              <BarChart2 size={13} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-200">Transaction History</h2>
              <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-gray-400">
                {sortedTxns.length} entries
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-[#0c1024]">
                  <tr className="border-b border-white/[0.05]">
                    {["Date / Time", "Terminal", "Category", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400
                                    ${i === 3 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.035]">
                  {sortedTxns.map((t, i) => (
                    <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-400">
                        {t.date}
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-xs font-medium text-gray-300">
                        {cleanTerminal(t.terminal)}
                      </td>
                      <td className="px-5 py-3">
                        {t.isDeposit ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            Deposit
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              background: (CATEGORY_COLORS[t.category] ?? "#6b7280") + "22",
                              color:      CATEGORY_COLORS[t.category] ?? "#6b7280",
                            }}
                          >
                            {t.category}
                          </span>
                        )}
                      </td>
                      <td className={`px-5 py-3 text-right text-xs font-semibold tabular-nums ${
                        t.isDeposit ? "text-emerald-400" : "text-gray-200"
                      }`}>
                        {t.isDeposit ? "+" : "−"}${t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
