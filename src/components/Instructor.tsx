export default function Instructor() {
  return (
    <section id="instructor" className="py-24 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">講師紹介</h2>
        </div>
        <div className="bg-white rounded-2xl p-10 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold">
              M
            </div>
            <div>
              <div className="text-sm text-orange-500 font-medium mb-1">Instructor</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">mikiko</h3>
              <p className="text-sm text-gray-400 mb-4">Web Developer / AI Tools Practitioner</p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Claude Codeを日常的に活用しながらWebプロダクト開発を行っています。
                プログラミング未経験からAI駆動開発を始めた経験を活かし、
                ゼロからでも実践できる学習メソッドを設計しました。
                「難しいことを難しく教えない」をモットーに、手を動かしながら学べる講座を提供します。
              </p>
              <div className="flex flex-wrap gap-2">
                {["Next.js", "TypeScript", "Claude Code", "Vercel", "GitHub"].map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
