const features = [
  {
    icon: "⚡",
    title: "AIペアプログラミング",
    description:
      "Claude Code をペアプログラマーとして活用する方法を徹底解説。自然言語でコードを書かせ、レビューし、改善する実践スキルを習得します。",
  },
  {
    icon: "🔧",
    title: "CLI 完全マスター",
    description:
      "コマンドラインからの操作、カスタムコマンド、スラッシュコマンドの活用法まで。ターミナルベースの高速ワークフローを身に付けます。",
  },
  {
    icon: "📁",
    title: "大規模コードベース対応",
    description:
      "数万行のプロジェクトでも Claude Code を使いこなすテクニック。CLAUDE.md の設計やコンテキスト管理の戦略を学びます。",
  },
  {
    icon: "🤖",
    title: "エージェント自動化",
    description:
      "マルチステップタスクを自動実行するエージェントの構築。テスト・ビルド・デプロイまでを自律的に処理するパイプラインを作ります。",
  },
  {
    icon: "🔌",
    title: "MCP 連携",
    description:
      "Model Context Protocol を使って Claude Code を外部ツールと連携。データベース、API、ブラウザを統合した強力な開発環境を実現します。",
  },
  {
    icon: "🛡️",
    title: "セキュア & 実務品質",
    description:
      "セキュリティのベストプラクティス、コードレビューへの活用、チーム開発での Claude Code 導入まで、実務で使えるスキルを習得します。",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium uppercase tracking-wider mb-4">
            学習内容
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            この講座で身に付く
            <span className="gradient-text">6つのスキル</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Claude Code の基礎から応用まで、実際の開発現場で即戦力になれるスキルセットを体系的に学びます
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-hover p-6 rounded-2xl border border-white/5 bg-white/[0.02] group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl mb-4 group-hover:bg-violet-500/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
