import Link from "next/link";
import { House, Search } from "@/components/glyphs";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70dvh] place-items-center py-16 text-center">
      <div>
        <p className="text-7xl font-bold text-surface-3">404</p>
        <h1 className="mt-4 text-2xl font-bold">This page or property is not available</h1>
        <p className="mt-2 text-muted">It may have been sold or removed.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/properties" className="btn btn-primary">
            <Search className="size-4" /> Find Property
          </Link>
          <Link href="/" className="btn btn-ghost">
            <House className="size-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
