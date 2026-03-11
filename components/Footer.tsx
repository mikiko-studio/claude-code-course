export default function Footer() {
  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                CC
              </div>
              <span className="font-semibold text-white">Claude Code 完全マスター講座</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              AIエージェントとのペアプログラミングを通じて、現代の開発スタイルを習得する実践的な日本語講座です。
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4">コンテンツ</h3>
            <ul className="space-y-2">
              {["特徴", "カリキュラム", "受講生の声", "料金プラン", "FAQ"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-medium text-sm mb-4">サポート</h3>
            <ul className="space-y-2">
              {["お問い合わせ", "プライバシーポリシー", "利用規約", "返金ポリシー", "特定商取引法"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © 2026 Claude Code 完全マスター講座. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs">
            ※ Claude Code は Anthropic 社のサービスです。本講座は公式とは無関係の独立したコンテンツです。
          </p>
        </div>
      </div>
    </footer>
  );
}
