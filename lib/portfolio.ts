// =============================================================
// ポートフォリオ診断エンジン
// =============================================================

// -------------------------------------------------------------
// 定数・ラベル
// -------------------------------------------------------------

export const ASSET_CATEGORIES = [
  'japanEquity',   // 日本株
  'foreignEquity', // 外国株
  'domesticBond',  // 国内債券（キャッシュ同等の超安全資産）
  'foreignBond',   // 外国債券（主に米国債・為替リスクあり）
  'jReit',         // J-REIT
  'alternative',   // オルタナティブ（セキュリティトークン等）
  'cash',          // 現金
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_LABELS: Record<AssetCategory, string> = {
  japanEquity:   '日本株',
  foreignEquity: '外国株',
  domesticBond:  '国内債券',
  foreignBond:   '外国債券',
  jReit:         'J-REIT',
  alternative:   'オルタナティブ',
  cash:          '現金',
};

// リスク許容度ごとのリスク資産比率乗数
const RISK_MULTIPLIERS: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0.70, // 保守的
  2: 0.85,
  3: 1.00, // 標準
  4: 1.15,
  5: 1.30, // 積極的
};

// -------------------------------------------------------------
// データ型定義
// -------------------------------------------------------------

/** 各カテゴリの評価額（円） */
export type PortfolioData = Record<AssetCategory, number>;

/** 各カテゴリの目標比率（0〜1、合計1.0） */
export type TargetAllocation = Record<AssetCategory, number>;

/** 理想比率算出オプション */
export interface CalculateTargetOptions {
  /**
   * 外国債券をリスク資産としてカウントするか（デフォルト: false）
   * true の場合、金利水準・インフレ耐性を考慮してリスクバケツに分類する
   */
  foreignBondAsRiskAsset?: boolean;
}

/** ライフイベント（タイムライン管理） */
export interface LifeEvent {
  title: string;   // イベント名（例: 「長男 豪州留学」）
  date: string;    // 予定日 YYYY-MM-DD
  amount: number;  // 必要額（円）
}

/** ライフイベント調整結果 */
export interface LifeEventAdjustment {
  reservedCash: number;       // 確保すべき安全資産総額
  investableAmount: number;   // 投資可能額
  events: LifeEvent[];
  breakdown: Array<{
    event: LifeEvent;
    yearsUntil: number;       // 基準日からの年数
    reservedAmount: number;   // 実際に確保する金額
    reserveRate: number;      // 確保率（0〜1）
  }>;
}

/**
 * 指定期間内に必要な流動資産の算出結果
 * calculateRequiredLiquidity の戻り値
 */
export interface LiquidityRequirement {
  horizonYears: number;
  cutoffDate: string;              // 基準日 + horizonYears の日付
  totalRequired: number;           // 期間内イベントの合計額
  upcomingEvents: LifeEvent[];     // 対象イベント
  requiredRatio: number;           // totalRequired / totalAssets
  /**
   * calculateTargetAllocation の結果へ上乗せする比率。
   * 国内債券（超安全資産）と現金に 50:50 で配分する。
   */
  allocationBoost: {
    cash: number;
    domesticBond: number;
  };
}

/** 流動性安全余裕度の評価結果 */
export interface LiquiditySafetyResult {
  currentLiquidity: number;   // 現在の現金 + 国内債券
  requiredLiquidity: number;  // 期間内に必要な流動資産
  shortfall: number;          // 不足額（充足なら 0）
  coverageRatio: number;      // currentLiquidity / requiredLiquidity（1.0 以上で充足）
  isAdequate: boolean;
  warning: string | null;
  recommendation: string | null;
}

/** リバランス単品 */
export interface RebalanceItem {
  category: AssetCategory;
  label: string;
  currentAmount: number;
  currentRatio: number;  // 現在の比率
  targetRatio: number;   // 目標比率
  targetAmount: number;  // 目標評価額
  delta: number;         // +: 買い増し / −: 売却（円）
}

/** リバランス計算結果 */
export interface RebalanceResult {
  totalAssets: number;
  items: RebalanceItem[];
}

/** 為替感応度 */
export interface FxSensitivity {
  foreignAssets: number;         // 外貨建て資産合計（外国株 + 外国債券）
  foreignAssetsRatio: number;    // ポートフォリオ全体に占める外貨建て比率
  /** 円高1%での評価額変動（概算・マイナスが損失） */
  yenAppreciation1pct: number;
  /** 円安1%での評価額変動（概算・プラスが利得） */
  yenDepreciation1pct: number;
  breakdown: {
    foreignEquity: number;
    foreignBond: number;
  };
}

// -------------------------------------------------------------
// 理想比率の算出
// -------------------------------------------------------------

/**
 * 年齢とリスク許容度から理想アセットアロケーションを算出する。
 *
 * アルゴリズム:
 *   riskyRatio = clamp((120 - age) / 100 × riskMultiplier, 0, 0.95)
 *   safeRatio  = 1 - riskyRatio
 *
 * リスク資産内訳:
 *   - オルタナティブ: min(10%全体, riskyRatio × 15%)
 *   - 外国債券(オプション): riskyRatio × 20%（foreignBondAsRiskAsset=true 時のみ）
 *   - 残りを 日本株30% / 外国株55% / J-REIT15% で分配
 *
 * 安全資産内訳:
 *   foreignBondAsRiskAsset=false → 国内債券40% / 外国債券25% / 現金35%
 *   foreignBondAsRiskAsset=true  → 国内債券45% / 現金55%（外国債券はリスク側へ）
 */
export function calculateTargetAllocation(
  age: number,
  riskTolerance: 1 | 2 | 3 | 4 | 5,
  options: CalculateTargetOptions = {},
): TargetAllocation {
  const { foreignBondAsRiskAsset = false } = options;

  const baseRiskyRatio = (120 - age) / 100;
  const multiplier = RISK_MULTIPLIERS[riskTolerance];
  const riskyRatio = Math.min(Math.max(baseRiskyRatio * multiplier, 0), 0.95);
  const safeRatio = 1 - riskyRatio;

  // オルタナティブ: 全体の10%上限、またはリスク資産の15%以内の小さい方
  const altRatio = Math.min(0.10, riskyRatio * 0.15);

  let foreignBond: number;
  let equityReitRatio: number;
  let domesticBond: number;
  let cash: number;

  if (foreignBondAsRiskAsset) {
    // 外国債券をリスク資産扱い: riskyRatio の 20%（最大15%全体）
    foreignBond = Math.min(0.15, riskyRatio * 0.20);
    equityReitRatio = riskyRatio - altRatio - foreignBond;
    domesticBond = safeRatio * 0.45;
    cash = safeRatio * 0.55;
  } else {
    // 外国債券を安全資産扱い
    foreignBond = safeRatio * 0.25;
    equityReitRatio = riskyRatio - altRatio;
    domesticBond = safeRatio * 0.40;
    cash = safeRatio * 0.35;
  }

  const japanEquity   = equityReitRatio * 0.30;
  const foreignEquity = equityReitRatio * 0.55;
  const jReit         = equityReitRatio * 0.15;

  const raw: TargetAllocation = {
    japanEquity,
    foreignEquity,
    domesticBond,
    foreignBond,
    jReit,
    alternative: altRatio,
    cash,
  };

  // 浮動小数点誤差を吸収するため正規化
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  const result = {} as TargetAllocation;
  for (const key of ASSET_CATEGORIES) {
    result[key] = raw[key] / sum;
  }
  return result;
}

// -------------------------------------------------------------
// 内部ユーティリティ
// -------------------------------------------------------------

/** 2つの日付間の年数を小数で返す */
function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

/** Date を YYYY-MM-DD 文字列に変換 */
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// -------------------------------------------------------------
// 環境要因（ライフイベント）による調整
// -------------------------------------------------------------

/**
 * ライフイベントの date から yearsUntil を計算し、
 * 直近ライフイベントに備えた安全資産確保額と投資可能額を算出する。
 *
 * 確保率:
 *   yearsUntil ≤ 3 年 → 100%（全額確保）
 *   yearsUntil ≤ 5 年 → 85%（一部は継続運用可）
 *   yearsUntil > 5 年 → 70%（長期的な準備）
 *
 * 国内債券はキャッシュ同等の超安全資産として待機資金に充当することを想定。
 *
 * @param today - 基準日（省略時は実行日）
 */
export function adjustForLifeEvents(
  totalAssets: number,
  lifeEvents: LifeEvent[],
  today: Date = new Date(),
): LifeEventAdjustment {
  const breakdown = lifeEvents.map((event) => {
    const yearsUntil = yearsBetween(today, new Date(event.date));
    let reserveRate: number;
    if (yearsUntil <= 3) {
      reserveRate = 1.00;
    } else if (yearsUntil <= 5) {
      reserveRate = 0.85;
    } else {
      reserveRate = 0.70;
    }
    return {
      event,
      yearsUntil,
      reservedAmount: Math.round(event.amount * reserveRate),
      reserveRate,
    };
  });

  const reservedCash = breakdown.reduce((sum, b) => sum + b.reservedAmount, 0);
  const investableAmount = Math.max(0, totalAssets - reservedCash);

  return { reservedCash, investableAmount, events: lifeEvents, breakdown };
}

// -------------------------------------------------------------
// 必要流動資産の算出
// -------------------------------------------------------------

/**
 * 今日から horizonYears 以内に発生するライフイベントの合計金額を算出し、
 * 目標アロケーションへの上乗せ比率（allocationBoost）を返す。
 *
 * 上乗せは国内債券（超安全資産）と現金に 50:50 で配分する。
 *
 * @param totalAssets - 総資産額（比率計算のベース）
 * @param today       - 基準日（省略時は実行日）
 */
export function calculateRequiredLiquidity(
  events: LifeEvent[],
  totalAssets: number,
  horizonYears: number = 3,
  today: Date = new Date(),
): LiquidityRequirement {
  const cutoff = new Date(today);
  cutoff.setFullYear(cutoff.getFullYear() + horizonYears);

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) <= cutoff && new Date(e.date) >= today,
  );

  const totalRequired = upcomingEvents.reduce((sum, e) => sum + e.amount, 0);
  const requiredRatio = totalAssets > 0 ? totalRequired / totalAssets : 0;

  // 国内債券と現金に均等に上乗せ
  const half = requiredRatio / 2;

  return {
    horizonYears,
    cutoffDate: toDateString(cutoff),
    totalRequired,
    upcomingEvents,
    requiredRatio,
    allocationBoost: { cash: half, domesticBond: half },
  };
}

// -------------------------------------------------------------
// 流動性安全余裕度の評価
// -------------------------------------------------------------

/**
 * 「現在の現金＋国内債券」が今後 horizonYears 年間の必要額を
 * 満たしているかチェックし、不足時は警告と推奨アクションを返す。
 *
 * @param today - 基準日（省略時は実行日）
 */
export function evaluateLiquiditySafety(
  portfolio: PortfolioData,
  events: LifeEvent[],
  horizonYears: number = 3,
  today: Date = new Date(),
): LiquiditySafetyResult {
  const totalAssets = Object.values(portfolio).reduce((a, b) => a + b, 0);
  const req = calculateRequiredLiquidity(events, totalAssets, horizonYears, today);

  const currentLiquidity = portfolio.cash + portfolio.domesticBond;
  const requiredLiquidity = req.totalRequired;
  const shortfall = Math.max(0, requiredLiquidity - currentLiquidity);
  const coverageRatio =
    requiredLiquidity > 0 ? currentLiquidity / requiredLiquidity : Infinity;
  const isAdequate = shortfall === 0;

  let warning: string | null = null;
  let recommendation: string | null = null;

  if (!isAdequate) {
    const eventNames = req.upcomingEvents.map((e) => `「${e.title}」`).join('・');
    warning =
      `⚠️  今後 ${horizonYears} 年以内のライフイベント（${eventNames}）に対し、` +
      `現金・国内債券の合計（${currentLiquidity.toLocaleString('ja-JP')}円）が` +
      `必要額（${requiredLiquidity.toLocaleString('ja-JP')}円）を` +
      `${shortfall.toLocaleString('ja-JP')}円 下回っています。`;
    recommendation =
      `→ リスク資産（株式・REIT等）を ${shortfall.toLocaleString('ja-JP')}円 売却し、` +
      `現金または国内債券として確保してください。`;
  }

  return {
    currentLiquidity,
    requiredLiquidity,
    shortfall,
    coverageRatio,
    isAdequate,
    warning,
    recommendation,
  };
}

// -------------------------------------------------------------
// リバランス計算
// -------------------------------------------------------------

/**
 * 現在のポートフォリオと目標比率を比較し、売買差額を算出する。
 * delta > 0 → 買い増し、delta < 0 → 売却
 */
export function calculateRebalance(
  portfolio: PortfolioData,
  targetAllocation: TargetAllocation,
): RebalanceResult {
  const totalAssets = Object.values(portfolio).reduce((a, b) => a + b, 0);

  const items: RebalanceItem[] = ASSET_CATEGORIES.map((category) => {
    const currentAmount = portfolio[category];
    const currentRatio = totalAssets > 0 ? currentAmount / totalAssets : 0;
    const targetRatio = targetAllocation[category];
    const targetAmount = Math.round(totalAssets * targetRatio);
    const delta = targetAmount - currentAmount;

    return {
      category,
      label: ASSET_LABELS[category],
      currentAmount,
      currentRatio,
      targetRatio,
      targetAmount,
      delta,
    };
  });

  return { totalAssets, items };
}

// -------------------------------------------------------------
// 負債（Liabilities）
// -------------------------------------------------------------

export type MortgageType = 'variable' | 'fixed';

/** 住宅ローン等の負債 */
export interface Mortgage {
  label: string;            // ローン名（例: 「住宅ローン（変動）」）
  balance: number;          // 残高（円）
  rate: number;             // 現在の年利（例: 0.005 = 0.5%）
  type: MortgageType;       // 変動 / 固定
  remainingYears?: number;  // 残存年数（省略時は単利近似で計算）
}

/** 純資産の算出結果 */
export interface NetWorthResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liabilityToAssetRatio: number;  // 負債 / 総資産（低いほど健全）
}

/** 金利上昇シナリオ（1件） */
export interface RateRiseScenario {
  riseAmount: number;             // 上昇幅（例: 0.005 = +0.5%）
  newRate: number;                // 上昇後の金利
  annualPaymentIncrease: number;  // 年間返済増加額（円）
  monthlyPaymentIncrease: number; // 月次返済増加額（円）
}

/** 金利上昇インパクト全体 */
export interface RateRiseImpact {
  mortgage: Mortgage;
  scenarios: RateRiseScenario[];
  note: string | null;  // 固定金利の場合は「適用外」など
}

/** 繰り上げ返済アドバイス */
export interface PrepaymentAdvice {
  mortgageRate: number;          // ローン金利
  domesticBondYield: number;     // 国内債券の想定利回り
  shouldPrepay: boolean;         // 繰り上げ返済を優先すべきか
  rateDiff: number;              // mortgageRate − domesticBondYield（正なら繰り上げ有利）
  annualDiff: number;            // 残高 × rateDiff（年間の実質コスト差、円）
  message: string;               // アドバイスメッセージ
}

// -------------------------------------------------------------
// 純資産の算出
// -------------------------------------------------------------

/**
 * 金融資産の合計から負債合計を引いた純資産を算出する。
 */
export function calculateNetWorth(
  portfolio: PortfolioData,
  mortgages: Mortgage[],
): NetWorthResult {
  const totalAssets = Object.values(portfolio).reduce((a, b) => a + b, 0);
  const totalLiabilities = mortgages.reduce((sum, m) => sum + m.balance, 0);
  const netWorth = totalAssets - totalLiabilities;
  const liabilityToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;

  return { totalAssets, totalLiabilities, netWorth, liabilityToAssetRatio };
}

// -------------------------------------------------------------
// 金利上昇リスクの可視化
// -------------------------------------------------------------

/**
 * 毎月返済額をローン残高・月利・残月数から厳密に算出する（元利均等返済式）。
 * remainingYears が未指定の場合は単利近似（balance × rate）を使用する。
 */
function monthlyPayment(balance: number, annualRate: number, remainingYears: number): number {
  const r = annualRate / 12;
  const n = remainingYears * 12;
  if (r === 0) return balance / n;
  return (balance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * 金利が riseAmounts（複数シナリオ）上昇した場合の年間返済増加額を算出する。
 *
 * - 変動金利: 残高 × 上昇幅 の単利近似（remainingYears があれば厳密計算）
 * - 固定金利: 影響なし（note に記載）
 *
 * @param riseAmounts - 上昇幅の配列（例: [0.005, 0.01]）
 */
export function calculateRateRiseImpact(
  mortgage: Mortgage,
  riseAmounts: number[] = [0.005, 0.01],
): RateRiseImpact {
  if (mortgage.type === 'fixed') {
    return {
      mortgage,
      scenarios: [],
      note: '固定金利のため、金利上昇による返済額への影響はありません。',
    };
  }

  const scenarios: RateRiseScenario[] = riseAmounts.map((rise) => {
    const newRate = mortgage.rate + rise;
    let monthlyIncrease: number;

    if (mortgage.remainingYears !== undefined && mortgage.remainingYears > 0) {
      const before = monthlyPayment(mortgage.balance, mortgage.rate, mortgage.remainingYears);
      const after  = monthlyPayment(mortgage.balance, newRate,       mortgage.remainingYears);
      monthlyIncrease = after - before;
    } else {
      // 残存年数不明: 単利近似（年間追加利息 = 残高 × 上昇幅）
      monthlyIncrease = (mortgage.balance * rise) / 12;
    }

    return {
      riseAmount: rise,
      newRate,
      annualPaymentIncrease:  Math.round(monthlyIncrease * 12),
      monthlyPaymentIncrease: Math.round(monthlyIncrease),
    };
  });

  return { mortgage, scenarios, note: null };
}

// -------------------------------------------------------------
// 繰り上げ返済判断アドバイス
// -------------------------------------------------------------

/**
 * 「国内債券の想定利回り」と「ローン金利」を比較し、
 * 繰り上げ返済と債券投資のどちらが合理的かをアドバイスする。
 *
 * 判断ロジック:
 *   ローン金利 > 国内債券利回り
 *     → 繰り上げ返済が合理的（確実な利息削減 > 債券利回り）
 *   ローン金利 ≤ 国内債券利回り
 *     → 債券投資が合理的（運用益がローン利息コストを上回る）
 *
 * @param domesticBondYield - 国内債券の想定利回り（例: 0.008 = 0.8%）
 */
export function advisePrepayment(
  mortgage: Mortgage,
  domesticBondYield: number,
): PrepaymentAdvice {
  const rateDiff = mortgage.rate - domesticBondYield;
  const shouldPrepay = rateDiff > 0;
  const annualDiff = Math.round(mortgage.balance * Math.abs(rateDiff));

  let message: string;
  if (shouldPrepay) {
    message =
      `ローン金利（${(mortgage.rate * 100).toFixed(2)}%）が` +
      `国内債券の想定利回り（${(domesticBondYield * 100).toFixed(2)}%）を` +
      `${(rateDiff * 100).toFixed(2)}% 上回っています。` +
      `債券を買うよりも繰り上げ返済を優先する方が合理的です。` +
      `（年間 ${annualDiff.toLocaleString('ja-JP')}円 の実質コスト削減）`;
  } else {
    message =
      `国内債券の想定利回り（${(domesticBondYield * 100).toFixed(2)}%）が` +
      `ローン金利（${(mortgage.rate * 100).toFixed(2)}%）を` +
      `${(Math.abs(rateDiff) * 100).toFixed(2)}% 上回っています。` +
      `繰り上げ返済より債券投資を優先する方が合理的です。` +
      `（年間 ${annualDiff.toLocaleString('ja-JP')}円 の実質運用益優位）`;
  }

  return { mortgageRate: mortgage.rate, domesticBondYield, shouldPrepay, rateDiff, annualDiff, message };
}

// -------------------------------------------------------------
// 為替感応度（外貨建て資産リスク分析）
// -------------------------------------------------------------

/**
 * 外国株と外国債券を「外貨建て資産」として集計し、
 * 円高・円安への耐性（1%変動時の評価額インパクト）を算出する。
 */
export function calculateFxSensitivity(portfolio: PortfolioData): FxSensitivity {
  const totalAssets = Object.values(portfolio).reduce((a, b) => a + b, 0);
  const { foreignEquity, foreignBond } = portfolio;
  const foreignAssets = foreignEquity + foreignBond;
  const foreignAssetsRatio = totalAssets > 0 ? foreignAssets / totalAssets : 0;

  return {
    foreignAssets,
    foreignAssetsRatio,
    yenAppreciation1pct: -foreignAssets * 0.01,  // 円高は外貨建て資産の円換算額が減少
    yenDepreciation1pct: foreignAssets * 0.01,   // 円安は増加
    breakdown: { foreignEquity, foreignBond },
  };
}
