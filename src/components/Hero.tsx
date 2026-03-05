export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          🤖 AI駆動開発の新時代へ
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Claude Codeで
          <br />
          <span className="text-orange-500">10倍速く</span>
          コードを書く
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          AIと対話しながら開発する新しいワークフローを習得。
          プログラミング初心者からエンジニアまで、
          実際に手を動かしてプロダクトを作り上げます。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#cta"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors shadow-lg shadow-orange-200"
          >
            今すぐ申し込む →
          </a>
          <a
            href="#curriculum"
            className="text-gray-700 font-medium px-8 py-4 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
          >
            カリキュラムを見る
          </a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          {[
            { value: "4週間", label: "プログラム期間" },
            { value: "20+", label: "実践課題" },
            { value: "少人数", label: "グループ制" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
