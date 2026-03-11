const plans = [
  {
    name: "スターター",
    price: "29,800",
    period: "買い切り",
    description: "自分のペースで学びたい方に",
    highlight: false,
    features: [
      "Week 1-2 の全動画コンテンツ",
      "演習プロジェクト (2個)",
      "テキスト教材・チートシート",
      "コミュニティSlackへのアクセス",
      "30日間の質問サポート",
    ],
    notIncluded: [
      "Week 3-4 (エージェント・MCP)",
      "メンタリングセッション",
      "修了証明書",
    ],
    cta: "スタータープランで始める",
  },
  {
    name: "コンプリート",
    price: "59,800",
    period: "買い切り",
    description: "Claude Code を完全マスターしたい方に",
    highlight: true,
    badge: "最も人気",
    features: [
      "全4週間の動画コンテンツ (20+本)",
      "演習プロジェクト (6個)",
      "テキスト教材・チートシート・テンプレート集",
      "コミュニティSlackへのアクセス",
      "90日間の質問サポート",
      "月1回のグループメンタリング (3ヶ月)",
      "修了証明書の発行",
      "コンテンツの永続アクセス・アップデート",
    ],
    notIncluded: [],
    cta: "今すぐ申し込む（最も人気）",
  },
  {
    name: "チーム・法人",
    price: "お問い合わせ",
    period: "",
    description: "組織単位での導入を検討している方に",
    highlight: false,
    features: [
      "コンプリートプランの全内容",
      "チーム専用Slackチャンネル",
      "カスタマイズ可能なカリキュラム",
      "社内導入コンサルティング",
      "進捗管理ダッシュボード",
      "個別メンタリング",
      "請求書払い対応",
    ],
    notIncluded: [],
    cta: "お問い合わせはこちら",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium uppercase tracking-wider mb-4">
            料金プラン
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            シンプルな
            <span className="gradient-text">料金体系</span>
          </h2>
          <p className="text-gray-400 text-lg">
            月額制なし・隠れたコストなし。一度の投資で永続的なスキルを手に入れましょう
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-transparent relative"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-semibold text-lg mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  {plan.period ? (
                    <>
                      <span className="text-gray-400 text-sm">¥</span>
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-500 text-sm">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-violet-400 mt-0.5 flex-shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 flex-shrink-0">✕</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`block text-center py-3 px-6 rounded-xl font-medium text-sm transition-all ${
                  plan.highlight
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25"
                    : "border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 max-w-2xl mx-auto">
          <div className="text-3xl mb-2">🛡️</div>
          <h3 className="text-white font-semibold mb-2">30日間 全額返金保証</h3>
          <p className="text-gray-400 text-sm">
            受講開始から30日以内であれば、理由を問わず全額返金します。安心してお試しください。
          </p>
        </div>
      </div>
    </section>
  );
}
