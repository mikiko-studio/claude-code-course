import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export const dynamic = 'force-dynamic';

// ─── Stock Universe ───────────────────────────────────────────────────────────
const STOCKS: { symbol: string; sector: string }[] = [
  // Technology
  { symbol: 'AAPL',  sector: 'Technology' },
  { symbol: 'MSFT',  sector: 'Technology' },
  { symbol: 'GOOGL', sector: 'Technology' },
  { symbol: 'META',  sector: 'Technology' },
  { symbol: 'NVDA',  sector: 'Technology' },
  { symbol: 'ORCL',  sector: 'Technology' },
  { symbol: 'CRM',   sector: 'Technology' },
  { symbol: 'ADBE',  sector: 'Technology' },
  { symbol: 'INTC',  sector: 'Technology' },
  { symbol: 'CSCO',  sector: 'Technology' },
  { symbol: 'IBM',   sector: 'Technology' },
  { symbol: 'QCOM',  sector: 'Technology' },
  { symbol: 'AMD',   sector: 'Technology' },
  { symbol: 'TXN',   sector: 'Technology' },
  // Financials
  { symbol: 'JPM',   sector: 'Financials' },
  { symbol: 'BAC',   sector: 'Financials' },
  { symbol: 'WFC',   sector: 'Financials' },
  { symbol: 'GS',    sector: 'Financials' },
  { symbol: 'MS',    sector: 'Financials' },
  { symbol: 'BRK-B', sector: 'Financials' },
  { symbol: 'V',     sector: 'Financials' },
  { symbol: 'MA',    sector: 'Financials' },
  { symbol: 'AXP',   sector: 'Financials' },
  { symbol: 'BLK',   sector: 'Financials' },
  { symbol: 'C',     sector: 'Financials' },
  // Healthcare
  { symbol: 'JNJ',   sector: 'Healthcare' },
  { symbol: 'PFE',   sector: 'Healthcare' },
  { symbol: 'MRK',   sector: 'Healthcare' },
  { symbol: 'ABBV',  sector: 'Healthcare' },
  { symbol: 'BMY',   sector: 'Healthcare' },
  { symbol: 'LLY',   sector: 'Healthcare' },
  { symbol: 'UNH',   sector: 'Healthcare' },
  { symbol: 'CVS',   sector: 'Healthcare' },
  { symbol: 'ABT',   sector: 'Healthcare' },
  { symbol: 'AMGN',  sector: 'Healthcare' },
  { symbol: 'GILD',  sector: 'Healthcare' },
  // Consumer Discretionary
  { symbol: 'AMZN',  sector: 'Consumer Discretionary' },
  { symbol: 'TSLA',  sector: 'Consumer Discretionary' },
  { symbol: 'HD',    sector: 'Consumer Discretionary' },
  { symbol: 'LOW',   sector: 'Consumer Discretionary' },
  { symbol: 'MCD',   sector: 'Consumer Discretionary' },
  { symbol: 'SBUX',  sector: 'Consumer Discretionary' },
  { symbol: 'NKE',   sector: 'Consumer Discretionary' },
  { symbol: 'TGT',   sector: 'Consumer Discretionary' },
  { symbol: 'F',     sector: 'Consumer Discretionary' },
  { symbol: 'GM',    sector: 'Consumer Discretionary' },
  // Consumer Staples
  { symbol: 'WMT',   sector: 'Consumer Staples' },
  { symbol: 'COST',  sector: 'Consumer Staples' },
  { symbol: 'PG',    sector: 'Consumer Staples' },
  { symbol: 'KO',    sector: 'Consumer Staples' },
  { symbol: 'PEP',   sector: 'Consumer Staples' },
  { symbol: 'PM',    sector: 'Consumer Staples' },
  { symbol: 'CL',    sector: 'Consumer Staples' },
  // Energy
  { symbol: 'XOM',   sector: 'Energy' },
  { symbol: 'CVX',   sector: 'Energy' },
  { symbol: 'COP',   sector: 'Energy' },
  { symbol: 'EOG',   sector: 'Energy' },
  { symbol: 'SLB',   sector: 'Energy' },
  { symbol: 'OXY',   sector: 'Energy' },
  // Industrials
  { symbol: 'BA',    sector: 'Industrials' },
  { symbol: 'GE',    sector: 'Industrials' },
  { symbol: 'CAT',   sector: 'Industrials' },
  { symbol: 'HON',   sector: 'Industrials' },
  { symbol: 'RTX',   sector: 'Industrials' },
  { symbol: 'LMT',   sector: 'Industrials' },
  { symbol: 'UPS',   sector: 'Industrials' },
  { symbol: 'FDX',   sector: 'Industrials' },
  { symbol: 'DE',    sector: 'Industrials' },
  // Utilities
  { symbol: 'NEE',   sector: 'Utilities' },
  { symbol: 'DUK',   sector: 'Utilities' },
  { symbol: 'SO',    sector: 'Utilities' },
  { symbol: 'D',     sector: 'Utilities' },
  // Real Estate
  { symbol: 'AMT',   sector: 'Real Estate' },
  { symbol: 'PLD',   sector: 'Real Estate' },
  { symbol: 'O',     sector: 'Real Estate' },
  // Materials
  { symbol: 'LIN',   sector: 'Materials' },
  { symbol: 'APD',   sector: 'Materials' },
  { symbol: 'NEM',   sector: 'Materials' },
  { symbol: 'FCX',   sector: 'Materials' },
  // Communication Services
  { symbol: 'DIS',   sector: 'Communication Services' },
  { symbol: 'NFLX',  sector: 'Communication Services' },
  { symbol: 'T',     sector: 'Communication Services' },
  { symbol: 'VZ',    sector: 'Communication Services' },
  { symbol: 'CMCSA', sector: 'Communication Services' },
];

// ─── Sector P/E Benchmarks ────────────────────────────────────────────────────
const SECTOR_PE: Record<string, number> = {
  'Technology':               27,
  'Financials':               13,
  'Healthcare':               20,
  'Consumer Discretionary':   22,
  'Consumer Staples':         21,
  'Energy':                   12,
  'Industrials':              20,
  'Utilities':                18,
  'Real Estate':              28,
  'Materials':                16,
  'Communication Services':   18,
};
const DEFAULT_PE = 21;

// ─── Sector-specific growth caps (realistic LT growth ceilings) ───────────────
const SECTOR_MAX_GROWTH: Record<string, number> = {
  'Technology':               0.20,
  'Financials':               0.10,
  'Healthcare':               0.12,
  'Consumer Discretionary':   0.12,
  'Consumer Staples':         0.08,
  'Energy':                   0.08,
  'Industrials':              0.10,
  'Utilities':                0.05,
  'Real Estate':              0.07,
  'Materials':                0.08,
  'Communication Services':   0.08,
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DISCOUNT_RATE   = 0.09;
const TERMINAL_GROWTH = 0.03;
const YEARS           = 10;
const HURDLE_RATE     = 0.10;

// ─── Calculations ─────────────────────────────────────────────────────────────
function dcfIntrinsic(eps: number, growth: number): number {
  if (DISCOUNT_RATE <= TERMINAL_GROWTH) return 0;
  let pv = 0;
  for (let y = 1; y <= YEARS; y++) {
    pv += (eps * Math.pow(1 + growth, y)) / Math.pow(1 + DISCOUNT_RATE, y);
  }
  const fcfN = eps * Math.pow(1 + growth, YEARS);
  const tv   = (fcfN * (1 + TERMINAL_GROWTH)) / (DISCOUNT_RATE - TERMINAL_GROWTH);
  return pv + tv / Math.pow(1 + DISCOUNT_RATE, YEARS);
}

function gdmCagr(
  eps: number, growth: number, divYield: number,
  exitPE: number, price: number
): number {
  const futureEPS   = eps * Math.pow(1 + growth, YEARS);
  const futurePrice = futureEPS * exitPE;
  const totalDivs   = price * divYield * YEARS;
  return Math.pow((futurePrice + totalDivs) / price, 1 / YEARS) - 1;
}

function scorePE(pe: number, sectorPE: number): number {
  const d = (pe - sectorPE) / sectorPE;
  if (d <= -0.30) return  2;
  if (d <= -0.10) return  1;
  if (d <=  0.10) return  0;
  if (d <=  0.30) return -1;
  return -2;
}

function scoreDCF(intrinsic: number, price: number): number {
  const mos = (intrinsic - price) / intrinsic;
  if (mos >= 0.40) return  2;
  if (mos >= 0.20) return  1;
  if (mos >= -0.10) return  0;
  if (mos >= -0.30) return -1;
  return -2;
}

function scoreGDM(cagr: number): number {
  if (cagr >= HURDLE_RATE + 0.05) return  2;
  if (cagr >= HURDLE_RATE)        return  1;
  if (cagr >= HURDLE_RATE - 0.03) return  0;
  if (cagr >= HURDLE_RATE - 0.05) return -1;
  return -2;
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const symbols = STOCKS.map(s => s.symbol);
    const sectorOf = Object.fromEntries(STOCKS.map(s => [s.symbol, s.sector]));

    // Batch fetch quotes (yahoo-finance2 handles crumb/cookie internally)
    const BATCH = 20;
    const batches: string[][] = [];
    for (let i = 0; i < symbols.length; i += BATCH) {
      batches.push(symbols.slice(i, i + BATCH));
    }

    const allQuotes: Awaited<ReturnType<typeof yahooFinance.quote>>[] = [];
    for (const batch of batches) {
      try {
        const results = await Promise.all(
          batch.map(sym =>
            yahooFinance.quote(sym, {}, { validateResult: false }).catch(() => null)
          )
        );
        const valid = results.filter(Boolean) as Awaited<ReturnType<typeof yahooFinance.quote>>[];
        allQuotes.push(...valid);
      } catch {
        // continue with partial results
      }
    }

    const scored = allQuotes
      .filter(q =>
        q.regularMarketPrice != null &&
        q.regularMarketPrice > 0 &&
        q.epsTrailingTwelveMonths != null &&
        q.epsTrailingTwelveMonths > 0
      )
      .map(q => {
        const price    = q.regularMarketPrice!;
        const eps      = q.epsTrailingTwelveMonths!;
        const sector   = sectorOf[q.symbol] ?? 'Other';
        const sectorPE = SECTOR_PE[sector] ?? DEFAULT_PE;
        const trailPE  = (q.trailingPE ?? (price / eps));
        const fwdPE    = (q.forwardPE  ?? trailPE);

        // Growth rate: blend implied 1Y EPS growth with sector ceiling
        const maxGrowth = SECTOR_MAX_GROWTH[sector] ?? 0.12;
        let growth = Math.min(0.05, maxGrowth); // conservative base
        if (q.epsForward != null && q.epsForward > 0 && eps > 0) {
          const g1 = (q.epsForward - eps) / eps;
          if (g1 > 0 && g1 < 1.0) {
            // Blend: 60% implied 1Y growth (capped at sector max), 40% base 5%
            growth = Math.min(maxGrowth, g1 * 0.6 + 0.05 * 0.4);
          }
        }
        // earningsGrowth (quarterly YoY) as secondary signal
        if (q.earningsGrowth != null && q.earningsGrowth > 0 && q.earningsGrowth < 0.5) {
          growth = Math.min(maxGrowth, (growth + q.earningsGrowth) / 2);
        }
        growth = Math.max(0.01, growth);

        // Dividend yield: Yahoo Finance returns trailingAnnualDividendYield as decimal (0.066 = 6.6%)
        // If value > 0.3, assume it was returned as percentage; divide by 100
        const rawYield = q.trailingAnnualDividendYield ?? q.dividendYield ?? 0;
        const divYield = rawYield > 0.3 ? rawYield / 100 : rawYield;
        const intrinsic = dcfIntrinsic(eps, growth);
        const mos       = intrinsic > 0 ? (intrinsic - price) / intrinsic * 100 : -99;
        const cagr      = gdmCagr(eps, growth, divYield, fwdPE, price);

        const peScore   = scorePE(trailPE, sectorPE);
        const dcfScore  = scoreDCF(intrinsic, price);
        const gdmScore  = scoreGDM(cagr);
        const overall   = (peScore + dcfScore + gdmScore) / 3;

        const name = (q.shortName ?? q.longName ?? q.symbol)
          .replace(', Inc.', '').replace(' Corporation', '').replace(' Corp.', '')
          .replace(' Incorporated', '').replace(', Inc', '');

        return {
          symbol:    q.symbol,
          name,
          sector,
          price:     Math.round(price * 100) / 100,
          eps:       Math.round(eps * 100) / 100,
          trailPE:   Math.round(trailPE * 10) / 10,
          fwdPE:     Math.round(fwdPE * 10) / 10,
          sectorPE,
          growth:    Math.round(growth * 1000) / 10,   // as %
          divYield:  Math.round(divYield * 1000) / 10,  // as %
          intrinsic: Math.round(intrinsic * 100) / 100,
          mos:       Math.round(mos * 10) / 10,
          cagr:      Math.round(cagr * 1000) / 10,     // as %
          peScore,
          dcfScore,
          gdmScore,
          overall:   Math.round(overall * 100) / 100,
          currency:  q.currency ?? 'USD',
        };
      })
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 20);

    return NextResponse.json({
      data:      scored,
      total:     allQuotes.length,
      universe:  symbols.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[screener] error:', err);
    return NextResponse.json(
      { error: 'データの取得に失敗しました。しばらく経ってから再試行してください。' },
      { status: 500 }
    );
  }
}
