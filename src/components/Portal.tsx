"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Render children at the end of <body>. Needed for overlays inside elements
 * that use backdrop-filter (which would otherwise trap position:fixed).
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
