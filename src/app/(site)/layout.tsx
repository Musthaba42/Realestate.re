import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BottomNav } from "@/components/site/BottomNav";
import { WelcomeModal } from "@/components/site/WelcomeModal";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, me] = await Promise.all([getSettings(), getCurrentUser()]);
  return (
    <div className="site-shell">
      <Header businessName={s.businessName} phone={s.phone} user={me ? { name: me.name, role: me.role } : null} />
      <main>{children}</main>
      <Footer s={s} />
      <BottomNav accountHref={me ? (me.role === "admin" ? "/admin" : "/account") : "/login"} />
      <WelcomeModal />
    </div>
  );
}
