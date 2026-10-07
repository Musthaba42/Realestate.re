import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PropertyForm } from "@/components/admin/PropertyForm";

export const metadata: Metadata = { title: "Add property" };

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/properties" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" /> Properties
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Add property</h1>
        <p className="mt-1 text-sm text-muted">
          Add photos, fill in the details and press Create. Only the fields marked * are required.
        </p>
      </div>
      <PropertyForm />
    </div>
  );
}
