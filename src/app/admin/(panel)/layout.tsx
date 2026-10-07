import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/app/auth/actions";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [s, leads, sellers] = await Promise.all([
    getSettings(),
    db.lead.count({ where: { status: "new" } }),
    db.sellerRequest.count({ where: { status: "pending" } }),
  ]);
  const counts = { leads, sellers };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line/60 bg-[#0c0b0a] p-4 lg:flex">
        <div className="px-1 pb-6 pt-1">
          <Logo name={s.businessName} href="/admin" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-faint">Team dashboard</p>
        </div>
        <AdminNav counts={counts} variant="side" />
        <div className="mt-auto space-y-2 border-t border-line/60 pt-4">
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm w-full">
            <ExternalLink className="size-4" /> View website
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-soft btn-sm w-full">
              <LogOut className="size-4" /> Log out
            </button>
          </form>
          <p className="truncate px-1 pt-1 text-center text-xs text-faint">{admin.email ?? admin.login}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/90 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo name={s.businessName} href="/admin" />
            <div className="flex gap-2">
              <Link href="/" target="_blank" className="icon-btn icon-btn-solid" aria-label="View website">
                <ExternalLink className="size-4" />
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="icon-btn icon-btn-solid" aria-label="Log out">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="px-4">
            <AdminNav counts={counts} variant="top" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
