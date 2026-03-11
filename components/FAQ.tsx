"use client";

import { useState } from "react";

const faqs = [
  {
    q: "プログラミング初心者でも受講できますか？",
    a: "ある程度のプログラミング基礎知識（HTML/CSS/JavaScriptの基本など）があると学習効果が高まります。完全な初心者の方には、まず基礎的なプログラミング学習を終えてから受講されることをお勧めします。ただし、プログラミング学習者（中級者を目指す方）向けコンテンツも含まれています。",
  },
  {
    q: "Claude Codeを使うのに追加の費用はかかりますか？",
    a: "Claude Code は Anthropic の Claude API を利用しています。API の利用には別途 Anthropic のアカウントと料金（従量課金）が必要です。ただし、学習期間中の一般的な使用量では月数百円〜数千円程度が目安です。講座内で費用を抑える方法も解説します。",
  },
  {
    q: "学習にどれくらいの時間が必要ですか？",
    a: "週4〜6時間の学習時間を確保できれば、4週間で全カリキュラムを修了できます。動画は全て録画済みのため、自分のペースで進めることができます。コンプリートプランでは永続アクセスできるため、期間にしばられる心配はありません。",
  },
  {
    q: "Windowsでも学習できますか？",
    a: "はい、対応しています。Claude Code は macOS、Linux、Windows（WSL経由）で動作します。講座内でWindows環境のセットアップ方法も詳しく解説していますので安心して受講できます。",
  },
  {
    q: "コンテンツはいつでも見られますか？",
    a: "コンプリートプランは永続アクセス付きで、カリキュラムのアップデートも無料で受け取れます。スタータープランも購入から無期限でアクセスできます。",
  },
  {
    q: "領収書・請求書の発行はできますか？",
    a: "はい、購入完了後に領収書を発行します。法人・チームプランでは請求書払いにも対応しています。経費申請や確定申告でご利用ください。",
  },
  {
    q: "グループメンタリングとはどのようなものですか？",
    a: "コンプリートプランに含まれるオンラインのグループセッションです（Zoom使用）。最大10名程度の少人数で、講師に直接質問したり、他の受講生と一緒に課題を解決したりします。毎月1回、3ヶ月分（3回）が含まれます。",
  },
  {
    q: "修了証明書はどのような場合に発行されますか？",
    a: "コンプリートプランで全週の演習プロジェクトを提出・合格した方に発行します。LinkedInプロフィールやポートフォリオに追加できる形式でお渡しします。",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-[#0d0d14]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium uppercase tracking-wider mb-4">
            よくある質問
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            <span className="gradient-text">FAQ</span>
          </h2>
          <p className="text-gray-400 text-lg">
            ご不明な点があればお気軽にお問い合わせください
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white font-medium pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <p className="text-gray-400 text-sm leading-relaxed mt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">他にご質問がある場合は</p>
          <a
            href="mailto:info@example.com"
            className="text-violet-400 hover:text-violet-300 text-sm underline underline-offset-4 transition-colors"
          >
            info@example.com までお気軽にお問い合わせください
          </a>
        </div>
      </div>
    </section>
  );
}
