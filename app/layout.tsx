import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/components/app-state";
import { Header } from "@/components/header";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { UpdateBanner } from "@/components/update-banner";

export const metadata: Metadata = {
  title: "RPG English Learning",
  description: "RPG story-driven English learning chat",
  manifest: "/manifest.json",
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
        <ServiceWorkerRegister />
        <AppStateProvider>
          <Header />
          <UpdateBanner />
          <main className="rpg-shell">{children}</main>
        </AppStateProvider>
      </body>
    </html>
  );
}
