export default function CTA() {
  return (
    <section id="cta" className="py-24 px-6 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          AIと開発する未来を、
          <br />
          今日から始めよう
        </h2>
        <p className="text-gray-500 text-lg mb-10">
          次回コホートの募集は先着順です。興味のある方はお早めにどうぞ。
        </p>
        <div className="bg-white rounded-2xl p-8 border border-orange-100 shadow-xl shadow-orange-50 mb-8">
          <div className="text-sm text-gray-400 mb-1">受講料</div>
          <div className="text-5xl font-bold text-gray-900 mb-1">
            ¥49,800<span className="text-lg font-normal text-gray-400">（税込）</span>
          </div>
          <div className="text-sm text-orange-500 font-medium mb-6">早期申込特典: 7日間返金保証付き</div>
          <ul className="text-sm text-gray-600 space-y-2 text-left mb-8">
            {[
              "4週間のカリキュラム（全20コンテンツ）",
              "受講生専用Slackコミュニティ（3ヶ月）",
              "週1回グループQ&Aセッション",
              "最終成果物のフィードバック",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-orange-400">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="mailto:hello@example.com?subject=Claude Code講座 申し込み"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl text-center text-lg transition-colors shadow-lg shadow-orange-200"
          >
            申し込みフォームへ →
          </a>
        </div>
        <p className="text-xs text-gray-400">
          ご不明な点はお気軽に
          <a href="mailto:hello@example.com" className="underline hover:text-gray-600">
            メール
          </a>
          でお問い合わせください。
        </p>
      </div>
    </section>
  );
}
