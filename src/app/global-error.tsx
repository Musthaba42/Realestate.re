"use client";

import "./globals.css";
import { ErrorView } from "@/components/ErrorView";

// Last-resort error screen (when even the main layout fails, e.g. the database is down).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <ErrorView error={error} reset={reset} />
      </body>
    </html>
  );
}
