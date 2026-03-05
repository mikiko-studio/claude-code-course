import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Code 実践講座 | AIと一緒にコードを書く新しい開発体験",
  description:
    "Claude Codeを使ったAI駆動開発を学ぶ実践講座。ゼロから始めてプロダクト開発まで、実際に手を動かしながら習得できます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
