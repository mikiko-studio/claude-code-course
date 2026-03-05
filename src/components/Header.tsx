export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="font-bold text-gray-900 text-lg">
          Claude Code <span className="text-orange-500">講座</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">特徴</a>
          <a href="#curriculum" className="hover:text-gray-900 transition-colors">カリキュラム</a>
          <a href="#instructor" className="hover:text-gray-900 transition-colors">講師</a>
          <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
        </nav>
        <a
          href="#cta"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
        >
          申し込む
        </a>
      </div>
    </header>
  );
}
