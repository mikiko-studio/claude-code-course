"use client";

import { useState } from "react";

const faqs = [
  {
    question: "プログラミング経験がなくても受講できますか？",
    answer:
      "はい、未経験の方も対象としています。Claude Codeはコードを自動生成してくれるため、まず動くものを作りながら学ぶことができます。ただし、パソコン操作の基本（ファイル操作・ブラウザ使用など）はできる状態を前提としています。",
  },
  {
    question: "受講に必要な環境・ツールは何ですか？",
    answer:
      "WindowsまたはMacのパソコン（スマートフォン・タブレット不可）、Claude Proプラン（月額$20）、安定したインターネット接続が必要です。その他のツール（VSCode、Node.jsなど）はDay 1のセットアップ手順に従って無料でインストールできます。",
  },
  {
    question: "1日どのくらいの学習時間が必要ですか？",
    answer:
      "1日あたり30〜60分を目安としています。Week 4の実装スプリントは集中して取り組む時間が必要ですが、基本的には仕事後の空き時間で無理なく進められる設計にしています。",
  },
  {
    question: "受講期間中にわからないことがあったらどうすればいいですか？",
    answer:
      "受講生専用のSlackワークスペースで質問できます。24時間以内に回答します。また、週1回のグループQ&Aセッション（任意参加）も開催します。",
  },
  {
    question: "受講後のサポートはありますか？",
    answer:
      "受講終了後も3ヶ月間、Slackコミュニティへのアクセスが続きます。卒業生同士の交流や最新情報の共有の場としてご活用いただけます。",
  },
  {
    question: "返金保証はありますか？",
    answer:
      "受講開始から7日以内であれば、理由を問わず全額返金します。まずは試してみてください。",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full text-left py-5 flex items-center justify-between gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-gray-900">{question}</span>
        <span className="text-orange-500 flex-shrink-0 text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="pb-5 text-gray-600 text-sm leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">よくある質問</h2>
        </div>
        <div className="bg-gray-50 rounded-2xl px-8 divide-y divide-gray-100">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
