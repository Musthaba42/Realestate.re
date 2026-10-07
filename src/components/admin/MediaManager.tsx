"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, FileText, LoaderCircle, Play, Star, Trash, Upload } from "lucide-react";
import type { PropertyDocument, PropertyMedia } from "@prisma/client";
import {
  addYoutubeAction,
  deleteDocumentAction,
  deleteMediaAction,
  moveMediaAction,
  setCoverAction,
  updateMediaCategoryAction,
} from "@/app/admin/actions";
import { MEDIA_CATEGORIES } from "@/lib/constants";
import { youtubeId } from "@/lib/format";
import { uploadPropertyFiles } from "@/lib/client-image";
import { ConfirmSubmit, FormMessage, PendingButton, useFormAction } from "./ui";
import { PropertyImage } from "@/components/PropertyImage";

function useUploader(propertyId: string, kind: "media" | "document") {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  async function upload(files: File[], extra: { category?: string; name?: string }) {
    if (!files.length) return;
    setBusy(true);
    setMsg({});
    setProgress(0);
    const res = await uploadPropertyFiles(propertyId, files, { kind, ...extra }, (p) => setProgress(p));
    setMsg({
      ok: res.saved ? `${res.saved} file${res.saved === 1 ? "" : "s"} uploaded.` : undefined,
      error: res.errors.join(" ") || undefined,
    });
    router.refresh();
    setBusy(false);
  }
  return { busy, progress, msg, upload };
}

export function MediaManager({ propertyId, media }: { propertyId: string; media: PropertyMedia[] }) {
  const [category, setCategory] = useState("exterior");
  const input = useRef<HTMLInputElement>(null);
  const { busy, progress, msg, upload } = useUploader(propertyId, "media");
  const yt = useFormAction(addYoutubeAction);

  return (
    <section className="card p-5 md:p-6">
      <h2 className="font-bold">Photos & videos</h2>
      <p className="mt-0.5 text-sm text-muted">
        The ★ photo is the cover image. Photos are resized automatically. Videos up to 100 MB — for longer videos, add a YouTube link.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="label">Category</span>
          <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            {MEDIA_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? `Uploading… ${progress}%` : "Upload photos / videos"}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void upload(files, { category });
          }}
        />
      </div>
      <div className="mt-3">
        <FormMessage state={msg.error || msg.ok ? msg : undefined} />
      </div>

      {media.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No photos or videos yet.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((m, i) => {
            const ytId = m.kind === "youtube" ? youtubeId(m.url) : null;
            return (
              <div key={m.id} className="overflow-hidden rounded-2xl border border-line/70 bg-surface-2">
                <div className="relative aspect-[4/3] bg-black">
                  {m.kind === "image" ? (
                    <PropertyImage src={m.url} alt="" width={400} className="size-full object-cover" />
                  ) : ytId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt="" className="size-full object-cover opacity-80" />
                  ) : (
                    <video src={m.url} className="size-full object-cover" preload="metadata" muted playsInline />
                  )}
                  {m.kind !== "image" && (
                    <span className="badge absolute left-2 top-2">
                      <Play className="size-3 fill-current" /> {m.kind === "youtube" ? "YouTube" : "Video"}
                    </span>
                  )}
                  {m.isCover && (
                    <span className="badge absolute right-2 top-2 text-warn">
                      <Star className="size-3 fill-current" /> Cover
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-2">
                  <form key={m.category} action={updateMediaCategoryAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <select
                      name="category"
                      defaultValue={m.category}
                      className="input min-h-9 rounded-xl py-1 text-xs"
                      aria-label="Category"
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    >
                      {MEDIA_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </form>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <form action={moveMediaAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button type="submit" className="icon-btn icon-btn-solid size-8" disabled={i === 0} aria-label="Move earlier" title="Move earlier">
                          <ArrowUp className="size-3.5" />
                        </button>
                      </form>
                      <form action={moveMediaAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button
                          type="submit"
                          className="icon-btn icon-btn-solid size-8"
                          disabled={i === media.length - 1}
                          aria-label="Move later"
                          title="Move later"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </form>
                      {m.kind === "image" && !m.isCover && (
                        <form action={setCoverAction}>
                          <input type="hidden" name="id" value={m.id} />
                          <button type="submit" className="icon-btn icon-btn-solid size-8" aria-label="Set as cover" title="Set as cover">
                            <Star className="size-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                    <form action={deleteMediaAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <ConfirmSubmit message="Delete this file permanently?" className="icon-btn icon-btn-solid size-8 text-danger" title="Delete">
                        <Trash className="size-3.5" />
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={yt.onSubmit} className="mt-6 grid gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <input type="hidden" name="propertyId" value={propertyId} />
        <label className="block">
          <span className="label">Add YouTube video</span>
          <input name="url" className="input" placeholder="https://youtu.be/…" required />
        </label>
        <label className="block">
          <span className="label">Category</span>
          <select name="category" className="input" defaultValue="walkthrough">
            {MEDIA_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <PendingButton pending={yt.pending} className="btn btn-soft" pendingText="Adding…">
          Add video
        </PendingButton>
        <div className="sm:col-span-3">
          <FormMessage state={yt.state} />
        </div>
      </form>
    </section>
  );
}

export function DocumentManager({ propertyId, documents }: { propertyId: string; documents: PropertyDocument[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const { busy, progress, msg, upload } = useUploader(propertyId, "document");

  return (
    <section className="card p-5 md:p-6">
      <h2 className="font-bold">Approval documents (private)</h2>
      <p className="mt-0.5 text-sm text-muted">Only logged-in team members can open these. PDF or photo, up to 15 MB.</p>
      {documents.length > 0 && (
        <ul className="mt-4 divide-y divide-line/60 rounded-2xl bg-surface-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 hover:underline">
                <FileText className="size-4 shrink-0 text-muted" />
                <span className="truncate">{d.name}</span>
              </a>
              <form action={deleteDocumentAction}>
                <input type="hidden" name="id" value={d.id} />
                <ConfirmSubmit message="Delete this document?" className="icon-btn icon-btn-solid size-8 text-danger" title="Delete document">
                  <Trash className="size-3.5" />
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block flex-1">
          <span className="label">Document name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. DTCP approval copy" />
        </label>
        <button type="button" className="btn btn-soft" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? `Uploading… ${progress}%` : "Upload document"}
        </button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void upload(files, { name: name.trim() || files[0]?.name || "Document" }).then(() => setName(""));
          }}
        />
      </div>
      <div className="mt-3">
        <FormMessage state={msg.error || msg.ok ? msg : undefined} />
      </div>
    </section>
  );
}
