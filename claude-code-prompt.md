# Claude Code Prompt: Unified Stock Analysis Streamlit Application

## Mission

Build a **single Streamlit multi-page application** that integrates 4 stock analysis tools into one cohesive app. The app targets both Japanese (JP) and US stock markets, uses `yfinance` for all data fetching, and provides a unified user experience with shared utilities and consistent UI/UX.

**Language policy**: Code in English, UI labels/comments in Japanese (bilingual where appropriate).

---

## Project Structure

```
stock-analyzer/
├── app.py                          # Main entry point with page navigation
├── requirements.txt
├── README.md
├── utils/
│   ├── __init__.py
│   ├── data_fetcher.py             # Shared yfinance data fetching + caching layer
│   ├── constants.py                # Shared ticker lists, sector PE maps, constants
│   └── ui_helpers.py               # Shared UI components, formatting helpers
├── pages/
│   ├── 1_🎯_dividend_screener.py   # 日本株 高配当スクリーナー
│   ├── 2_📐_buffett_screener.py    # 三角測量 割安銘柄スクリーナー
│   ├── 3_🏹_bottom_screener.py     # シグナル・ハンター (底値スクリーナー)
│   └── 4_⚖️_portfolio_dashboard.py # ポートフォリオ診断
└── screener.py                     # Dividend screener business logic (filter engine)
```

---

## Step 1: Create `utils/data_fetcher.py` — Shared Data Layer

This is the **most critical** shared module. All 4 apps depend on it.

### Requirements

```python
"""
utils/data_fetcher.py
Unified yfinance data fetcher with Streamlit caching.

Key design:
- @st.cache_data(ttl=3600) for raw yfinance calls (1-hour cache)
- Separate wrapper to detect cache hits via session_state
- Returns a standardized dict with all fields needed by all 4 apps
- Handles both JP (.T suffix) and US tickers
- Graceful error handling (never crash, return None on failure)
"""
```

### Data fields to fetch and return (as a dict):

```python
{
    # === Basic Info ===
    "symbol": str,              # e.g. "8058.T" or "AAPL"
    "name": str,                # shortName or longName
    "sector": str,              # sector classification
    "market": str,              # "JP" or "US" (inferred from .T suffix)
    "currency": str,            # "JPY" or "USD"

    # === Price Data ===
    "price": float,             # currentPrice or regularMarketPrice
    "price_history_1y": pd.DataFrame,  # 1-year daily OHLCV (for technicals)
    "price_history_5y": pd.DataFrame,  # 5-year monthly (for long-term analysis)
    "fifty_two_week_high": float,
    "fifty_two_week_low": float,

    # === Fundamental (for Buffett Screener) ===
    "trailingPE": float,        # trailing P/E ratio
    "forwardPE": float,         # forward P/E ratio
    "trailingEps": float,       # trailing EPS
    "forwardEps": float,        # forward EPS
    "bookValue": float,         # book value per share
    "priceToBook": float,       # P/B ratio
    "freeCashflow": float,      # free cash flow (total)
    "sharesOutstanding": float,  # shares outstanding
    "fcfPerShare": float,       # calculated: freeCashflow / sharesOutstanding
    "revenueGrowth": float,     # YoY revenue growth rate
    "earningsGrowth": float,    # YoY earnings growth rate

    # === Dividend Data (for Dividend Screener) ===
    "dividendYield": float,     # trailing dividend yield
    "dividendRate": float,      # annual dividend per share
    "payoutRatio": float,       # payout ratio
    "dividend_history": pd.Series,  # annual dividends (year -> amount), 10+ years

    # === Financial Health (for Dividend Screener) ===
    "equityRatio": float,       # totalStockholderEquity / totalAssets (自己資本比率)
    "operatingMargin": float,   # operating margin
    "roe": float,               # return on equity
    "operatingCashflow_3y": list[float],  # last 3 years operating CF
    "cashAndEquivalents_3y": list[float], # last 3 years cash positions

    # === Technical (for Bottom Screener) ===
    "rsi14": float,             # 14-day RSI (calculated from price_history_1y)
    "ma25": float,              # 25-day moving average
    "ma25DeviationPct": float,  # (price - ma25) / ma25 * 100
    "ma75": float,              # 75-day moving average
    "ma200": float,             # 200-day moving average

    # === News (for Bottom Screener) ===
    "news": list[dict],         # yfinance news items [{title, link, publisher}]
}
```

### Implementation notes

- Use `yf.Ticker(symbol)` as the base
- `.info` for fundamentals, `.history()` for prices, `.dividends` for dividend history
- `.get_news()` for news items
- Calculate RSI manually: `delta = close.diff()`, `gain = delta.clip(lower=0).rolling(14).mean()`, etc.
- Calculate equity ratio from `.balance_sheet`: `totalStockholderEquity / totalAssets`
- For `dividend_history`, aggregate `.dividends` by year (sum quarterly/semi-annual)
- For `operatingCashflow_3y`, use `.cashflow` DataFrame
- Wrap everything in try/except — return None for any field that fails
- Use `@st.cache_data(ttl=3600)` on the raw fetch function
- Provide `fetch_with_cache_flag(symbol)` wrapper that returns `(data, is_cache_hit)` using `st.session_state`

---

## Step 2: Create `utils/constants.py` — Shared Constants

```python
"""
Shared ticker lists and sector reference data for all screeners.
"""

# Sector P/E benchmarks (used by Buffett Screener)
SECTOR_PE_US = {
    "Technology": 27, "Communication Services": 18, "Industrials": 20,
    "Consumer Discretionary": 25, "Consumer Staples": 22, "Healthcare": 20,
    "Financials": 14, "Energy": 12, "Materials": 16, "Utilities": 17,
    "Real Estate": 35,
}

SECTOR_PE_JP = {
    "情報通信": 22, "電気機器": 18, "輸送用機器": 12, "医薬品": 25,
    "銀行業": 10, "小売業": 20, "食料品": 18, "化学": 15,
    "機械": 16, "サービス業": 20, "不動産業": 15, "建設業": 12,
    "精密機器": 20, "その他製品": 15,
}

# Default JP dividend stocks (used by Dividend Screener)
DEFAULT_DIVIDEND_TICKERS = [
    "8058.T",  # 三菱商事
    "8316.T",  # 三井住友FG
    "9433.T",  # KDDI
    "8766.T",  # 東京海上
    "2914.T",  # JT
    "9432.T",  # NTT
    "8031.T",  # 三井物産
    "4502.T",  # 武田薬品
    "8001.T",  # 伊藤忠
    "5020.T",  # ENEOS
    # ... add 20-30 more JP high-dividend candidates
]

# Buffett screener stock lists
US_STOCKS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "sector": "Technology"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "sector": "Technology"},
    {"symbol": "META", "name": "Meta Platforms", "sector": "Technology"},
    {"symbol": "BRK-B", "name": "Berkshire Hathaway", "sector": "Financials"},
    {"symbol": "JPM", "name": "JPMorgan Chase", "sector": "Financials"},
    {"symbol": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare"},
    {"symbol": "V", "name": "Visa Inc.", "sector": "Financials"},
    # ... add 40+ more US stocks
]

JP_STOCKS = [
    {"symbol": "7203.T", "name": "トヨタ自動車", "sector": "輸送用機器"},
    {"symbol": "6758.T", "name": "ソニーG", "sector": "電気機器"},
    {"symbol": "8306.T", "name": "三菱UFJFG", "sector": "銀行業"},
    {"symbol": "6861.T", "name": "キーエンス", "sector": "電気機器"},
    {"symbol": "9984.T", "name": "ソフトバンクG", "sector": "情報通信"},
    # ... add 30+ more JP stocks
]

# Bottom screener watch list
WATCH_LIST_JP = ["7203.T", "6758.T", "8306.T", "9984.T", "6861.T",
                  "8058.T", "9433.T", "4502.T", "6501.T", "7267.T"]
WATCH_LIST_US = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
                  "META", "TSLA", "JPM", "V", "JNJ"]

# Filter stage names (Dividend Screener)
FILTER_STAGES = [
    "基本情報", "自己資本比率", "営業CF",
    "配当利回り", "配当性向", "減配チェック",
    "営業利益率", "ROE",
]
```

---

## Step 3: Create `utils/ui_helpers.py` — Shared UI Components

```python
"""
Shared formatting and UI helper functions.
"""

def format_pct(val, decimals=2):
    """Format a float as percentage string, or '—' if None/NaN."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return "—"
    return f"{val:.{decimals}%}"

def format_currency(val, currency="JPY"):
    """Format price with currency symbol."""
    if val is None:
        return "—"
    sym = "¥" if currency == "JPY" else "$"
    if currency == "JPY":
        return f"{sym}{val:,.0f}"
    return f"{sym}{val:,.2f}"

def signal_badge(label, color):
    """Return an HTML badge for status indicators."""
    return f'<span style="background:{color};color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8rem;">{label}</span>'

def score_color(score, max_score=2):
    """Map a score (-2 to +2) to a color."""
    if score >= max_score: return "#22c55e"
    if score >= 1: return "#86efac"
    if score >= 0: return "#fbbf24"
    if score >= -1: return "#fb923c"
    return "#ef4444"
```

---

## Step 4: Create `screener.py` — Dividend Screener Engine

```python
"""
screener.py
3-layer filter engine for the Dividend Screener.

Design principle: PURE FUNCTION — no yfinance calls here.
Takes pre-fetched raw data dict and ScreenerConfig, returns result dict.
This allows threshold changes without re-fetching data.

Layers:
  Layer 1 (財務の鉄壁): equity_ratio >= 40%, operating CF positive 3 years
  Layer 2 (配当の誠実さ): yield in range, payout in range, no dividend cuts
  Layer 3 (稼ぐ力): operating_margin >= 10%, ROE >= 8%
"""

from dataclasses import dataclass

@dataclass
class ScreenerConfig:
    equity_ratio_min: float = 0.40
    dividend_yield_min: float = 0.0375
    dividend_yield_max: float = 0.05
    payout_ratio_min: float = 0.30
    payout_ratio_max: float = 0.70
    operating_margin_min: float = 0.10
    roe_min: float = 0.08
    dividend_history_years: int = 10

def fetch_raw_data(symbol: str) -> dict | None:
    """Wrapper that calls data_fetcher and returns raw dict."""
    from utils.data_fetcher import _cached_fetch
    raw, _ = _cached_fetch(symbol)
    return raw

def screen_from_raw(symbol: str, raw: dict, cfg: ScreenerConfig) -> dict:
    """
    Run 3-layer screening on pre-fetched data.
    Returns dict with keys: ticker, name, sector, status, stage, reason,
    plus all metric values (dividend_yield, roe, etc.) if passed.

    status: "passed" | "failed" | "skipped"
    stage: which filter eliminated it (e.g. "自己資本比率")
    reason: human-readable explanation
    """
    # Implement each filter stage in order.
    # If a stage fails, return immediately with status="failed"
    # and the stage name + reason.
    # If all pass, return status="passed" with all metrics.
    # Financial sector stocks (銀行業, 保険, etc.) skip equity_ratio check.
    pass  # ← IMPLEMENT THIS
```

---

## Step 5: Create Page 1 — `pages/1_🎯_dividend_screener.py`

### Specs (from existing app.py)

- **Sidebar**: Ticker input (text_area, one per line), 3 layer threshold sliders, cache management
- **Main area**: Hero header with 3-layer explanation cards
- **Execution**: Progress bar + real-time log showing cache hits (💾) vs fresh fetches (🌐)
- **Results tabs**:
  - 🏆 合格銘柄: DataFrame + annual dividend history expander + CSV download
  - 📉 フィルター分析: Plotly funnel chart + elimination breakdown table
  - 📊 チャート: Scatter (yield vs ROE) + grouped bar (metrics comparison)
  - 📋 全銘柄ログ: Full results with status filter

### Key behavior

- Uses 2-layer cache: `_cached_fetch()` caches yfinance data for 1 hour; `screen_from_raw()` is a pure function that re-runs instantly when thresholds change
- Session state tracks results between reruns

---

## Step 6: Create Page 2 — `pages/2_📐_buffett_screener.py`

### Specs (Triangulation Value Screener)

- **Sidebar**: Market toggle (JP/US), execution button
- **3 valuation models**:
  1. **P/E Analysis**: Compare trailing P/E to sector average P/E
  2. **DCF (Intrinsic Value)**: `pv = Σ(eps*(1+g)^y / (1+r)^y) + terminal_value`
     - discount_rate = 0.09, terminal_growth = 0.03, years = 10
  3. **GDM (Graham's Defensive Model)**: `EPS × (8.5 + 2g) × 4.4/Y`
     - Also calculate CAGR: `((future_price + total_divs) / price)^(1/10) - 1`
     - hurdle_rate = 0.10

- **Scoring**: Each model returns score -2 to +2. Composite = sum of 3 scores (max 6).
- **Display**:
  - Sortable DataFrame with color-coded scores
  - Top-1 explanation panel (toggle ON/OFF) showing what each metric means
  - Card view option (toggle between table/card)
- **Growth rate capping**: Cap growth at sector-specific maximums to avoid over-optimistic DCF

---

## Step 7: Create Page 3 — `pages/3_🏹_bottom_screener.py`

### Specs (Signal Hunter — Bottom Screener)

- **Sidebar**: Market selection (JP/US/Both), custom RSI/MA thresholds
- **Buy signal logic**: `RSI(14) < 35 AND 25-day MA deviation < -3%`
- **News analysis**: Pattern matching on news titles to infer drop reason
  - Patterns: earnings miss, rate hike fears, trade war, recession, sector rotation, etc.
  - Use `re.search()` with Japanese + English keywords
- **Display**:
  - Table with columns: ticker, name, price, RSI(14), 25日乖離(%), 52W High/Low, signal, drop reason
  - Highlight buy-signal rows in green
  - Mini sparkline chart for each stock (optional, use Plotly)
- **Additional analysis**:
  - Show how far price is from 52-week low (proximity %)
  - Volume spike detection (today's volume vs 20-day average)

---

## Step 8: Create Page 4 — `pages/4_⚖️_portfolio_dashboard.py`

### Specs (Portfolio Diagnosis & Net Worth Analysis)

- **Sidebar inputs**: Age, risk tolerance (1-5 slider), foreign bond treatment toggle
- **Section 1: Target Asset Allocation**
  - Calculate ideal allocation based on age + risk tolerance:
    - `risky_ratio = clip(((120 - age) / 100) * multiplier, 0, 0.95)`
    - Split into: 日本株 (30%), 外国株 (55%), J-REIT (15%) of equity portion
    - Plus: 外国債券, オルタナティブ, 国内債券, 現金
  - Plotly donut chart
- **Section 2: Mortgage / Interest Rate Risk**
  - Inputs: loan balance, current rate, remaining years, bond yield assumption
  - Calculate monthly payment: `(P * r * (1+r)^n) / ((1+r)^n - 1)`
  - Compare loan rate vs bond yield → advise prepayment vs investment
  - Show rate-hike impact simulation (what if rate goes to 1%, 1.5%, 2%?)
- **Section 3: Life Event Reservations**
  - Input table for planned expenses (education, travel, etc.)
  - 3-year rule: events within 3 years → 100% cash allocation
  - Visualize timeline with Plotly

---

## Step 9: Create `app.py` — Main Entry Point

```python
"""
app.py — Main entry point for the unified stock analysis app.

Uses Streamlit's native multi-page support via the pages/ directory.
This file serves as the landing page / home screen.
"""

import streamlit as st

st.set_page_config(
    page_title="Stock Analyzer Suite",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("📊 Stock Analyzer Suite")
st.markdown("### 株式分析統合ツール")
st.divider()

# Show 4 app cards with descriptions
col1, col2 = st.columns(2)
with col1:
    st.markdown("""
    #### 🎯 高配当スクリーナー
    3層フィルターで選ぶ「鉄壁高配当株」
    - 財務の守り × 配当の誠実さ × 稼ぐ力
    """)
    st.markdown("""
    #### 🏹 シグナル・ハンター
    テクニカル過熱感 × ニュース解析による押し目買い判定
    - RSI + MA乖離 + ニュース自動分類
    """)
with col2:
    st.markdown("""
    #### 📐 三角測量スクリーナー
    バフェット流 P/E・DCF・GDM トライアンギュレーション
    - 3手法の多角分析で割安銘柄を発見
    """)
    st.markdown("""
    #### ⚖️ ポートフォリオ診断
    年齢・リスク許容度に基づく資産配分最適化
    - 住宅ローンリスク分析 + ライフイベント計画
    """)

st.divider()
st.caption("👈 サイドバーからツールを選択してください")
st.caption("データ出典: Yahoo Finance (yfinance) | 投資助言ではありません")
```

---

## Step 10: Create `requirements.txt`

```
streamlit>=1.30.0
yfinance>=0.2.36
pandas>=2.0.0
numpy>=1.24.0
plotly>=5.18.0
```

---

## UI/UX Guidelines

1. **Dark theme compatible**: Use Streamlit's native theming. Avoid hardcoded colors in data elements.
2. **Consistent styling**: All pages use the same hero header pattern, sidebar structure, and metric card style.
3. **Japanese-first UI**: All labels, descriptions, and explanations in Japanese. Code comments bilingual.
4. **Progress feedback**: Show progress bars during batch processing. Show cache hit/miss status.
5. **Error resilience**: Never crash on a single stock failure. Show warnings and continue.
6. **Responsive layout**: Use `st.columns()` for side-by-side metrics. `use_container_width=True` for all charts.

---

## Implementation Order

Execute in this exact order:

1. `utils/constants.py` (no dependencies)
2. `utils/ui_helpers.py` (no dependencies)
3. `utils/data_fetcher.py` (core shared module — test with 2-3 tickers)
4. `screener.py` (depends on data_fetcher)
5. `app.py` (landing page)
6. `pages/1_🎯_dividend_screener.py` (most complex — implement first as reference)
7. `pages/2_📐_buffett_screener.py`
8. `pages/3_🏹_bottom_screener.py`
9. `pages/4_⚖️_portfolio_dashboard.py`
10. `requirements.txt` + `README.md`

---

## Testing Checklist

After building, verify:

- [ ] `streamlit run app.py` launches without errors
- [ ] All 4 pages are accessible from sidebar navigation
- [ ] Dividend screener: Run with 5 default tickers, verify funnel chart renders
- [ ] Buffett screener: Toggle JP/US, verify scoring produces sorted table
- [ ] Bottom screener: Scan watch list, verify RSI/MA calculations are reasonable
- [ ] Portfolio dashboard: Change age/risk, verify allocation pie chart updates
- [ ] Cache works: Run screener twice — second run should show 💾 cache hits
- [ ] No crashes on missing data (test with an invalid ticker like "XXXXX.T")
