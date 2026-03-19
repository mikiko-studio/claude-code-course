'use client';

import { useState, useEffect } from 'react';
import { ASSET_CATEGORIES, ASSET_LABELS } from '../../../lib/portfolio';
import type { AssetCategory, PortfolioData, Mortgage, LifeEvent } from '../../../lib/portfolio';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DashboardSettings {
  age: number;
  riskTolerance: 1 | 2 | 3 | 4 | 5;
  bondYield: number; // decimal (0.008 = 0.8%)
}

interface DraftPortfolio  extends Record<AssetCategory, string> {}
interface DraftMortgage   { balance: string; rate: string; type: 'variable' | 'fixed'; remainingYears: string; }
interface DraftSettings   { age: string; riskTolerance: string; bondYield: string; }
interface DraftLifeEvent  { id: number; title: string; date: string; amount: string; }

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  portfolio: PortfolioData;
  mortgage: Mortgage;
  settings: DashboardSettings;
  lifeEvents: LifeEvent[];
  onApply: (data: {
    portfolio: PortfolioData;
    mortgage: Mortgage;
    settings: DashboardSettings;
    lifeEvents: LifeEvent[];
  }) => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const toMan  = (yen: number) => String(Math.round(yen / 10_000));
const toPct  = (dec: number, digits = 2) => (dec * 100).toFixed(digits);

function initDraft(
  portfolio: PortfolioData,
  mortgage: Mortgage,
  settings: DashboardSettings,
  lifeEvents: LifeEvent[],
) {
  const draftPortfolio = Object.fromEntries(
    ASSET_CATEGORIES.map(cat => [cat, toMan(portfolio[cat])]),
  ) as DraftPortfolio;

  return {
    portfolio: draftPortfolio,
    mortgage: {
      balance:        toMan(mortgage.balance),
      rate:           toPct(mortgage.rate),
      type:           mortgage.type,
      remainingYears: String(mortgage.remainingYears ?? ''),
    } as DraftMortgage,
    settings: {
      age:            String(settings.age),
      riskTolerance:  String(settings.riskTolerance),
      bondYield:      toPct(settings.bondYield),
    } as DraftSettings,
    lifeEvents: lifeEvents.map((e, i) => ({
      id: i,
      title:  e.title,
      date:   e.date,
      amount: toMan(e.amount),
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// FormInput
// ─────────────────────────────────────────────────────────────

function FormInput({
  label, value, onChange, unit, min, step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-slate-400">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          min={min}
          step={step ?? 'any'}
          onChange={e => onChange(e.target.value)}
          className="
            flex-1 min-w-0 bg-slate-800 border border-slate-700/80 rounded-lg
            px-3 py-1.5 text-sm text-slate-200
            focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
          "
        />
        {unit && <span className="text-[11px] text-slate-500 w-6 flex-shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SectionLabel
// ─────────────────────────────────────────────────────────────

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 pt-4 border-t border-slate-800">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// InputDrawer
// ─────────────────────────────────────────────────────────────

export default function InputDrawer({
  open, onClose, portfolio, mortgage, settings, lifeEvents, onApply,
}: DrawerProps) {
  const [draft, setDraft] = useState(() => initDraft(portfolio, mortgage, settings, lifeEvents));

  // Re-init draft when drawer opens with latest values
  useEffect(() => {
    if (open) setDraft(initDraft(portfolio, mortgage, settings, lifeEvents));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Portfolio setters ──────────────────────────────────────
  const setPortfolioField = (cat: AssetCategory, v: string) =>
    setDraft(d => ({ ...d, portfolio: { ...d.portfolio, [cat]: v } }));

  // ── Mortgage setters ───────────────────────────────────────
  const setMortgageField = <K extends keyof DraftMortgage>(k: K, v: DraftMortgage[K]) =>
    setDraft(d => ({ ...d, mortgage: { ...d.mortgage, [k]: v } }));

  // ── Settings setters ───────────────────────────────────────
  const setSettingsField = <K extends keyof DraftSettings>(k: K, v: string) =>
    setDraft(d => ({ ...d, settings: { ...d.settings, [k]: v } }));

  // ── Life events ────────────────────────────────────────────
  const addEvent = () =>
    setDraft(d => ({
      ...d,
      lifeEvents: [
        ...d.lifeEvents,
        { id: Date.now(), title: '', date: '', amount: '' },
      ],
    }));

  const removeEvent = (id: number) =>
    setDraft(d => ({ ...d, lifeEvents: d.lifeEvents.filter(e => e.id !== id) }));

  const setEventField = (id: number, k: keyof DraftLifeEvent, v: string) =>
    setDraft(d => ({
      ...d,
      lifeEvents: d.lifeEvents.map(e => e.id === id ? { ...e, [k]: v } : e),
    }));

  // ── Apply ──────────────────────────────────────────────────
  const handleApply = () => {
    const newPortfolio = Object.fromEntries(
      ASSET_CATEGORIES.map(cat => [cat, (parseFloat(draft.portfolio[cat]) || 0) * 10_000]),
    ) as PortfolioData;

    const newMortgage: Mortgage = {
      label:          '住宅ローン',
      balance:        (parseFloat(draft.mortgage.balance)        || 0) * 10_000,
      rate:           (parseFloat(draft.mortgage.rate)           || 0) / 100,
      type:           draft.mortgage.type,
      remainingYears: parseInt(draft.mortgage.remainingYears)    || undefined,
    };

    const clampRT = (n: number): 1|2|3|4|5 =>
      Math.max(1, Math.min(5, n)) as 1|2|3|4|5;

    const newSettings: DashboardSettings = {
      age:            parseInt(draft.settings.age)          || 48,
      riskTolerance:  clampRT(parseInt(draft.settings.riskTolerance) || 3),
      bondYield:      (parseFloat(draft.settings.bondYield) || 0) / 100,
    };

    const newEvents: LifeEvent[] = draft.lifeEvents
      .filter(e => e.title && e.date)
      .map(e => ({
        title:  e.title,
        date:   e.date,
        amount: (parseFloat(e.amount) || 0) * 10_000,
      }));

    onApply({ portfolio: newPortfolio, mortgage: newMortgage, settings: newSettings, lifeEvents: newEvents });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 z-50
          bg-[#0c1120] border-l border-slate-800/80
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-200">データ入力・設定</span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">

          {/* ── Portfolio ───────────────────────────────────── */}
          <DrawerSection title="保有資産（万円単位）">
            <div className="space-y-2.5">
              {ASSET_CATEGORIES.map(cat => (
                <FormInput
                  key={cat}
                  label={ASSET_LABELS[cat]}
                  value={draft.portfolio[cat]}
                  onChange={v => setPortfolioField(cat, v)}
                  unit="万"
                  min="0"
                />
              ))}
            </div>
          </DrawerSection>

          {/* ── Mortgage ────────────────────────────────────── */}
          <DrawerSection title="住宅ローン">
            <div className="space-y-2.5">
              <FormInput
                label="残高"
                value={draft.mortgage.balance}
                onChange={v => setMortgageField('balance', v)}
                unit="万"
                min="0"
              />
              <FormInput
                label="金利"
                value={draft.mortgage.rate}
                onChange={v => setMortgageField('rate', v)}
                unit="%"
                min="0"
                step="0.01"
              />
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">タイプ</label>
                <div className="flex gap-3">
                  {(['variable', 'fixed'] as const).map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mortgageType"
                        checked={draft.mortgage.type === t}
                        onChange={() => setMortgageField('type', t)}
                        className="accent-blue-500"
                      />
                      <span className="text-sm text-slate-300">
                        {t === 'variable' ? '変動' : '固定'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <FormInput
                label="残存年数"
                value={draft.mortgage.remainingYears}
                onChange={v => setMortgageField('remainingYears', v)}
                unit="年"
                min="0"
                step="1"
              />
            </div>
          </DrawerSection>

          {/* ── Profile ─────────────────────────────────────── */}
          <DrawerSection title="プロフィール・設定">
            <div className="space-y-2.5">
              <FormInput
                label="年齢"
                value={draft.settings.age}
                onChange={v => setSettingsField('age', v)}
                unit="歳"
                min="20"
                step="1"
              />
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">
                  リスク許容度（1＝保守〜5＝積極）
                </label>
                <div className="flex gap-1">
                  {(['1','2','3','4','5'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setSettingsField('riskTolerance', v)}
                      className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                        draft.settings.riskTolerance === v
                          ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <FormInput
                label="国内債券 想定利回り"
                value={draft.settings.bondYield}
                onChange={v => setSettingsField('bondYield', v)}
                unit="%"
                min="0"
                step="0.01"
              />
            </div>
          </DrawerSection>

          {/* ── Life Events ─────────────────────────────────── */}
          <DrawerSection title="ライフイベント">
            <div className="space-y-3">
              {draft.lifeEvents.map(ev => (
                <div key={ev.id} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">イベント</span>
                    <button
                      onClick={() => removeEvent(ev.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors text-xs"
                    >
                      削除
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="イベント名"
                    value={ev.title}
                    onChange={e => setEventField(ev.id, 'title', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/70"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={ev.date}
                      onChange={e => setEventField(ev.id, 'date', e.target.value)}
                      className="bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/70"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="金額"
                        value={ev.amount}
                        min="0"
                        onChange={e => setEventField(ev.id, 'amount', e.target.value)}
                        className="flex-1 min-w-0 bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/70 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-[10px] text-slate-500">万</span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addEvent}
                className="w-full py-2 text-xs text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/10 transition-colors"
              >
                ＋ イベントを追加
              </button>
            </div>
          </DrawerSection>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800/80 flex-shrink-0">
          <button
            onClick={handleApply}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/40"
          >
            適用してダッシュボードを更新
          </button>
        </div>
      </div>
    </>
  );
}
