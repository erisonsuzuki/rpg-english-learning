import { ChatPanel } from "@/components/chat-panel";
import { ProfilePanel } from "@/components/profile-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { AppStateProvider } from "@/components/app-state";
import { Header } from "@/components/header";

export default function HomePage() {
  return (
    <AppStateProvider>
      <main className="app-shell">
        <Header />
        <section className="app-body">
          <ProfilePanel />
          <ChatPanel />
          <SettingsPanel />
        </section>
      </main>
    </AppStateProvider>
  );
}
