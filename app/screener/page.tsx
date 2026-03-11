'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StockResult {
  symbol:   string;
  name:     string;
  sector:   string;
  price:    number;
  eps:      number;
  trailPE:  number;
  fwdPE:    number;
  sectorPE: number;
  growth:   number;
  divYield: number;
  intrinsic: number;
  mos:      number;
  cagr:     number;
  peScore:  number;
  dcfScore: number;
  gdmScore: number;
  overall:  number;
  currency: string;
}

type Market = 'us' | 'jp';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signal(score: number): { text: string; color: string; bg: string } {
  if (score >= 1.5)  return { text: '◎ 強い割安', color: '#3fb950', bg: 'rgba(63,185,80,0.12)'  };
  if (score >= 0.5)  return { text: '○ 割安',     color: '#4ade80', bg: 'rgba(74,222,128,0.10)' };
  if (score >= -0.5) return { text: '△ 適正',     color: '#e3b341', bg: 'rgba(227,179,65,0.10)' };
  if (score >= -1.5) return { text: '× 割高',     color: '#f97316', bg: 'rgba(249,115,22,0.10)' };
  return                    { text: '✕ 強い割高',  color: '#f85149', bg: 'rgba(248,81,73,0.10)'  };
}

function moduleSymbol(score: number) {
  const map: Record<number, { icon: string; cls: string }> = {
     2: { icon: '◎', cls: 'text-green-400' },
     1: { icon: '○', cls: 'text-green-300' },
     0: { icon: '△', cls: 'text-yellow-400' },
    '-1': { icon: '×', cls: 'text-orange-400' },
    '-2': { icon: '✕', cls: 'text-red-400' },
  };
  return map[score] ?? { icon: '—', cls: 'text-gray-500' };
}

// ─── Top1 Explanation ────────────────────────────────────────────────────────
function ExplanationPanel({ stock, currency, defaultOpen = false }: { stock: StockResult; currency: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const sig = signal(stock.overall);

  const peDiff = (stock.trailPE - stock.sectorPE) / stock.sectorPE * 100;
  const peVerdict =
    peDiff <= -30 ? `セクター平均より${Math.abs(peDiff).toFixed(0)}%低く、大幅に割安な水準です` :
    peDiff <= -10 ? `セクター平均より${Math.abs(peDiff).toFixed(0)}%低く、割安な水準です` :
    peDiff <=  10 ? `セクター平均とほぼ同水準（差異${peDiff > 0 ? '+' : ''}${peDiff.toFixed(0)}%）です` :
    peDiff <=  30 ? `セクター平均より${peDiff.toFixed(0)}%高く、やや割高な水準です` :
                    `セクター平均より${peDiff.toFixed(0)}%高く、割高な水準です`;

  const mosVerdict =
    stock.mos >= 40 ? `${stock.mos.toFixed(0)}%の大きな安全域があり、内在価値を大幅に下回る価格です` :
    stock.mos >= 20 ? `${stock.mos.toFixed(0)}%の安全域があり、内在価値を下回る適切な価格です` :
    stock.mos >= -10 ? `内在価値に近い水準（安全域${stock.mos.toFixed(0)}%）です` :
                       `内在価値を${Math.abs(stock.mos).toFixed(0)}%上回っており、割高の可能性があります`;

  const cagrDiff = stock.cagr - 10;
  const cagrVerdict =
    cagrDiff >= 5 ? `目標リターン10%を${cagrDiff.toFixed(1)}ポイント上回る、高い期待リターンです` :
    cagrDiff >= 0 ? `目標リターン10%をわずかに上回ります（CAGR ${stock.cagr}%）` :
    cagrDiff >= -3 ? `目標リターン10%をわずかに下回ります（CAGR ${stock.cagr}%）` :
                     `目標リターン10%を下回っており、期待リターンが低めです（CAGR ${stock.cagr}%）`;

  const overallVerdict =
    stock.overall >= 1.5 ? '3手法すべてが割安シグナルで一致。強い買いシグナルと判断されます。' :
    stock.overall >= 0.5 ? '複数の手法が割安を示しており、割安と判断されます。' :
    stock.overall >= -0.5 ? '手法によって評価が分かれており、適正水準と判断されます。' :
                             '複数の手法が割高を示しており、慎重な姿勢が必要です。';

  const priceStr = currency === 'JPY'
    ? '¥' + Math.round(stock.price).toLocaleString('ja-JP')
    : '$' + stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const intrinsicStr = currency === 'JPY'
    ? '¥' + Math.round(stock.intrinsic).toLocaleString('ja-JP')
    : '$' + Math.round(stock.intrinsic).toLocaleString('en-US');

  const items = [
    {
      method: '① P/E 相対比較',
      score: stock.peScore,
      summary: `実績P/E ${stock.trailPE}倍 ÷ セクター平均${stock.sectorPE}倍`,
      detail: `P/E（株価収益率）とは「株価 ÷ EPS（1株利益）」で求める割高・割安の基本指標です。同セクターの平均P/Eと比べることで、相対的な割安度を判定します。${stock.symbol}の実績P/Eは${stock.trailPE}倍で、${stock.sector}セクター平均の${stock.sectorPE}倍と比較すると、${peVerdict}。`,
    },
    {
      method: '② DCF 本源的価値',
      score: stock.dcfScore,
      summary: `内在価値 ${intrinsicStr} ／ 現在値 ${priceStr}（安全域 ${stock.mos >= 0 ? '+' : ''}${stock.mos.toFixed(0)}%）`,
      detail: `DCF（割引キャッシュフロー）法では、将来10年分のEPS（成長率${stock.growth}%で投影）と、その後の定常成長（3%）を割引率9%で現在価値に換算します。算出された内在価値${intrinsicStr}に対し、現在の株価${priceStr}は${mosVerdict}。安全域（MoS）が大きいほど、下落リスクへの余裕があります。`,
    },
    {
      method: '③ 成長・配当モデル（GDM）',
      score: stock.gdmScore,
      summary: `10年CAGR予測 ${stock.cagr}%（目標ハードルレート：10%）`,
      detail: `GDMでは「将来EPS × 出口P/E + 累積配当」から10年後の期待価値を計算し、現在価格からの年率リターン（CAGR）を算出します。${stock.symbol}は成長率${stock.growth}%・配当利回り${stock.divYield.toFixed(1)}%を前提とすると、${cagrVerdict}。`,
    },
    {
      method: '④ 三角測量 総合スコア',
      score: stock.overall >= 1.5 ? 2 : stock.overall >= 0.5 ? 1 : stock.overall >= -0.5 ? 0 : -1,
      summary: `総合スコア ${stock.overall.toFixed(2)} / 2.00`,
      detail: `三角測量とは3つの独立した手法の結論を「三角形で囲む」ように照合し、一致度が高いほど確信度が上がる考え方です。${stock.symbol}は${overallVerdict}スコアが高いほど割安への収束が強く、低いほど手法間で評価が分かれています。`,
    },
  ];

  return (
    <div className="mb-6 bg-gray-900/40 border border-amber-500/20 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-lg">📖</span>
          <div className="text-left">
            <div className="text-sm font-bold text-gray-200">
              Top1 銘柄 解説 — <span className="text-amber-400">{stock.symbol}</span>
              <span className="text-gray-500 font-normal ml-2">{stock.name}</span>
            </div>
            <div className="text-[11px] text-gray-600">各指標の読み方と評価の根拠</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full border"
            style={{ color: sig.color, background: sig.bg, borderColor: sig.color + '40' }}
          >
            {sig.text}
          </span>
          <span className="text-gray-600 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-800">
          {items.map((item) => {
            const ms = moduleSymbol(item.score);
            return (
              <div key={item.method} className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-base font-black ${ms.cls}`}>{ms.icon}</span>
                  <span className="text-xs font-bold text-gray-300">{item.method}</span>
                </div>
                <div className="text-[11px] text-amber-400/80 mb-2 font-mono">{item.summary}</div>
                <p className="text-[12px] text-gray-400 leading-relaxed">{item.detail}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmtPrice(v: number, currency: string) {
  if (currency === 'JPY') {
    return '¥' + Math.round(v).toLocaleString('ja-JP');
  }
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtIntrinsic(v: number, currency: string) {
  if (currency === 'JPY') {
    return '¥' + Math.round(v).toLocaleString('ja-JP');
  }
  return '$' + Math.round(v).toLocaleString('en-US');
}

function ScoreBar({ score }: { score: number }) {
  const pct   = ((score + 2) / 4) * 100;
  const color = score >= 1 ? '#3fb950' : score >= 0 ? '#e3b341' : '#f85149';
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function ModulePill({ label, score }: { label: string; score: number }) {
  const ms = moduleSymbol(score);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${ms.cls}`}>{ms.icon}</span>
    </div>
  );
}

type SortKey = keyof StockResult;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ScreenerPage() {
  const [market,       setMarket]       = useState<Market>('us');
  const [data,         setData]         = useState<StockResult[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [meta,         setMeta]         = useState<{ timestamp: string; total: number; universe: number } | null>(null);
  const [sortKey,      setSortKey]      = useState<SortKey>('overall');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc');
  const [activeTab,    setActiveTab]    = useState<'cards' | 'table'>('cards');
  // Individual stock search
  const [singleInput,  setSingleInput]  = useState('');
  const [singleResult, setSingleResult] = useState<StockResult | null>(null);
  const [singleLoading,setSingleLoading]= useState(false);
  const [singleError,  setSingleError]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/screener?market=${market}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data ?? []);
      setMeta({ timestamp: json.timestamp, total: json.total, universe: json.universe });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => { load(); }, [load]);

  const fetchSingle = useCallback(async () => {
    const sym = singleInput.trim().toUpperCase();
    if (!sym) return;
    setSingleLoading(true);
    setSingleError(null);
    setSingleResult(null);
    try {
      const res  = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSingleResult(json.data);
    } catch (e) {
      setSingleError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSingleLoading(false);
    }
  }, [singleInput]);

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-200 whitespace-nowrap select-none"
    >
      {label}
      {sortKey === k && <span className="ml-1 text-amber-400">{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </th>
  );

  const medals = ['🥇', '🥈', '🥉'];
  const currency = data[0]?.currency ?? (market === 'jp' ? 'JPY' : 'USD');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-base shrink-0">
              △
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">
                <span className="text-amber-400">三角測量</span> 割安銘柄スクリーナー
              </h1>
              <p className="text-[10px] text-gray-600 leading-tight">
                バフェット流 P/E · DCF · GDM トライアンギュレーション | リアルタイムデータ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Market Selector */}
            <div className="flex rounded-lg bg-gray-900 border border-gray-800 p-0.5">
              {([
                { key: 'us', flag: '🇺🇸', label: '米国株' },
                { key: 'jp', flag: '🇯🇵', label: '日本株' },
              ] as { key: Market; flag: string; label: string }[]).map(m => (
                <button
                  key={m.key}
                  onClick={() => { if (market !== m.key) { setMarket(m.key); setData([]); } }}
                  disabled={loading}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 ${
                    market === m.key
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {m.flag} {m.label}
                </button>
              ))}
            </div>

            {meta && (
              <span className="text-xs text-gray-600 hidden sm:block">
                {new Date(meta.timestamp).toLocaleString('ja-JP')} 更新
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium hover:bg-amber-500/25 disabled:opacity-40 transition-all"
            >
              <span className={loading ? 'animate-spin' : ''}>↻</span>
              {loading ? '取得中...' : '更新'}
            </button>
            <a href="/" className="text-xs text-gray-600 hover:text-gray-400">← ホーム</a>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6">

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="relative">
              <div className="w-16 h-16 border-2 border-amber-400/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 font-medium">Yahoo Finance からデータを取得中...</p>
              <p className="text-gray-600 text-sm mt-1">
                {market === 'jp' ? '約50銘柄（日本株）' : '約80銘柄（米国株）'}を三角測量スクリーニング中
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="max-w-lg mx-auto mt-16 bg-red-900/20 border border-red-800/50 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-red-400 font-bold text-lg mb-2">データ取得エラー</h2>
            <p className="text-gray-400 text-sm mb-5">{error}</p>
            <button
              onClick={load}
              className="px-5 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm hover:bg-red-500/30 transition-all"
            >
              再試行
            </button>
          </div>
        )}

        {/* ── Individual Stock Search ── */}
        <div className="mb-6 bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <div className="text-xs font-bold text-gray-400 mb-3">🔍 個別銘柄を分析</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={singleInput}
              onChange={e => setSingleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchSingle()}
              placeholder="ティッカーを入力（例：AAPL　7203.T）"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              onClick={fetchSingle}
              disabled={singleLoading || !singleInput.trim()}
              className="px-5 py-2 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-medium hover:bg-amber-500/25 disabled:opacity-40 transition-all whitespace-nowrap"
            >
              {singleLoading ? '取得中...' : '分析する'}
            </button>
          </div>

          {/* Error */}
          {singleError && (
            <div className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">
              ⚠️ {singleError}
            </div>
          )}

          {/* Loading */}
          {singleLoading && (
            <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Yahoo Finance からデータを取得中...
            </div>
          )}

          {/* Result */}
          {singleResult && !singleLoading && (() => {
            const s = singleResult;
            const sig = signal(s.overall);
            const ms = (sc: number) => moduleSymbol(sc);
            const cur = s.currency;
            return (
              <div className="mt-4 border-t border-gray-800 pt-4">
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] text-gray-600 mb-0.5">{s.sector}</div>
                    <div className="text-2xl font-black">{s.symbol}</div>
                    <div className="text-sm text-gray-400">{s.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{fmtPrice(s.price, cur)}</div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full border mt-1 inline-block"
                      style={{ color: sig.color, background: sig.bg, borderColor: sig.color + '40' }}
                    >
                      {sig.text}
                    </span>
                  </div>
                </div>

                {/* Module scores */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'P/E 相対比較', score: s.peScore, detail: `${s.trailPE}x vs ${s.sectorPE}x` },
                    { label: 'DCF 本源的価値', score: s.dcfScore, detail: `MoS ${s.mos >= 0 ? '+' : ''}${s.mos.toFixed(0)}%` },
                    { label: '成長・配当（GDM）', score: s.gdmScore, detail: `CAGR ${s.cagr}%` },
                  ].map(m => {
                    const icon = ms(m.score);
                    return (
                      <div key={m.label} className="bg-gray-800/60 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-gray-600 mb-1 leading-tight">{m.label}</div>
                        <div className={`text-lg font-black ${icon.cls}`}>{icon.icon}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{m.detail}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Score bar + overall */}
                <ScoreBar score={s.overall} />
                <div className="flex justify-between text-[11px] text-gray-600 mt-1 mb-4">
                  <span>総合スコア</span>
                  <span className="font-bold" style={{ color: sig.color }}>{s.overall.toFixed(2)} / 2.00</span>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
                  {[
                    { label: '内在価値', val: fmtIntrinsic(s.intrinsic, cur), cls: 'text-amber-300' },
                    { label: '安全域', val: `${s.mos >= 0 ? '+' : ''}${s.mos.toFixed(1)}%`, cls: s.mos >= 20 ? 'text-green-400' : s.mos >= 0 ? 'text-yellow-400' : 'text-red-400' },
                    { label: '成長率', val: `${s.growth}%`, cls: 'text-blue-300' },
                    { label: '配当利回り', val: `${s.divYield.toFixed(1)}%`, cls: 'text-gray-300' },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-800/40 rounded-lg p-2">
                      <div className="text-[10px] text-gray-600 mb-1">{m.label}</div>
                      <div className={`font-bold ${m.cls}`}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* Full explanation (auto-expanded) */}
                <ExplanationPanel stock={s} currency={cur} defaultOpen />
              </div>
            );
          })()}
        </div>

        {/* ── Main Content ── */}
        {!loading && !error && data.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                {
                  label: 'スクリーニング銘柄',
                  value: meta?.universe ?? 0,
                  unit: '銘柄',
                  sub: market === 'jp' ? '日本主要株' : '米国主要株',
                },
                { label: '取得成功',  value: meta?.total ?? 0, unit: '銘柄', sub: 'データ有効' },
                { label: '分析手法',  value: 3,                unit: '手法', sub: 'P/E · DCF · GDM' },
                {
                  label: '最高スコア',
                  value: data[0]?.overall.toFixed(2),
                  unit: '',
                  sub: data[0]?.symbol ?? '',
                },
              ].map((s, i) => (
                <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                  <div className="text-[11px] text-gray-600 mb-1">{s.label}</div>
                  <div className="text-2xl font-bold text-white">
                    {s.value}<span className="text-sm font-normal text-gray-500 ml-1">{s.unit}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Explanation Panel */}
            <ExplanationPanel stock={data[0]} currency={currency} />

            {/* Tab Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex rounded-lg bg-gray-900 border border-gray-800 p-0.5">
                {(['cards', 'table'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab === 'cards' ? '🃏 カード表示' : '📊 テーブル表示'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600">Top 20 割安銘柄（スコア降順）</p>
            </div>

            {/* ── Card View ── */}
            {activeTab === 'cards' && (
              <>
                {/* Top 3 Hero Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {data.slice(0, 3).map((stock, i) => {
                    const sig = signal(stock.overall);
                    return (
                      <div
                        key={stock.symbol}
                        className="relative bg-gray-900/50 rounded-2xl border border-gray-800 p-5 overflow-hidden"
                        style={i === 0 ? { borderColor: 'rgba(240,180,41,0.4)', boxShadow: '0 0 30px rgba(240,180,41,0.06)' } : {}}
                      >
                        {i === 0 && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-3xl">{medals[i]}</span>
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full border"
                            style={{ color: sig.color, background: sig.bg, borderColor: sig.color + '40' }}
                          >
                            {sig.text}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="text-[11px] text-gray-600 mb-0.5">{stock.sector}</div>
                          <div className="text-2xl font-black tracking-tight">{stock.symbol}</div>
                          <div className="text-sm text-gray-400 truncate">{stock.name}</div>
                        </div>

                        <div className="text-3xl font-bold mb-4">{fmtPrice(stock.price, stock.currency)}</div>

                        {/* Module scores */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[
                            { label: 'P/E 相対比較', score: stock.peScore, detail: `${stock.trailPE}x vs ${stock.sectorPE}x` },
                            { label: 'DCF 本源的価値', score: stock.dcfScore, detail: `MoS ${stock.mos >= 0 ? '+' : ''}${stock.mos.toFixed(0)}%` },
                            { label: '成長・配当', score: stock.gdmScore, detail: `CAGR ${stock.cagr}%` },
                          ].map(m => {
                            const ms = moduleSymbol(m.score);
                            return (
                              <div key={m.label} className="bg-gray-800/50 rounded-xl p-2.5 text-center">
                                <div className="text-[10px] text-gray-600 mb-1 leading-tight">{m.label}</div>
                                <div className={`text-lg font-black ${ms.cls}`}>{ms.icon}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">{m.detail}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Score bar */}
                        <ScoreBar score={stock.overall} />
                        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                          <span>総合スコア</span>
                          <span className="font-bold" style={{ color: sig.color }}>
                            {stock.overall.toFixed(2)} / 2.00
                          </span>
                        </div>

                        {/* Key metrics */}
                        <div className="grid grid-cols-3 gap-x-2 mt-3 pt-3 border-t border-gray-800 text-center">
                          <div>
                            <div className="text-[10px] text-gray-600">内在価値</div>
                            <div className="text-xs font-bold text-amber-300">{fmtIntrinsic(stock.intrinsic, stock.currency)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-600">成長率</div>
                            <div className="text-xs font-bold text-blue-300">{stock.growth}%</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-600">配当利回り</div>
                            <div className="text-xs font-bold text-gray-300">{stock.divYield.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rank 4–20 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.slice(3).map((stock, i) => {
                    const rank = i + 4;
                    const sig  = signal(stock.overall);
                    return (
                      <div
                        key={stock.symbol}
                        className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs font-bold flex items-center justify-center">
                              {rank}
                            </span>
                            <div>
                              <div className="font-bold text-sm">{stock.symbol}</div>
                              <div className="text-[10px] text-gray-600 max-w-[100px] truncate">{stock.name}</div>
                            </div>
                          </div>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                            style={{ color: sig.color, background: sig.bg, borderColor: sig.color + '40' }}
                          >
                            {sig.text}
                          </span>
                        </div>

                        <div className="text-lg font-bold mb-2">{fmtPrice(stock.price, stock.currency)}</div>

                        <div className="flex justify-around mb-2">
                          <ModulePill label="P/E"  score={stock.peScore}  />
                          <ModulePill label="DCF"  score={stock.dcfScore} />
                          <ModulePill label="GDM"  score={stock.gdmScore} />
                        </div>

                        <ScoreBar score={stock.overall} />
                        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                          <span>MoS: <span className={stock.mos >= 0 ? 'text-green-400' : 'text-red-400'}>{stock.mos >= 0 ? '+' : ''}{stock.mos.toFixed(0)}%</span></span>
                          <span>CAGR: <span className={stock.cagr >= 10 ? 'text-green-400' : 'text-yellow-400'}>{stock.cagr}%</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Table View ── */}
            {activeTab === 'table' && (
              <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/60">
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase">順位</th>
                        <Th k="symbol"   label="銘柄" />
                        <Th k="sector"   label="セクター" />
                        <Th k="price"    label="株価" />
                        <Th k="trailPE"  label="P/E(実)" />
                        <Th k="sectorPE" label="セクター平均P/E" />
                        <Th k="intrinsic" label="内在価値(DCF)" />
                        <Th k="mos"      label="安全域%" />
                        <Th k="cagr"     label="CAGR%" />
                        <Th k="divYield" label="配当%" />
                        <Th k="growth"   label="成長率%" />
                        <Th k="peScore"  label="P/E" />
                        <Th k="dcfScore" label="DCF" />
                        <Th k="gdmScore" label="GDM" />
                        <Th k="overall"  label="総合" />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((stock) => {
                        const origRank = data.findIndex(d => d.symbol === stock.symbol) + 1;
                        const sig = signal(stock.overall);
                        return (
                          <tr
                            key={stock.symbol}
                            className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors"
                          >
                            <td className="px-3 py-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                origRank <= 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
                              }`}>
                                {origRank}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-bold">{stock.symbol}</div>
                              <div className="text-[11px] text-gray-500 max-w-[120px] truncate">{stock.name}</div>
                            </td>
                            <td className="px-3 py-3 text-[11px] text-gray-500">{stock.sector}</td>
                            <td className="px-3 py-3 font-mono font-bold">{fmtPrice(stock.price, stock.currency)}</td>
                            <td className="px-3 py-3">
                              <span className={`font-mono font-semibold ${stock.trailPE < stock.sectorPE ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.trailPE}x
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-gray-500 text-xs">{stock.sectorPE}x</td>
                            <td className="px-3 py-3 font-mono text-amber-300 font-semibold">
                              {fmtIntrinsic(stock.intrinsic, stock.currency)}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`font-mono font-bold ${stock.mos >= 20 ? 'text-green-400' : stock.mos >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {stock.mos >= 0 ? '+' : ''}{stock.mos.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`font-mono font-bold ${stock.cagr >= 10 ? 'text-green-400' : stock.cagr >= 7 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {stock.cagr}%
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-gray-300">{stock.divYield.toFixed(1)}%</td>
                            <td className="px-3 py-3 font-mono text-blue-300">{stock.growth}%</td>
                            {[stock.peScore, stock.dcfScore, stock.gdmScore].map((sc, si) => {
                              const ms = moduleSymbol(sc);
                              return (
                                <td key={si} className="px-3 py-3 text-center">
                                  <span className={`font-bold ${ms.cls}`}>{ms.icon}</span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <ScoreBar score={stock.overall} />
                                <span
                                  className="text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap"
                                  style={{ color: sig.color, background: sig.bg, borderColor: sig.color + '40' }}
                                >
                                  {sig.text}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
                <div className="font-semibold text-gray-400 mb-2">📐 スコア算出ロジック（三角測量）</div>
                <div className="space-y-1">
                  <div><span className="text-blue-400">P/E:</span> 実績P/E ÷ セクター平均P/E の乖離率で評価</div>
                  <div><span className="text-amber-400">DCF:</span> EPS × 成長率投影 → 10年DCF + ターミナルバリュー（割引率9%）</div>
                  <div><span className="text-purple-400">GDM:</span> 将来EPS × 出口P/E + 累積配当 → 10年CAGR vs 目標10%</div>
                </div>
              </div>
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
                <div className="font-semibold text-gray-400 mb-2">⚠️ 免責事項</div>
                <div>
                  本データはYahoo Finance（非公式API）から取得しており、情報の正確性を保証しません。
                  DCF・GDMの数値は単純化されたモデルに基づく参考値です。
                  <strong className="text-gray-400"> 投資判断はご自身の責任で行ってください。</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
