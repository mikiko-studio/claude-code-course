export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient pt-16 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          2025年最新 AI 開発ツール完全マスター講座
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
          <span className="gradient-text">Claude Code</span>
          <br />
          <span className="text-white">を完全に使いこなす</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto mb-4 leading-relaxed">
          AIエージェントとペアプログラミングして、<br className="hidden sm:block" />
          あなたの開発速度を
          <span className="text-white font-semibold"> 10倍</span>
          にする実践的な講座
        </p>
        <p className="text-base text-gray-500 max-w-2xl mx-auto mb-12">
          コード生成からデバッグ、リファクタリング、テスト作成まで —
          Claude Code の全機能をハンズオンで習得します
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="#pricing"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
          >
            無料体験レッスンを受ける →
          </a>
          <a
            href="#curriculum"
            className="px-8 py-4 rounded-xl border border-white/10 text-gray-300 font-semibold text-lg hover:bg-white/5 hover:text-white transition-all"
          >
            カリキュラムを見る
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/5">
          {[
            { number: "4週間", label: "集中カリキュラム" },
            { number: "20+", label: "ハンズオン演習" },
            { number: "98%", label: "受講生満足度" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
