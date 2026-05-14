import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataLens AI",
  description: "노코딩 AI 통계 분석 플랫폼",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>◈</text></svg>" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
