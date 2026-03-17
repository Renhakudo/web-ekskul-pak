import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LMS Ekskul PAK – Platform Belajar Gamified",
    template: "%s | LMS Ekskul PAK",
  },
  description:
    "Platform pembelajaran digital untuk Ekstrakurikuler PAK. Belajar interaktif dengan sistem XP, Level, Leaderboard, dan Forum Diskusi.",
  keywords: ["LMS", "ekskul", "belajar", "gamifikasi", "XP", "leaderboard"],
  openGraph: {
    title: "LMS Ekskul PAK",
    description: "Platform LMS Gamified untuk Ekstrakurikuler",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${nunito.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
