"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Play, RotateCw, Star, X } from "@/components/glyphs";

export type TrayItem = { file: File; preview: string };

const isVideo = (f: File) => f.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(f.name);

/**
 * Photos / videos chosen before uploading, with tools to change them on the spot:
 * move earlier or later, replace a file, make a photo the cover (first), or remove it.
 */
export function MediaTray({
  items,
  setItems,
  onAdd,
  canAdd = true,
  addLabel = "Add photos",
  accept,
  validate,
  onError,
  showCover = true,
}: {
  items: TrayItem[];
  setItems: React.Dispatch<React.SetStateAction<TrayItem[]>>;
  /** Opens the picker for new files. */
  onAdd: () => void;
  canAdd?: boolean;
  addLabel?: string;
  /** `accept` for the replace picker. */
  accept: string;
  /** Return an error message to refuse a replacement file. */
  validate?: (f: File) => string | null;
  onError?: (msg: string) => void;
  showCover?: boolean;
}) {
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceAt = useRef<number>(-1);
  const firstImage = items.findIndex((it) => !isVideo(it.file));

  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  const makeCover = (i: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [it] = next.splice(i, 1);
      return it ? [it, ...next] : prev;
    });

  const remove = (i: number) =>
    setItems((prev) => {
      const it = prev[i];
      if (it) URL.revokeObjectURL(it.preview);
      return prev.filter((_, n) => n !== i);
    });

  function replace(file: File | undefined) {
    const i = replaceAt.current;
    if (!file || i < 0) return;
    const err = validate?.(file);
    if (err) {
      onError?.(err);
      return;
    }
    setItems((prev) => {
      const old = prev[i];
      if (!old) return prev;
      URL.revokeObjectURL(old.preview);
      const next = [...prev];
      next[i] = { file, preview: URL.createObjectURL(file) };
      return next;
    });
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => {
          const video = isVideo(it.file);
          const cover = showCover && i === firstImage;
          return (
            <li key={it.preview} className="overflow-hidden rounded-2xl border border-line/70 bg-surface-2">
              <div className="relative aspect-[4/3] bg-black">
                {video ? (
                  <video src={`${it.preview}#t=0.1`} className="size-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.preview} alt={`Selected ${i + 1}`} className="size-full object-cover" />
                )}
                <span className="badge absolute left-1.5 top-1.5 font-mono text-[10px]">
                  {video && <Play className="size-3 fill-current" />}
                  {String(i + 1).padStart(2, "0")}
                </span>
                {cover && (
                  <span className="badge absolute bottom-1.5 left-1.5 text-gold-2">
                    <Star className="size-3 fill-current" /> Cover
                  </span>
                )}
                <button
                  type="button"
                  className="icon-btn absolute right-1.5 top-1.5 size-7"
                  aria-label={`Remove ${it.file.name}`}
                  title="Remove"
                  onClick={() => remove(i)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="icon-btn icon-btn-solid size-8"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    title="Move earlier"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-solid size-8"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move later"
                    title="Move later"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {showCover && !video && !cover && (
                    <button
                      type="button"
                      className="icon-btn icon-btn-solid size-8"
                      onClick={() => makeCover(i)}
                      aria-label="Make cover photo"
                      title="Make cover photo"
                    >
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn-solid size-8"
                    onClick={() => {
                      replaceAt.current = i;
                      replaceInput.current?.click();
                    }}
                    aria-label={`Replace ${it.file.name}`}
                    title="Replace with another file"
                  >
                    <RotateCw className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {canAdd && (
          <li>
            <button
              type="button"
              onClick={onAdd}
              className="grid aspect-[4/3] w-full place-items-center rounded-2xl border-2 border-dashed border-line text-muted transition-colors hover:border-gold/60 hover:text-gold-2"
            >
              <span className="grid justify-items-center gap-1 text-xs font-medium">
                <ImagePlus className="size-6" /> {addLabel}
              </span>
            </button>
          </li>
        )}
      </ul>
      {items.length > 1 && (
        <p className="hint mt-2">Use the arrows to change the order, ↻ to replace a file{showCover ? " and ★ to choose the cover photo" : ""}.</p>
      )}
      <input
        ref={replaceInput}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          replace(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
