'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  calculateTargetAllocation,
  calculateNetWorth,
  calculateRateRiseImpact,
  evaluateLiquiditySafety,
  advisePrepayment,
  ASSET_LABELS,
  ASSET_CATEGORIES,
} from '../../../lib/portfolio';
import type { PortfolioData, Mortgage, LifeEvent } from '../../../lib/portfolio';
import InputDrawer from './InputDrawer';
import type { DashboardSettings } from './InputDrawer';

// ─────────────────────────────────────────────────────────────
// Initial data
// ─────────────────────────────────────────────────────────────

const INIT_PORTFOLIO: PortfolioData = {
  japanEquity:   7_500_000,
  foreignEquity: 6_000_000,
  domesticBond:  3_000_000,
  foreignBond:   4_500_000,
  jReit:         2_400_000,
  alternative:   1_500_000,
  cash:          5_100_000,
};

const INIT_MORTGAGE: Mortgage = {
  label:          '住宅ローン（変動）',
  balance:        60_000_000,
  rate:           0.005,
  type:           'variable',
  remainingYears: 28,
};

const INIT_SETTINGS: DashboardSettings = {
  age:           48,
  riskTolerance: 3,
  bondYield:     0.008,
};

const INIT_EVENTS: LifeEvent[] = [
  { title: '新居関連費用',   date: '2026-09-01', amount: 5_000_000 },
  { title: '長男 豪州留学', date: '2028-04-01', amount: 3_000_000 },
];

const CAT_COLORS: Record<string, string> = {
  japanEquity:   '#3B82F6',
  foreignEquity: '#8B5CF6',
  domesticBond:  '#10B981',
  foreignBond:   '#06B6D4',
  jReit:         '#F59E0B',
  alternative:   '#EC4899',
  cash:          '#64748B',
};

// ─────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────

const yen  = (n: number) => Math.abs(n).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
const man  = (n: number) => `${(Math.abs(n) / 10_000).toLocaleString('ja-JP')}万円`;
const pct  = (n: number) => `${(n * 100).toFixed(1)}%`;
const sign = (n: number) => n < 0 ? '▼' : '▲';

// ─────────────────────────────────────────────────────────────
// Allocation evaluation helpers
// ─────────────────────────────────────────────────────────────

type EvalGrade = 'optimal' | 'minor' | 'major';

const GRADE_STYLE: Record<EvalGrade, { badge: string; diffColor: string; label: (d: number) => string }> = {
  optimal: {
    badge:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    diffColor: 'text-emerald-400',
    label:     () => '適正',
  },
  minor: {
    badge:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
    diffColor: 'text-amber-400',
    label:     d => d > 0 ? 'やや過剰' : 'やや不足',
  },
  major: {
    badge:     'bg-rose-500/15 text-rose-400 border-rose-500/30',
    diffColor: 'text-rose-400',
    label:     d => d > 0 ? '要削減' : '要増額',
  },
};

function gradeOf(absDiff: number): EvalGrade {
  if (absDiff <= 2) return 'optimal';
  if (absDiff <= 5) return 'minor';
  return 'major';
}

function scoreLabel(s: number): { text: string; color: string } {
  if (s >= 90) return { text: 'A  優秀',  color: 'text-emerald-400' };
  if (s >= 80) return { text: 'B  良好',  color: 'text-blue-400'    };
  if (s >= 70) return { text: 'C  標準',  color: 'text-slate-300'   };
  if (s >= 60) return { text: 'D  要調整', color: 'text-amber-400'  };
  return              { text: 'E  要対応', color: 'text-rose-400'   };
}

// ─────────────────────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, valueClass = 'text-slate-100', warn = false,
}: {
  label: string; value: string; sub?: string; valueClass?: string; warn?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${warn ? 'bg-rose-950/25 border-rose-800/50' : 'bg-slate-900/60 border-slate-800/60'}`}>
      <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums leading-tight ${valueClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{sub}</p>}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, badge, badgeClass }: { title: string; badge?: string; badgeClass?: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${badgeClass ?? 'bg-slate-700 text-slate-400'}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function ProgressBar({ pctValue, color = 'bg-emerald-500', label, right }: {
  pctValue: number; color?: string; label?: string; right?: string;
}) {
  return (
    <div className="space-y-1">
      {(label || right) && (
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>{label}</span>
          {right && <span>{right}</span>}
        </div>
      )}
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(Math.max(pctValue, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

const ALERT_STYLES = {
  success: { wrap: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500', title: 'text-emerald-300' },
  warning: { wrap: 'bg-amber-500/10  border-amber-500/30',   dot: 'bg-amber-500',   title: 'text-amber-300'   },
  danger:  { wrap: 'bg-rose-500/10   border-rose-500/30',    dot: 'bg-rose-500',    title: 'text-rose-300'    },
  info:    { wrap: 'bg-blue-500/10   border-blue-500/30',    dot: 'bg-blue-500',    title: 'text-blue-300'    },
} as const;

function AlertCard({ type, title, body }: { type: keyof typeof ALERT_STYLES; title: string; body: string }) {
  const s = ALERT_STYLES[type];
  return (
    <div className={`rounded-xl border p-4 ${s.wrap}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
        <div>
          <p className={`text-sm font-semibold mb-1 ${s.title}`}>{title}</p>
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{body}</p>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0] as { name: string; value: number };
  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      <p className="text-slate-400 mb-1">{name}</p>
      <p className="text-white font-bold tabular-nums">{yen(value)}</p>
      <p className="text-slate-500">{total > 0 ? pct(value / total) : '—'}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      <p className="text-slate-300 font-semibold mb-1.5">{label}</p>
      {(payload as Array<{ name: string; value: number; color: string }>).map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {p.value.toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Allocation Evaluation Table
// ─────────────────────────────────────────────────────────────

function AllocationEvalTable({
  evalRows, score,
}: {
  evalRows: ReturnType<typeof buildEvalRows>;
  score: number;
}) {
  const { text: scoreText, color: scoreColor } = scoreLabel(score);

  return (
    <Card>
      {/* Header with score */}
      <div className="flex items-center justify-between mb-5">
        <CardHeader title="アロケーション評価" badge="適合スコア" badgeClass="bg-blue-500/15 text-blue-400" />
        <div className="flex items-center gap-3 -mt-5">
          <div className="text-right">
            <p className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{score}<span className="text-sm text-slate-500 ml-1">/100</span></p>
            <p className={`text-xs font-semibold ${scoreColor}`}>{scoreText}</p>
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-5">
        <ProgressBar
          pctValue={score}
          color={score >= 80 ? 'bg-blue-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}
          label="目標比率との乖離スコア（±2%以内=適正、±5%以内=要調整、±5%超=要対応）"
          right={`${score}点`}
        />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_52px_52px_64px_80px_1fr] gap-x-3 text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">
        <span>カテゴリ</span>
        <span className="text-right">現在%</span>
        <span className="text-right">目標%</span>
        <span className="text-right">乖離%</span>
        <span className="text-center">評価</span>
        <span className="text-right">推奨アクション</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {evalRows.map(row => {
          const gs = GRADE_STYLE[row.grade];
          const absOk = row.grade === 'optimal';
          return (
            <div
              key={row.cat}
              className={`grid grid-cols-[1fr_52px_52px_64px_80px_1fr] gap-x-3 items-center rounded-xl px-3 py-2.5 transition-colors ${
                absOk ? 'bg-slate-800/30' : 'bg-slate-800/50'
              }`}
            >
              {/* Name + color dot */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: CAT_COLORS[row.cat] }} />
                <span className="text-sm text-slate-300 truncate">{row.catLabel}</span>
              </div>

              {/* Current % */}
              <span className="text-sm text-slate-300 tabular-nums text-right">
                {row.currentPct.toFixed(1)}
              </span>

              {/* Target % */}
              <span className="text-sm text-slate-500 tabular-nums text-right">
                {row.targetPct.toFixed(1)}
              </span>

              {/* Diff % with deviation bar */}
              <div className="text-right">
                <span className={`text-xs font-semibold tabular-nums ${gs.diffColor}`}>
                  {row.diffPct >= 0 ? '+' : ''}{row.diffPct.toFixed(1)}%
                </span>
              </div>

              {/* Grade badge */}
              <div className="flex justify-center">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${gs.badge}`}>
                  {gs.label(row.diffPct)}
                </span>
              </div>

              {/* Action */}
              <div className="text-right">
                {Math.abs(row.deltaYen) > 5_000 ? (
                  <span className={`text-xs tabular-nums ${row.deltaYen > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {row.deltaYen > 0 ? '▲' : '▼'} {yen(Math.abs(row.deltaYen))}
                    <span className="text-slate-500 ml-1">{row.deltaYen > 0 ? '買増' : '売却'}</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">変更不要</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
        <span>
          要対応: {evalRows.filter(r => r.grade === 'major').length}件 ／
          要調整: {evalRows.filter(r => r.grade === 'minor').length}件 ／
          適正: {evalRows.filter(r => r.grade === 'optimal').length}件
        </span>
        <span>乖離合計: ±{(evalRows.reduce((s, r) => s + Math.abs(r.diffPct), 0) / 2).toFixed(1)}%相当</span>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Eval row builder (pure function for useMemo)
// ─────────────────────────────────────────────────────────────

function buildEvalRows(
  portfolio: PortfolioData,
  total: number,
  target: ReturnType<typeof calculateTargetAllocation>,
) {
  return ASSET_CATEGORIES.map(cat => {
    const currentPct = total > 0 ? portfolio[cat] / total * 100 : 0;
    const targetPct  = target[cat] * 100;
    const diffPct    = currentPct - targetPct;
    const deltaYen   = Math.round((targetPct - currentPct) / 100 * total);
    const grade      = gradeOf(Math.abs(diffPct));
    return { cat, catLabel: ASSET_LABELS[cat], currentPct, targetPct, diffPct, deltaYen, grade };
  });
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [mounted,    setMounted]    = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  // ── Editable state ─────────────────────────────────────────
  const [portfolio,   setPortfolio]   = useState<PortfolioData>(INIT_PORTFOLIO);
  const [mortgage,    setMortgage]    = useState<Mortgage>(INIT_MORTGAGE);
  const [settings,    setSettings]    = useState<DashboardSettings>(INIT_SETTINGS);
  const [lifeEvents,  setLifeEvents]  = useState<LifeEvent[]>(INIT_EVENTS);

  useEffect(() => setMounted(true), []);

  // ── Computed ───────────────────────────────────────────────
  const computed = useMemo(() => {
    const today   = new Date();
    const total   = Object.values(portfolio).reduce((a, b) => a + b, 0);
    const nw      = calculateNetWorth(portfolio, [mortgage]);
    const target  = calculateTargetAllocation(settings.age, settings.riskTolerance);
    const impact  = calculateRateRiseImpact(mortgage, [0.005, 0.010]);
    const safety  = evaluateLiquiditySafety(portfolio, lifeEvents, 3, today);
    const advice  = advisePrepayment(mortgage, settings.bondYield);

    // Charts
    const donutData = ASSET_CATEGORIES.map(cat => ({
      key: cat, name: ASSET_LABELS[cat], value: portfolio[cat], color: CAT_COLORS[cat],
    }));
    const barData = ASSET_CATEGORIES.map(cat => ({
      name: ASSET_LABELS[cat],
      現在: parseFloat((total > 0 ? portfolio[cat] / total * 100 : 0).toFixed(1)),
      目標: parseFloat((target[cat] * 100).toFixed(1)),
    }));

    // Evaluation
    const evalRows = buildEvalRows(portfolio, total, target);
    const sumAbsDiff = evalRows.reduce((s, r) => s + Math.abs(r.diffPct), 0);
    const score = Math.round(Math.max(0, 100 - sumAbsDiff / 2));

    // Life event coverage (sequential)
    let rem = safety.currentLiquidity;
    const eventCoverage = lifeEvents.map(e => {
      const covered = Math.min(rem, e.amount);
      rem = Math.max(0, rem - e.amount);
      const years = (new Date(e.date).getTime() - today.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return { ...e, covered, ratio: covered / e.amount, years };
    });

    return { total, nw, target, impact, safety, advice, donutData, barData, evalRows, score, eventCoverage };
  }, [portfolio, mortgage, settings, lifeEvents]);

  const { total, nw, impact, safety, advice, donutData, barData, evalRows, score, eventCoverage } = computed;

  // ── Apply from drawer ──────────────────────────────────────
  const handleApply = ({
    portfolio: p, mortgage: m, settings: s, lifeEvents: l,
  }: {
    portfolio: PortfolioData;
    mortgage: Mortgage;
    settings: DashboardSettings;
    lifeEvents: LifeEvent[];
  }) => {
    setPortfolio(p);
    setMortgage(m);
    setSettings(s);
    setLifeEvents(l);
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-[#05080f] text-slate-100 antialiased">

        {/* ── Header ─────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-[#05080f]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-200 tracking-wide">
                ポートフォリオ・ダッシュボード
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-5 text-xs text-slate-500">
                <span>年齢 {settings.age}歳 ／ リスク {settings.riskTolerance}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-emerald-600">Live</span>
                </div>
              </div>
              {/* Settings button */}
              <button
                onClick={() => setShowDrawer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700/80 rounded-lg hover:bg-slate-700 hover:border-slate-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                データ入力
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-5">

          {/* ── Metric cards ─────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              label="金融資産合計"
              value={man(nw.totalAssets)}
              sub={`${ASSET_CATEGORIES.length}カテゴリ ／ 時価評価ベース`}
              valueClass="text-blue-300"
            />
            <MetricCard
              label="住宅ローン残高"
              value={nw.totalLiabilities > 0 ? man(nw.totalLiabilities) : '—'}
              sub={nw.totalLiabilities > 0
                ? `${mortgage.type === 'variable' ? '変動' : '固定'} ${(mortgage.rate * 100).toFixed(2)}% ／ 残 ${mortgage.remainingYears ?? '—'}年`
                : 'ローンなし'
              }
              valueClass="text-rose-400"
              warn={nw.totalLiabilities > 0}
            />
            <MetricCard
              label="純資産（Net Worth）"
              value={sign(nw.netWorth) + man(nw.netWorth)}
              sub={nw.totalLiabilities > 0
                ? `負債比率 ${pct(nw.liabilityToAssetRatio)} ／ 住宅時価込みの実質純資産は別途確認`
                : '負債なし'
              }
              valueClass={nw.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}
              warn={nw.netWorth < 0}
            />
          </div>

          {/* ── Charts ───────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Donut */}
            <Card>
              <CardHeader title="アセット配分（現在）" />
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0 w-44 h-44">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={84}
                          paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {donutData.map(e => <Cell key={e.key} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<PieTooltip total={total} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-500">合計</span>
                    <span className="text-sm font-bold text-slate-200 tabular-nums">
                      {(total / 10_000).toLocaleString()}万
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {donutData.map(item => (
                    <div key={item.key} className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-400 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 tabular-nums">
                        <span className="text-slate-200 font-medium">
                          {total > 0 ? pct(item.value / total) : '—'}
                        </span>
                        <span className="text-slate-600 text-[10px]">{(item.value / 10_000).toFixed(0)}万</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Bar */}
            <Card>
              <CardHeader title="現在 vs 目標配分" badge="Target" badgeClass="bg-emerald-500/15 text-emerald-400" />
              <div className="h-52">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical"
                      margin={{ top: 0, right: 16, left: 56, bottom: 0 }} barGap={2} barCategoryGap="30%">
                      <XAxis type="number" domain={[0, 40]} tick={{ fill: '#475569', fontSize: 10 }}
                        tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false} tickLine={false} width={56} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                      <Legend iconType="square" iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '6px' }} />
                      <Bar dataKey="現在" fill="#3B82F6" radius={[0, 3, 3, 0]} barSize={7} />
                      <Bar dataKey="目標" fill="#10B981" opacity={0.75} radius={[0, 3, 3, 0]} barSize={7} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* ── Allocation Evaluation ────────────────────── */}
          <AllocationEvalTable evalRows={evalRows} score={score} />

          {/* ── Risk section ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">

            {/* Rate rise */}
            <Card>
              <CardHeader title="変動金利 上昇シナリオ" badge="変動リスク" badgeClass="bg-amber-500/15 text-amber-400" />
              {mortgage.type === 'fixed' ? (
                <p className="text-sm text-slate-500">固定金利のため金利上昇による返済額への影響はありません。</p>
              ) : (
                <>
                  <p className="text-[11px] text-slate-500 -mt-3 mb-4">
                    残高 {man(mortgage.balance)} ／ 現行 {(mortgage.rate * 100).toFixed(2)}% ／ 残 {mortgage.remainingYears ?? '—'}年
                  </p>
                  <div className="space-y-3">
                    {impact.scenarios.map(s => (
                      <div key={s.riseAmount} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-amber-400">金利 +{(s.riseAmount * 100).toFixed(1)}%</span>
                          <span className="text-[11px] text-slate-500">
                            {(mortgage.rate * 100).toFixed(2)}% → {(s.newRate * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">月次増加</p>
                            <p className="text-lg font-bold text-rose-400 tabular-nums">+{yen(s.monthlyPaymentIncrease)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">年間増加</p>
                            <p className="text-lg font-bold text-rose-400 tabular-nums">+{yen(s.annualPaymentIncrease)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Life events */}
            <Card>
              <CardHeader title="ライフイベント 準備状況" badge="流動性" badgeClass="bg-blue-500/15 text-blue-400" />
              <ProgressBar
                label="3年以内 流動性充足率"
                right={`${(safety.coverageRatio * 100).toFixed(1)}%（${man(safety.currentLiquidity)} / ${man(safety.requiredLiquidity)}）`}
                pctValue={safety.coverageRatio * 100}
                color={safety.isAdequate ? 'bg-emerald-500' : 'bg-rose-500'}
              />
              {eventCoverage.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">ライフイベントが登録されていません。</p>
              ) : (
                <div className="mt-5 space-y-5">
                  {eventCoverage.map(ev => (
                    <div key={ev.title}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{ev.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ev.date} ／ {ev.years.toFixed(1)}年後
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold tabular-nums ${ev.ratio >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {(ev.ratio * 100).toFixed(0)}%
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{man(ev.amount)}</p>
                        </div>
                      </div>
                      <ProgressBar
                        pctValue={ev.ratio * 100}
                        color={ev.ratio >= 1 ? 'bg-emerald-500' : 'bg-amber-500'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Advice ───────────────────────────────────── */}
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-3">今やるべきこと</h2>
            <div className="grid grid-cols-2 gap-3">
              {nw.netWorth < 0 && (
                <AlertCard
                  type="danger"
                  title="純資産がマイナスです"
                  body={`金融資産 ${man(nw.totalAssets)} に対しローン残高 ${man(nw.totalLiabilities)} が超過（${sign(nw.netWorth)}${man(nw.netWorth)}）。住宅の時価評価も含めた実質純資産を別途確認し、繰り上げ返済による元本圧縮を優先的に検討してください。`}
                />
              )}
              <AlertCard
                type={safety.isAdequate ? 'success' : 'warning'}
                title={safety.isAdequate ? '流動性は充足しています' : '⚠️ 流動性が不足しています'}
                body={
                  safety.isAdequate
                    ? `現金＋国内債券（${man(safety.currentLiquidity)}）が3年以内の必要額（${man(safety.requiredLiquidity)}）を充足。充足率 ${(safety.coverageRatio * 100).toFixed(1)}%。`
                    : `${safety.warning ?? ''}\n${safety.recommendation ?? ''}`
                }
              />
              <AlertCard
                type={advice.shouldPrepay ? 'info' : 'success'}
                title={advice.shouldPrepay ? '繰り上げ返済を優先する局面です' : '国内債券投資が合理的な局面です'}
                body={advice.message}
              />
              {mortgage.type === 'variable' && (
                <AlertCard
                  type="warning"
                  title="変動金利の上昇リスクに備えましょう"
                  body={`金利が +1.0% 上昇した場合、年間の返済額が ${yen(impact.scenarios[1]?.annualPaymentIncrease ?? 0)} 増加します（月 +${yen(impact.scenarios[1]?.monthlyPaymentIncrease ?? 0)}）。固定金利への借り換えや繰り上げ返済によるリスク軽減を検討してください。`}
                />
              )}
            </div>
          </div>

        </main>
      </div>

      {/* ── Input Drawer (portal-like overlay) ─────────── */}
      <InputDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        portfolio={portfolio}
        mortgage={mortgage}
        settings={settings}
        lifeEvents={lifeEvents}
        onApply={handleApply}
      />
    </>
  );
}
