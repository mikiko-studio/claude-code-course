"use client";

import { useState } from "react";

const weeks = [
  {
    week: "Week 1",
    title: "Claude Code 基礎とセットアップ",
    color: "violet",
    lessons: [
      "Claude Code のインストールと環境構築",
      "基本的なコマンドと操作方法",
      "初めてのAIペアプログラミング体験",
      "CLAUDE.md の書き方とプロジェクト設定",
      "効果的なプロンプト設計の基礎",
      "演習: シンプルなWebアプリを Claude Code で構築",
    ],
  },
  {
    week: "Week 2",
    title: "実践的なコード開発ワークフロー",
    color: "indigo",
    lessons: [
      "コード生成・補完の高度なテクニック",
      "バグ発見とデバッグの自動化",
      "リファクタリングとコード品質改善",
      "テストコードの自動生成",
      "Git 連携と差分ベースの開発",
      "演習: 既存プロジェクトの改善作業",
    ],
  },
  {
    week: "Week 3",
    title: "エージェント機能と自動化",
    color: "cyan",
    lessons: [
      "マルチステップタスクの設計",
      "サブエージェントとタスク分解",
      "ファイル操作・検索の自動化",
      "CI/CD パイプラインとの統合",
      "カスタムスラッシュコマンドの作成",
      "演習: 開発ワークフローの完全自動化",
    ],
  },
  {
    week: "Week 4",
    title: "応用・MCP連携・チーム活用",
    color: "emerald",
    lessons: [
      "MCP (Model Context Protocol) の基礎",
      "データベース・API との MCP 連携",
      "ブラウザ操作の自動化",
      "チーム開発での Claude Code 導入",
      "セキュリティとベストプラクティス",
      "演習: フルスタックアプリを完成させる",
    ],
  },
];

const colorMap: Record<string, string> = {
  violet: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400",
  indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400",
  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
};

export default function Curriculum() {
  const [openWeek, setOpenWeek] = useState<number | null>(0);

  return (
    <section id="curriculum" className="py-24 bg-[#0d0d14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium uppercase tracking-wider mb-4">
            カリキュラム
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            4週間で
            <span className="gradient-text">完全習得</span>
          </h2>
          <p className="text-gray-400 text-lg">
            理論と実践を組み合わせた体系的なカリキュラム。週ごとにスキルを積み上げます
          </p>
        </div>

        <div className="space-y-4">
          {weeks.map((week, index) => (
            <div
              key={week.week}
              className="rounded-2xl border border-white/5 overflow-hidden bg-white/[0.02]"
            >
              <button
                onClick={() => setOpenWeek(openWeek === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border bg-gradient-to-r ${colorMap[week.color]}`}
                  >
                    {week.week}
                  </span>
                  <span className="text-white font-medium text-lg">{week.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${openWeek === index ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openWeek === index && (
                <div className="px-6 pb-6 border-t border-white/5">
                  <ul className="mt-4 space-y-3">
                    {week.lessons.map((lesson, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs flex-shrink-0">
                          {i + 1}
                        </span>
                        {lesson}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
