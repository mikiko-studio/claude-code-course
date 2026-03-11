const testimonials = [
  {
    name: "田中 雄一",
    role: "フロントエンドエンジニア",
    company: "スタートアップA社",
    avatar: "田",
    color: "bg-violet-500",
    comment:
      "Claude Code を使ってからコーディング速度が劇的に上がりました。特にバグ修正の時間が半分以下に。この講座で体系的に学べたのが大きかったです。",
    rating: 5,
  },
  {
    name: "佐藤 美咲",
    role: "個人開発者",
    company: "フリーランス",
    avatar: "佐",
    color: "bg-indigo-500",
    comment:
      "一人でMVPを2週間で作り上げることができました。以前は3ヶ月かかっていた作業量。MCP連携の講座内容が特に実践的で助かりました。",
    rating: 5,
  },
  {
    name: "鈴木 健太",
    role: "テックリード",
    company: "Web系企業B社",
    avatar: "鈴",
    color: "bg-cyan-500",
    comment:
      "チームに展開する前に自分が完全に理解できていたので、スムーズに導入できました。CLAUDE.mdの設計方法が特に参考になりました。",
    rating: 5,
  },
  {
    name: "山本 綾",
    role: "バックエンドエンジニア",
    company: "IT企業C社",
    avatar: "山",
    color: "bg-emerald-500",
    comment:
      "プログラミングを学びながらAIツールも同時に習得できる内容で非常に効率的でした。エージェント自動化の章は目から鱗でした。",
    rating: 5,
  },
  {
    name: "中村 大輔",
    role: "プロダクトマネージャー",
    company: "スタートアップD社",
    avatar: "中",
    color: "bg-pink-500",
    comment:
      "非エンジニアの私でも Claude Code の可能性を理解できました。エンジニアとの会話が変わり、プロダクト開発の議論の質が上がりました。",
    rating: 5,
  },
  {
    name: "加藤 翔",
    role: "フルスタック開発者",
    company: "フリーランス",
    avatar: "加",
    color: "bg-orange-500",
    comment:
      "受講してから受注できる案件の幅が広がりました。AIと組み合わせることで、以前では対応できなかった規模のプロジェクトも引き受けられています。",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#0d0d14]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-4">
            受講生の声
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            受講生からの
            <span className="gradient-text">リアルな声</span>
          </h2>
          <p className="text-gray-400 text-lg">
            すでに多くの方が Claude Code で開発スタイルを変革しています
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="card-hover p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
                &ldquo;{t.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{t.name}</div>
                  <div className="text-gray-500 text-xs">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
