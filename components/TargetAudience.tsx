const audiences = [
  {
    emoji: "👨‍💻",
    title: "エンジニア・開発者",
    description: "日々の開発作業を効率化したい方。コーディング速度と品質を同時に向上させたい方。",
    tags: ["フロントエンド", "バックエンド", "フルスタック"],
  },
  {
    emoji: "🚀",
    title: "スタートアップ創業者・個人開発者",
    description: "少ない人数でプロダクトを作り上げたい方。AIの力で小さなチームを大きな組織並みにしたい方。",
    tags: ["MVP開発", "プロダクト開発", "スモールチーム"],
  },
  {
    emoji: "📚",
    title: "プログラミング学習者",
    description: "コーディングを学びながらAIツールも習得したい方。現代の開発スタイルをゼロから学びたい方。",
    tags: ["初〜中級者", "学習効率化", "キャリアチェンジ"],
  },
  {
    emoji: "🏢",
    title: "テックリード・エンジニアマネージャー",
    description: "チームにClaude Codeを導入・展開したい方。開発生産性を組織単位で改善したい方。",
    tags: ["チーム導入", "生産性向上", "技術戦略"],
  },
];

const notFor = [
  "プログラミングに全く興味がない方",
  "即座に収益を求めている方",
  "英語での学習のみを希望する方",
];

export default function TargetAudience() {
  return (
    <section className="py-24 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium uppercase tracking-wider mb-4">
            対象受講生
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            こんな方に
            <span className="gradient-text">ぴったりです</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Claude Code は誰でも使えますが、この講座は特に以下のような方に設計されています
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="card-hover p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex gap-4"
            >
              <div className="text-4xl flex-shrink-0">{audience.emoji}</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{audience.title}</h3>
                <p className="text-gray-400 text-sm mb-3 leading-relaxed">{audience.description}</p>
                <div className="flex flex-wrap gap-2">
                  {audience.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Not for */}
        <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-red-500/10 bg-red-500/5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-red-400">✕</span>
            こんな方には向いていない可能性があります
          </h3>
          <ul className="space-y-2">
            {notFor.map((item) => (
              <li key={item} className="text-gray-500 text-sm flex items-center gap-2">
                <span className="text-red-500/60">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
