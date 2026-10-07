import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import "./globals.css";

export function generateMetadata(): Metadata {
  const { profile } = getContent();
  const title = `${profile.name} — ${profile.headline}`;
  const description = profile.summary.slice(0, 200);
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: profile.photo ? [profile.photo] : [] },
    twitter: { card: "summary", title, description },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
