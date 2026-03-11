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

function fmtUSD(v: number, dec = 2) {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
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
  const [data,      setData]      = useState<StockResult[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [meta,      setMeta]      = useState<{ timestamp: string; total: number; universe: number } | null>(null);
  const [sortKey,   setSortKey]   = useState<SortKey>('overall');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'cards' | 'table'>('cards');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/screener');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data ?? []);
      setMeta({ timestamp: json.timestamp, total: json.total, universe: json.universe });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
              <p className="text-gray-600 text-sm mt-1">約80銘柄を三角測量スクリーニング中</p>
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

        {/* ── Main Content ── */}
        {!loading && !error && data.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'スクリーニング銘柄', value: meta?.universe ?? 0, unit: '銘柄', sub: '米国主要株' },
                { label: '取得成功',           value: meta?.total   ?? 0, unit: '銘柄', sub: 'データ有効' },
                { label: '分析手法',           value: 3,                  unit: '手法', sub: 'P/E · DCF · GDM' },
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

                        <div className="text-3xl font-bold mb-4">{fmtUSD(stock.price)}</div>

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
                            <div className="text-xs font-bold text-amber-300">{fmtUSD(stock.intrinsic, 0)}</div>
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

                        <div className="text-lg font-bold mb-2">{fmtUSD(stock.price)}</div>

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
                      {sorted.map((stock, i) => {
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
                            <td className="px-3 py-3 font-mono font-bold">{fmtUSD(stock.price)}</td>
                            <td className="px-3 py-3">
                              <span className={`font-mono font-semibold ${stock.trailPE < stock.sectorPE ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.trailPE}x
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-gray-500 text-xs">{stock.sectorPE}x</td>
                            <td className="px-3 py-3 font-mono text-amber-300 font-semibold">
                              {fmtUSD(stock.intrinsic, 0)}
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
