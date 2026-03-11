export default function CTABanner() {
  return (
    <section className="py-24 bg-[#0a0a0f] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-12 rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            今すぐ始めて、
            <br />
            <span className="gradient-text">開発の未来</span>を手に入れよう
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Claude Code をマスターした開発者と、まだ知らない開発者の間には、
            これからどんどん差が開いていきます。今が始め時です。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#pricing"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:scale-105"
            >
              無料体験レッスンを受ける →
            </a>
            <a
              href="#pricing"
              className="px-8 py-4 rounded-xl border border-white/10 text-gray-300 font-semibold text-lg hover:bg-white/5 hover:text-white transition-all"
            >
              料金プランを見る
            </a>
          </div>

          <p className="text-gray-600 text-sm mt-6">
            30日間全額返金保証 · 即時アクセス · サポート付き
          </p>
        </div>
      </div>
    </section>
  );
}
