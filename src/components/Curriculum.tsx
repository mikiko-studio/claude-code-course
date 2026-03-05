const weeks = [
  {
    week: "Week 1",
    title: "セットアップ & 基本操作",
    days: [
      "Day 1: 環境構築・Claude Code インストール・初回起動",
      "Day 2: 基本コマンドとファイル操作",
      "Day 3: Git / GitHub との連携",
      "Day 4: プロンプトの書き方・指示の出し方",
      "Day 5: 課題レビュー・振り返り",
    ],
  },
  {
    week: "Week 2",
    title: "Webアプリ開発入門",
    days: [
      "Day 1: Next.js App Router の基礎",
      "Day 2: コンポーネント設計とTailwind CSS",
      "Day 3: APIルートとデータフェッチ",
      "Day 4: フォーム・バリデーション実装",
      "Day 5: 小規模アプリの完成・デプロイ",
    ],
  },
  {
    week: "Week 3",
    title: "実践的な開発ワークフロー",
    days: [
      "Day 1: デバッグをAIと一緒に解決する",
      "Day 2: テスト駆動開発とClaude Code",
      "Day 3: コードレビュー・リファクタリング",
      "Day 4: 外部API連携（認証・決済など）",
      "Day 5: チーム開発を想定したブランチ管理",
    ],
  },
  {
    week: "Week 4",
    title: "自分のプロダクトを作る",
    days: [
      "Day 1: プロダクト設計・要件定義",
      "Day 2-3: 実装スプリント（集中開発）",
      "Day 4: 仕上げ・デプロイ・ドメイン設定",
      "Day 5: 成果発表・次のステップ",
    ],
  },
];

export default function Curriculum() {
  return (
    <section id="curriculum" className="py-24 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">4週間のカリキュラム</h2>
          <p className="text-gray-500 text-lg">毎日30〜60分の学習で、確実にスキルが積み上がる構成</p>
        </div>
        <div className="space-y-6">
          {weeks.map((item, index) => (
            <div key={item.week} className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-14 h-14 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-sm text-center leading-tight">
                  W{index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-orange-500 font-medium mb-1">{item.week}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <ul className="space-y-2">
                    {item.days.map((day) => (
                      <li key={day} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-orange-400 mt-0.5">✓</span>
                        {day}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
