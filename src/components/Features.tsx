const features = [
  {
    icon: "⚡",
    title: "即実践できるスキル",
    description:
      "座学ではなく、初日から Claude Code を使って実際にコードを書きます。課題をこなしながら自然にワークフローが身につきます。",
  },
  {
    icon: "🧠",
    title: "AIとの対話術を習得",
    description:
      "ただ使うのではなく、AIに適切な指示を出すプロンプト設計の考え方を学びます。この思考法はどのAIツールにも応用できます。",
  },
  {
    icon: "🏗️",
    title: "実際のプロダクトを完成させる",
    description:
      "最終週には自分のアイデアをプロダクトとして形にします。ポートフォリオにも使えるアウトプットが残ります。",
  },
  {
    icon: "💬",
    title: "少人数でのサポート体制",
    description:
      "少人数グループ制なので、詰まったときにすぐ質問できます。Slackでの非同期サポートも提供します。",
  },
  {
    icon: "🔄",
    title: "Git・GitHubも同時に習得",
    description:
      "Claude Codeの操作と並行して、実務で使うGit管理のフローも自然に身につきます。",
  },
  {
    icon: "🌐",
    title: "デプロイまで一気通貫",
    description:
      "コードを書くだけでなく、Vercelへのデプロイまでカバー。公開できるプロダクトを作る体験ができます。",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">この講座でできること</h2>
          <p className="text-gray-500 text-lg">AI駆動開発の実践スキルをゼロから習得</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
