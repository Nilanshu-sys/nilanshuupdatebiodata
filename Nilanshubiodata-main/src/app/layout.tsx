
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nilanshu | Personal Biodata",
  description: "Nilanshu's personal portfolio and biodata website.",
  verification: {
    google: "qgH07_mmPN7nmTQV3jA9LvsXX7cFoTT2sHi1p5BgJLI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-5367732405267748"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5367732405267748"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

