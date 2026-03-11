import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export const dynamic = 'force-dynamic';

// ─── Sector Benchmarks ────────────────────────────────────────────────────────
const US_SECTOR_PE: Record<string, number> = {
  'Technology': 27, 'Financials': 13, 'Healthcare': 20,
  'Consumer Discretionary': 22, 'Consumer Staples': 21, 'Energy': 12,
  'Industrials': 20, 'Utilities': 18, 'Real Estate': 28,
  'Materials': 16, 'Communication Services': 18,
};
const JP_SECTOR_PE: Record<string, number> = {
  'Technology': 25, 'Financials': 11, 'Healthcare': 28,
  'Consumer Discretionary': 22, 'Consumer Staples': 20, 'Energy': 10,
  'Industrials': 15, 'Utilities': 14, 'Real Estate': 20,
  'Materials': 12, 'Communication Services': 14,
};
const US_SECTOR_MAX_GROWTH: Record<string, number> = {
  'Technology': 0.20, 'Financials': 0.10, 'Healthcare': 0.12,
  'Consumer Discretionary': 0.12, 'Consumer Staples': 0.08, 'Energy': 0.08,
  'Industrials': 0.10, 'Utilities': 0.05, 'Real Estate': 0.07,
  'Materials': 0.08, 'Communication Services': 0.08,
};
const JP_SECTOR_MAX_GROWTH: Record<string, number> = {
  'Technology': 0.15, 'Financials': 0.07, 'Healthcare': 0.10,
  'Consumer Discretionary': 0.10, 'Consumer Staples': 0.06, 'Energy': 0.06,
  'Industrials': 0.08, 'Utilities': 0.04, 'Real Estate': 0.06,
  'Materials': 0.07, 'Communication Services': 0.06,
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DISCOUNT_RATE = 0.09, TERMINAL_GROWTH = 0.03, YEARS = 10, HURDLE_RATE = 0.10;

function dcfIntrinsic(eps: number, growth: number): number {
  if (DISCOUNT_RATE <= TERMINAL_GROWTH) return 0;
  let pv = 0;
  for (let y = 1; y <= YEARS; y++) pv += (eps * Math.pow(1 + growth, y)) / Math.pow(1 + DISCOUNT_RATE, y);
  const fcfN = eps * Math.pow(1 + growth, YEARS);
  const tv = (fcfN * (1 + TERMINAL_GROWTH)) / (DISCOUNT_RATE - TERMINAL_GROWTH);
  return pv + tv / Math.pow(1 + DISCOUNT_RATE, YEARS);
}

function gdmCagr(eps: number, growth: number, divYield: number, exitPE: number, price: number): number {
  const futureEPS = eps * Math.pow(1 + growth, YEARS);
  return Math.pow((futureEPS * exitPE + price * divYield * YEARS) / price, 1 / YEARS) - 1;
}

function scorePE(pe: number, sectorPE: number): number {
  const d = (pe - sectorPE) / sectorPE;
  return d <= -0.30 ? 2 : d <= -0.10 ? 1 : d <= 0.10 ? 0 : d <= 0.30 ? -1 : -2;
}
function scoreDCF(intrinsic: number, price: number): number {
  const mos = (intrinsic - price) / intrinsic;
  return mos >= 0.40 ? 2 : mos >= 0.20 ? 1 : mos >= -0.10 ? 0 : mos >= -0.30 ? -1 : -2;
}
function scoreGDM(cagr: number): number {
  return cagr >= HURDLE_RATE + 0.05 ? 2 : cagr >= HURDLE_RATE ? 1 : cagr >= HURDLE_RATE - 0.03 ? 0 : cagr >= HURDLE_RATE - 0.05 ? -1 : -2;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSymbol = searchParams.get('symbol')?.trim().toUpperCase();

  if (!rawSymbol) {
    return NextResponse.json({ error: 'ティッカーを入力してください' }, { status: 400 });
  }

  const market = rawSymbol.endsWith('.T') ? 'jp' : 'us';
  const SECTOR_PE = market === 'jp' ? JP_SECTOR_PE : US_SECTOR_PE;
  const SECTOR_MAX_GROWTH = market === 'jp' ? JP_SECTOR_MAX_GROWTH : US_SECTOR_MAX_GROWTH;
  const DEFAULT_PE = market === 'jp' ? 16 : 21;

  try {
    const q = await yahooFinance.quote(rawSymbol, {}, { validateResult: false });

    if (!q || q.regularMarketPrice == null) {
      return NextResponse.json({ error: `"${rawSymbol}" のデータが見つかりません。ティッカー記号を確認してください。` }, { status: 404 });
    }
    if (q.epsTrailingTwelveMonths == null || q.epsTrailingTwelveMonths <= 0) {
      return NextResponse.json({
        error: `${rawSymbol} の EPS データが取得できません。赤字企業や ETF は分析できません。`,
      }, { status: 422 });
    }

    const price = q.regularMarketPrice;
    const eps = q.epsTrailingTwelveMonths;

    // Sector: Yahoo Finance quote may return sector field
    const sector = (q as Record<string, unknown>)['sector'] as string | undefined ?? 'Other';
    const sectorPE = SECTOR_PE[sector] ?? DEFAULT_PE;
    const maxGrowth = SECTOR_MAX_GROWTH[sector] ?? (market === 'jp' ? 0.08 : 0.12);

    const trailPE = q.trailingPE ?? (price / eps);
    const fwdPE = q.forwardPE ?? trailPE;

    let growth = Math.min(0.05, maxGrowth);
    if (q.epsForward != null && q.epsForward > 0 && eps > 0) {
      const g1 = (q.epsForward - eps) / eps;
      if (g1 > 0 && g1 < 1.0) growth = Math.min(maxGrowth, g1 * 0.6 + 0.05 * 0.4);
    }
    if (q.earningsGrowth != null && q.earningsGrowth > 0 && q.earningsGrowth < 0.5) {
      growth = Math.min(maxGrowth, (growth + q.earningsGrowth) / 2);
    }
    growth = Math.max(0.01, growth);

    const rawYield = q.trailingAnnualDividendYield ?? q.dividendYield ?? 0;
    const divYield = rawYield > 0.3 ? rawYield / 100 : rawYield;

    const intrinsic = dcfIntrinsic(eps, growth);
    const mos = intrinsic > 0 ? (intrinsic - price) / intrinsic * 100 : -99;
    const cagr = gdmCagr(eps, growth, divYield, fwdPE, price);

    const peScore = scorePE(trailPE, sectorPE);
    const dcfScore = scoreDCF(intrinsic, price);
    const gdmScore = scoreGDM(cagr);
    const overall = (peScore + dcfScore + gdmScore) / 3;

    const name = (q.shortName ?? q.longName ?? rawSymbol)
      .replace(', Inc.', '').replace(' Corporation', '').replace(' Corp.', '')
      .replace(' Incorporated', '').replace(', Inc', '');

    return NextResponse.json({
      data: {
        symbol:    rawSymbol,
        name,
        sector,
        price:     Math.round(price * 100) / 100,
        eps:       Math.round(eps * 100) / 100,
        trailPE:   Math.round(trailPE * 10) / 10,
        fwdPE:     Math.round(fwdPE * 10) / 10,
        sectorPE,
        growth:    Math.round(growth * 1000) / 10,
        divYield:  Math.round(divYield * 1000) / 10,
        intrinsic: Math.round(intrinsic * 100) / 100,
        mos:       Math.round(mos * 10) / 10,
        cagr:      Math.round(cagr * 1000) / 10,
        peScore,
        dcfScore,
        gdmScore,
        overall:   Math.round(overall * 100) / 100,
        currency:  q.currency ?? (market === 'jp' ? 'JPY' : 'USD'),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[stock] error:', err);
    return NextResponse.json({ error: 'データ取得中にエラーが発生しました。しばらく経ってから再試行してください。' }, { status: 500 });
  }
}
