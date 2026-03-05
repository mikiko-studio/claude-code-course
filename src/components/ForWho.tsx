const targets = [
  {
    icon: "👩‍💼",
    title: "プログラミング未経験のビジネスパーソン",
    description: "コードを書いたことがなくても大丈夫。AIが補助してくれるので、アイデアをすぐ形にできます。",
    fit: true,
  },
  {
    icon: "🎨",
    title: "デザイナー・クリエイター",
    description: "デザインをコードに落とし込む工程をAIと一緒に。エンジニアへの依頼なしに自分で実装できます。",
    fit: true,
  },
  {
    icon: "🌱",
    title: "プログラミング学習中の方",
    description: "独学で詰まっていた方に最適。AIと対話しながら概念が理解でき、学習スピードが上がります。",
    fit: true,
  },
  {
    icon: "💻",
    title: "現役エンジニア",
    description: "日常の開発ワークフローにClaude Codeを組み込むことで、生産性を大幅に向上させられます。",
    fit: true,
  },
];

const notFit = [
  "完全に自動でアプリを作りたい方（手を動かす必要があります）",
  "受講後すぐに就職・転職を目指している方（就職支援は含まれません）",
];

export default function ForWho() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">こんな方におすすめ</h2>
          <p className="text-gray-500 text-lg">バックグラウンドを問わず、AIと開発する感覚を掴みたい方へ</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {targets.map((target) => (
            <div
              key={target.title}
              className="flex gap-4 p-6 rounded-2xl bg-orange-50 border border-orange-100"
            >
              <div className="text-3xl flex-shrink-0">{target.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{target.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{target.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="font-semibold text-gray-700 mb-4">⚠️ このような方には向いていないかもしれません</h3>
          <ul className="space-y-2">
            {notFit.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                <span className="mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
