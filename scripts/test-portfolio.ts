/**
 * portfolio.ts の動作確認スクリプト
 * 実行: npx tsx scripts/test-portfolio.ts
 *
 * テスト構成:
 *   - 年齢: 48歳 / リスク許容度: 3（標準）
 *   - 総資産: 3,000万円
 *   - 現在保有: 国内債券 10%・外国債券 15% を含む構成
 *   - ライフイベント: 新居関連費用（2026年後半）・長男留学費用（2028年）
 */

import {
  calculateTargetAllocation,
  adjustForLifeEvents,
  calculateRebalance,
  calculateFxSensitivity,
  calculateRequiredLiquidity,
  evaluateLiquiditySafety,
  calculateNetWorth,
  calculateRateRiseImpact,
  advisePrepayment,
  ASSET_LABELS,
  type PortfolioData,
  type LifeEvent,
  type Mortgage,
} from '../lib/portfolio';

// ----------------------------------------------------------------
// ユーティリティ
// ----------------------------------------------------------------

const yen = (n: number) =>
  n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const section = (title: string) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(` ${title}`);
  console.log('='.repeat(60));
};

// ----------------------------------------------------------------
// テストデータ（総資産 3,000万円）
// 国内債券 10%（300万）・外国債券 15%（450万）
// ----------------------------------------------------------------

const TOTAL = 30_000_000;

const currentPortfolio: PortfolioData = {
  japanEquity:   TOTAL * 0.25,  //  750万 25%
  foreignEquity: TOTAL * 0.20,  //  600万 20%
  domesticBond:  TOTAL * 0.10,  //  300万 10%  ← 国内債券
  foreignBond:   TOTAL * 0.15,  //  450万 15%  ← 外国債券
  jReit:         TOTAL * 0.08,  //  240万  8%
  alternative:   TOTAL * 0.05,  //  150万  5%
  cash:          TOTAL * 0.17,  //  510万 17%
};

// ----------------------------------------------------------------
// 基準日（テスト再現性のため固定）
// ----------------------------------------------------------------

const TODAY = new Date('2026-03-19');

// ----------------------------------------------------------------
// ライフイベント（タイムライン形式）
// ----------------------------------------------------------------

const lifeEvents: LifeEvent[] = [
  { title: '新居関連費用',   date: '2026-09-01', amount: 5_000_000 },
  { title: '長男 豪州留学', date: '2028-04-01', amount: 3_000_000 },
];

// ================================================================
// TEST 1: 理想比率の算出（foreignBondAsRiskAsset = false / true）
// ================================================================

section('TEST 1-A: 理想比率（外国債券 = 安全資産扱い）');
const target = calculateTargetAllocation(48, 3, { foreignBondAsRiskAsset: false });
console.log('カテゴリ               目標比率');
for (const [key, ratio] of Object.entries(target)) {
  const label = ASSET_LABELS[key as keyof typeof ASSET_LABELS].padEnd(14, '　');
  console.log(`  ${label}  ${pct(ratio)}`);
}

section('TEST 1-B: 理想比率（外国債券 = リスク資産扱い）');
const targetWithFBRisk = calculateTargetAllocation(48, 3, { foreignBondAsRiskAsset: true });
console.log('カテゴリ               目標比率   差分(1-A比)');
for (const key of Object.keys(target) as Array<keyof typeof target>) {
  const label = ASSET_LABELS[key].padEnd(14, '　');
  const diff = targetWithFBRisk[key] - target[key];
  const diffStr = (diff >= 0 ? '+' : '') + pct(diff);
  console.log(`  ${label}  ${pct(targetWithFBRisk[key])}      ${diffStr}`);
}

// ================================================================
// TEST 2: ライフイベント調整
// ================================================================

section('TEST 2: ライフイベントによる安全資産確保');
const adjustment = adjustForLifeEvents(TOTAL, lifeEvents, TODAY);

console.log(`基準日:             ${TODAY.toISOString().slice(0, 10)}`);
console.log(`総資産:             ${yen(TOTAL)}`);
console.log(`確保すべき安全資産: ${yen(adjustment.reservedCash)}`);
console.log(`投資可能額:         ${yen(adjustment.investableAmount)}`);
console.log('\nイベント別内訳:');
for (const b of adjustment.breakdown) {
  const years = b.yearsUntil.toFixed(1);
  console.log(
    `  ${b.event.title.padEnd(14)}  ${b.event.date}（${years}年後）` +
    `  必要額: ${yen(b.event.amount)}` +
    `  確保率: ${pct(b.reserveRate)}` +
    `  確保額: ${yen(b.reservedAmount)}`,
  );
}
console.log('\n※ 国内債券はキャッシュ同等の安全資産として上記の待機資金に充当することを推奨');

// ================================================================
// TEST 2-B: 必要流動資産の算出（3年ホライズン）
// ================================================================

section('TEST 2-B: 今後3年間の必要流動資産と目標比率ブースト');
const liquidity = calculateRequiredLiquidity(lifeEvents, TOTAL, 3, TODAY);

console.log(`基準日:        ${TODAY.toISOString().slice(0, 10)}`);
console.log(`対象期間:      〜${liquidity.cutoffDate}（${liquidity.horizonYears}年）`);
console.log(`期間内イベント: ${liquidity.upcomingEvents.map((e) => `「${e.title}」`).join(' / ')}`);
console.log(`必要流動総額:  ${yen(liquidity.totalRequired)}（総資産の ${pct(liquidity.requiredRatio)}）`);
console.log('\n目標比率への上乗せ（allocationBoost）:');
console.log(`  現金         +${pct(liquidity.allocationBoost.cash)}`);
console.log(`  国内債券     +${pct(liquidity.allocationBoost.domesticBond)}`);
console.log('\n上乗せ後の目標比率（参考）:');
const boostedTarget = { ...target };
boostedTarget.cash += liquidity.allocationBoost.cash;
boostedTarget.domesticBond += liquidity.allocationBoost.domesticBond;
// 正規化
const boostSum = Object.values(boostedTarget).reduce((a, b) => a + b, 0);
for (const key of Object.keys(boostedTarget) as Array<keyof typeof boostedTarget>) {
  boostedTarget[key] /= boostSum;
}
for (const [key, ratio] of Object.entries(boostedTarget)) {
  const base = target[key as keyof typeof target];
  const diff = ratio - base;
  const diffStr = diff !== 0 ? ` (${diff >= 0 ? '+' : ''}${pct(diff)})` : '';
  const label = ASSET_LABELS[key as keyof typeof ASSET_LABELS].padEnd(14, '　');
  console.log(`  ${label}  ${pct(ratio)}${diffStr}`);
}

// ================================================================
// TEST 2-C: 流動性安全余裕度の評価
// ================================================================

section('TEST 2-C: 流動性安全余裕度の評価');

// ケース①: 現状ポートフォリオ（現金17%＋国内債券10% = 810万）
const safety = evaluateLiquiditySafety(currentPortfolio, lifeEvents, 3, TODAY);
console.log('【現状ポートフォリオ】');
console.log(`  現金 + 国内債券: ${yen(safety.currentLiquidity)}`);
console.log(`  3年以内の必要額: ${yen(safety.requiredLiquidity)}`);
console.log(`  充足率:          ${(safety.coverageRatio * 100).toFixed(1)}%`);
if (safety.isAdequate) {
  console.log('  ✅ 流動性は充足しています');
} else {
  console.log(`\n  ${safety.warning}`);
  console.log(`  ${safety.recommendation}`);
}

// ケース②: 現金を削減したポートフォリオ（流動性不足シナリオ）
const tightPortfolio: PortfolioData = {
  ...currentPortfolio,
  cash:        TOTAL * 0.03,  //  90万（3%に圧縮）
  japanEquity: TOTAL * 0.31,  //  930万（増加）
};
const safetytight = evaluateLiquiditySafety(tightPortfolio, lifeEvents, 3, TODAY);
console.log('\n【流動性不足シナリオ（現金3%）】');
console.log(`  現金 + 国内債券: ${yen(safetytight.currentLiquidity)}`);
console.log(`  3年以内の必要額: ${yen(safetytight.requiredLiquidity)}`);
console.log(`  充足率:          ${(safetytight.coverageRatio * 100).toFixed(1)}%`);
if (safetytight.isAdequate) {
  console.log('  ✅ 流動性は充足しています');
} else {
  console.log(`\n  ${safetytight.warning}`);
  console.log(`  ${safetytight.recommendation}`);
}

// ================================================================
// TEST 3: リバランス計算（1-A の目標比率を使用）
// ================================================================

section('TEST 3: リバランス計算（外国債券=安全資産ベース）');
const rebalance = calculateRebalance(currentPortfolio, target);

console.log(`総資産: ${yen(rebalance.totalAssets)}\n`);
console.log('カテゴリ         現在額      現在比   目標比   目標額      差額（売買）');
console.log('-'.repeat(78));
for (const item of rebalance.items) {
  const label   = item.label.padEnd(10, '　');
  const cur     = String(yen(item.currentAmount)).padStart(12);
  const curPct  = pct(item.currentRatio).padStart(6);
  const tgtPct  = pct(item.targetRatio).padStart(6);
  const tgt     = String(yen(item.targetAmount)).padStart(12);
  const delta   = item.delta >= 0
    ? `+${yen(item.delta)}`
    : yen(item.delta);
  const mark = item.delta > 10_000 ? '↑買' : item.delta < -10_000 ? '↓売' : '  -';
  console.log(`  ${label} ${cur} ${curPct}  ${tgtPct} ${tgt}  ${delta.padStart(14)} ${mark}`);
}

// ================================================================
// TEST 4: 為替感応度
// ================================================================

section('TEST 4: 為替感応度（外貨建て資産リスク）');
const fx = calculateFxSensitivity(currentPortfolio);

console.log(`外貨建て資産合計: ${yen(fx.foreignAssets)}（ポートフォリオの ${pct(fx.foreignAssetsRatio)}）`);
console.log(`  内訳 - 外国株:   ${yen(fx.breakdown.foreignEquity)}`);
console.log(`  内訳 - 外国債券: ${yen(fx.breakdown.foreignBond)}`);
console.log(`\n円高 1% 時の評価額変動: ${yen(fx.yenAppreciation1pct)}`);
console.log(`円安 1% 時の評価額変動: +${yen(fx.yenDepreciation1pct)}`);
console.log(`\n※ 外国債券（米国債）は金利変動に加え、為替変動リスク（環境要因）の評価対象`);

// ================================================================
// TEST 5: 年齢・リスク許容度の感応度確認
// ================================================================

section('TEST 5: 年齢・リスク許容度別 リスク資産比率サマリー');
const RISK_ASSETS: Array<keyof typeof target> = ['japanEquity', 'foreignEquity', 'jReit', 'alternative'];

console.log('年齢  リスク許容度  リスク資産合計  外貨建て合計');
console.log('-'.repeat(50));
for (const age of [40, 48, 55, 60]) {
  for (const rt of [2, 3, 4] as const) {
    const t = calculateTargetAllocation(age, rt);
    const riskySum = RISK_ASSETS.reduce((s, k) => s + t[k], 0);
    const fxSum = t.foreignEquity + t.foreignBond;
    console.log(
      `  ${age}歳   ${rt}          ${pct(riskySum).padStart(8)}        ${pct(fxSum).padStart(8)}`,
    );
  }
}

// ================================================================
// TEST 6: 負債管理・純資産・金利リスク・繰り上げ返済アドバイス
// ================================================================

const mortgage: Mortgage = {
  label:          '住宅ローン（変動）',
  balance:        60_000_000,  // 残高 6,000万円
  rate:           0.005,       // 現在金利 0.5%
  type:           'variable',
  remainingYears: 28,          // 残存 28年
};

// ------------------------------------------------------------------
// 6-A: 純資産
// ------------------------------------------------------------------

section('TEST 6-A: 純資産（Net Worth）');
const nw = calculateNetWorth(currentPortfolio, [mortgage]);

console.log(`金融資産合計:   ${yen(nw.totalAssets)}`);
console.log(`負債合計:       ${yen(nw.totalLiabilities)}`);
console.log(`純資産:         ${yen(nw.netWorth)}`);
console.log(`負債比率:       ${pct(nw.liabilityToAssetRatio)}`);
if (nw.netWorth < 0) {
  console.log('⚠️  純資産がマイナスです。負債の圧縮を優先してください。');
} else {
  console.log('✅ 純資産はプラスです。');
}

// ------------------------------------------------------------------
// 6-B: 金利上昇リスク（+0.5% / +1.0% シナリオ）
// ------------------------------------------------------------------

section('TEST 6-B: 金利上昇リスク');
const impact = calculateRateRiseImpact(mortgage, [0.005, 0.010]);

console.log(`対象ローン: ${impact.mortgage.label}`);
console.log(`現在残高:   ${yen(impact.mortgage.balance)}`);
console.log(`現在金利:   ${(impact.mortgage.rate * 100).toFixed(2)}%`);
console.log(`残存年数:   ${impact.mortgage.remainingYears}年\n`);

if (impact.note) {
  console.log(`  ℹ️  ${impact.note}`);
} else {
  console.log('シナリオ       上昇後金利   月次増加額    年間増加額');
  console.log('-'.repeat(54));
  for (const s of impact.scenarios) {
    const rise  = `+${(s.riseAmount * 100).toFixed(1)}%`.padEnd(10);
    const rate  = `${(s.newRate * 100).toFixed(2)}%`.padStart(8);
    const mo    = yen(s.monthlyPaymentIncrease).padStart(12);
    const yr    = yen(s.annualPaymentIncrease).padStart(12);
    console.log(`  ${rise}  ${rate}  ${mo}  ${yr}`);
  }
}

// ------------------------------------------------------------------
// 6-C: 繰り上げ返済アドバイス（複数の国内債券利回り想定）
// ------------------------------------------------------------------

section('TEST 6-C: 繰り上げ返済 vs 国内債券投資');

const bondYieldScenarios = [
  { label: '利回り 0.3%（低水準）',   yield: 0.003 },
  { label: '利回り 0.5%（ローン同等）', yield: 0.005 },
  { label: '利回り 0.8%（現在水準）',   yield: 0.008 },
  { label: '利回り 1.2%（上昇シナリオ）', yield: 0.012 },
];

for (const scenario of bondYieldScenarios) {
  const advice = advisePrepayment(mortgage, scenario.yield);
  const verdict = advice.shouldPrepay ? '→ 繰り上げ返済を優先' : '→ 債券投資を優先';
  console.log(`\n【${scenario.label}】 ${verdict}`);
  console.log(`  ${advice.message}`);
}

console.log('\n✅ 全テスト完了\n');
