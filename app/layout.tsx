import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { Header } from "@/components/header";
import { SerwistClientProvider } from "@/components/serwist-provider";
import { UpdateBanner } from "@/components/update-banner";

export const metadata: Metadata = {
  applicationName: "RPG English Learning",
  title: "RPG English Learning",
  description: "RPG story-driven English learning chat",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RPG English Learning",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "RPG English Learning",
    title: "RPG English Learning",
    description: "RPG story-driven English learning chat",
  },
  twitter: {
    card: "summary",
    title: "RPG English Learning",
    description: "RPG story-driven English learning chat",
  },
};

export const viewport: Viewport = {
  themeColor: "#204b5e",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SerwistClientProvider>
          <AppProviders>
            <Header />
            <UpdateBanner />
            <main className="rpg-shell">
              <Suspense
                fallback={<div className="page-skeleton">Loading...</div>}
              >
                {children}
              </Suspense>
            </main>
          </AppProviders>
        </SerwistClientProvider>
      </body>
    </html>
  );
}
