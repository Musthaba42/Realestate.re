"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CircleCheck, ImagePlus, LoaderCircle, Phone, Video, X } from "@/components/glyphs";
import {
  APPROVAL_TYPES,
  BHK_OPTIONS,
  CONSENT_TEXT,
  CONSTRUCTION_STAGES,
  FACINGS,
  PROPERTY_TYPES,
  RESIDENTIAL_TYPES,
  ROAD_TYPES,
  SELL_MAX_PHOTOS,
  SELL_MAX_VIDEOS,
} from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { compressImage, uploadWithProgress } from "@/lib/client-image";
import { WhatsAppIcon } from "@/components/icons";

const MAX_VIDEO_MB = 100;

type Photo = { file: File; preview: string };

function Section({ n, title, desc, children }: { n: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 md:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-on-gold">{n}</span>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SellForm({ callHref, owner }: { callHref: string; owner: { name: string; phone: string } }) {
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [stage, setStage] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [busy, setBusy] = useState<"" | "preparing" | "uploading">("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: number; whatsappUrl: string } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  const isResidential = RESIDENTIAL_TYPES.includes(type);
  const isLand = type === "land";

  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    setError("");
    const incoming = Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
    if (incoming.length < list.length) setError("Some files were skipped. Please use JPG, PNG or WEBP photos.");
    const room = SELL_MAX_PHOTOS - photos.length;
    if (incoming.length > room) setError(`You can upload up to ${SELL_MAX_PHOTOS} photos.`);
    const next = incoming.slice(0, Math.max(0, room)).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...next]);
  }

  function addVideos(list: FileList | null) {
    if (!list) return;
    setError("");
    const incoming = Array.from(list);
    const tooBig = incoming.filter((f) => f.size > MAX_VIDEO_MB * 1024 * 1024);
    if (tooBig.length) setError(`Each video must be under ${MAX_VIDEO_MB} MB. For bigger videos, paste a YouTube or Google Drive link instead.`);
    const ok = incoming.filter((f) => f.size <= MAX_VIDEO_MB * 1024 * 1024 && /^video\/(mp4|quicktime|webm)$/.test(f.type));
    const room = SELL_MAX_VIDEOS - videos.length;
    if (ok.length > room) setError(`You can upload up to ${SELL_MAX_VIDEOS} videos.`);
    setVideos((prev) => [...prev, ...ok.slice(0, Math.max(0, room))]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    fd.delete("photos_picker");
    fd.delete("videos_picker");

    setBusy("preparing");
    for (const p of photos) fd.append("photos", await compressImage(p.file));
    for (const v of videos) fd.append("videos", v);

    setBusy("uploading");
    setProgress(0);
    try {
      const res = await uploadWithProgress<{ ok: boolean; error?: string; id?: number; whatsappUrl?: string }>(
        "/api/sell",
        fd,
        setProgress,
      );
      if (res.status >= 400 || !res.body?.ok) {
        setError(res.body?.error ?? (res.status === 413 ? "Files are too large. Please upload fewer or smaller files." : "Something went wrong. Please try again."));
        setBusy("");
        return;
      }
      setDone({ id: res.body.id ?? 0, whatsappUrl: res.body.whatsappUrl ?? "" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please check your connection and try again.");
    }
    setBusy("");
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center" role="status">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
          <CircleCheck className="size-9" />
        </span>
        <h2 className="mt-4 text-2xl font-bold">Property submitted!</h2>
        {done.id > 0 && <p className="mt-1 text-sm text-muted">Reference number: S-{done.id}</p>}
        <p className="mt-3 leading-relaxed text-muted">
          Our team will review your property and may call you to verify the details. Once it is approved, it will be shown on our
          website for all buyers. You can follow the decision under “My account”. Your name and phone number are never shown publicly.
        </p>
        <div className="mt-6 grid gap-2.5">
          {done.whatsappUrl && (
            <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
              <WhatsAppIcon /> Send details on WhatsApp
            </a>
          )}
          <Link href="/account" className="btn btn-primary">
            Track in My account
          </Link>
          <a href={callHref} className="btn btn-ghost">
            <Phone className="size-4" /> Call us
          </a>
        </div>
      </div>
    );
  }

  const priceNum = Number(price.replace(/,/g, ""));

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
        <p className="text-sm text-muted">
          Posting as <span className="font-semibold text-ink">{owner.name}</span> · {owner.phone}
          <span className="block text-xs text-faint">Only our team sees these details. They are never shown on the website.</span>
        </p>
        <Link href="/account" className="btn btn-ghost btn-sm">
          My account
        </Link>
      </div>
      <Section n={1} title="Property details">
        <fieldset>
          <legend className="label">Property type *</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROPERTY_TYPES.map((t) => (
              <label key={t.value} className={`chip h-11 justify-center ${type === t.value ? "chip-active" : ""}`}>
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  required
                  className="sr-only"
                  checked={type === t.value}
                  onChange={() => setType(t.value)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Title</span>
            <input name="title" className="input" maxLength={120} placeholder="e.g. 2 BHK house near Urapakkam station (optional)" />
          </label>
          <label className="block">
            <span className="label">Total area (sq.ft) *</span>
            <input name="totalSqft" className="input" required inputMode="decimal" pattern="[\d,.]+" placeholder="e.g. 1200" />
          </label>
          <label className="block">
            <span className="label">Expected price (₹) *</span>
            <input
              name="price"
              className="input"
              required
              inputMode="numeric"
              pattern="[\d,]+"
              placeholder="e.g. 4000000"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d,]/g, ""))}
            />
            <span className="hint">
              Your asking price (one amount, not a range). {priceNum > 0 ? <strong className="text-muted">{formatINR(priceNum)}</strong> : null}
            </span>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="label">Is the price negotiable?</legend>
            <div className="flex gap-2">
              <label className="chip h-11 has-[:checked]:border-gold has-[:checked]:bg-gold has-[:checked]:font-semibold has-[:checked]:text-on-gold">
                <input type="radio" name="isNegotiable" value="yes" defaultChecked className="sr-only" /> Negotiable
              </label>
              <label className="chip h-11 has-[:checked]:border-gold has-[:checked]:bg-gold has-[:checked]:font-semibold has-[:checked]:text-on-gold">
                <input type="radio" name="isNegotiable" value="no" className="sr-only" /> Fixed – not negotiable
              </label>
            </div>
          </fieldset>

          {isResidential && (
            <label className="block">
              <span className="label">Bedrooms (BHK)</span>
              <select name="bhk" className="input" defaultValue="">
                <option value="">Select</option>
                {BHK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {type && !isLand && (
            <label className="block">
              <span className="label">Bathrooms</span>
              <input name="bathrooms" className="input" type="number" min={0} max={20} placeholder="e.g. 2" />
            </label>
          )}
          <label className="block">
            <span className="label">Facing</span>
            <select name="facing" className="input" defaultValue="">
              <option value="">Select</option>
              {FACINGS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {!isLand && type && (
            <>
              <label className="block">
                <span className="label">Construction status</span>
                <select name="constructionStage" className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="">Select</option>
                  {CONSTRUCTION_STAGES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {stage && stage !== "completed" && stage !== "not_started" && (
                <label className="block">
                  <span className="label">Completed (%)</span>
                  <input name="constructionPercent" className="input" type="number" min={0} max={100} placeholder="e.g. 60" />
                </label>
              )}
            </>
          )}

          <label className="block">
            <span className="label">Road</span>
            <select name="roadType" className="input" defaultValue="">
              <option value="">Select</option>
              {ROAD_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Road details</span>
            <input name="roadNote" className="input" maxLength={200} placeholder="e.g. 30 ft tar road" />
          </label>
          <label className="block">
            <span className="label">Approval</span>
            <select name="approvalType" className="input" defaultValue="">
              <option value="">Not sure / None</option>
              {APPROVAL_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Bank loan possible?</span>
            <select name="loanAvailable" className="input" defaultValue="not_sure">
              <option value="not_sure">Not sure</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Description</span>
            <textarea
              name="description"
              className="input"
              maxLength={2000}
              rows={4}
              placeholder="Nearby landmarks, special features, documents available, etc."
            />
          </label>
        </div>
      </Section>

      <Section n={2} title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Area / locality *</span>
            <input name="locality" className="input" required minLength={2} maxLength={100} placeholder="e.g. Urapakkam" />
          </label>
          <label className="block">
            <span className="label">City *</span>
            <input name="city" className="input" required minLength={2} maxLength={60} defaultValue="Chennai" />
          </label>
          <label className="block">
            <span className="label">District</span>
            <input name="district" className="input" maxLength={60} placeholder="e.g. Chengalpattu" />
          </label>
          <label className="block">
            <span className="label">PIN code</span>
            <input name="pincode" className="input" inputMode="numeric" pattern="\d{6}" maxLength={6} title="6-digit PIN code" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Address</span>
            <input name="address" className="input" maxLength={300} placeholder="Door no, street (not shown publicly)" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Google Maps link</span>
            <input name="mapsUrl" className="input" type="url" inputMode="url" placeholder="https://maps.app.goo.gl/…" />
            <span className="hint">Open Google Maps → drop a pin on the property → Share → Copy link.</span>
          </label>
        </div>
      </Section>

      <Section n={3} title="Photos & videos" desc="Clear photos help us sell faster. Photos are resized automatically.">
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative aspect-square overflow-hidden rounded-2xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt={`Selected photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                className="icon-btn absolute right-1.5 top-1.5 size-7"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => {
                  URL.revokeObjectURL(p.preview);
                  setPhotos((prev) => prev.filter((x) => x !== p));
                }}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < SELL_MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line text-muted transition-colors hover:border-faint hover:text-ink"
            >
              <span className="grid justify-items-center gap-1 text-xs font-medium">
                <ImagePlus className="size-6" /> Add photos
              </span>
            </button>
          )}
        </div>
        <input
          ref={photoInput}
          name="photos_picker"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            addPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="hint">
          {photos.length}/{SELL_MAX_PHOTOS} photos · JPG, PNG or WEBP
        </p>

        <div className="mt-6 space-y-2.5">
          {videos.map((v, i) => (
            <div key={v.name + i} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Video className="size-4 shrink-0 text-muted" />
                <span className="truncate">{v.name}</span>
                <span className="shrink-0 text-faint">{(v.size / 1024 / 1024).toFixed(1)} MB</span>
              </span>
              <button
                type="button"
                className="text-muted hover:text-ink"
                aria-label={`Remove video ${v.name}`}
                onClick={() => setVideos((prev) => prev.filter((x) => x !== v))}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {videos.length < SELL_MAX_VIDEOS && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => videoInput.current?.click()}>
              <Video className="size-4" /> Add video (max {MAX_VIDEO_MB} MB)
            </button>
          )}
          <input
            ref={videoInput}
            name="videos_picker"
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            multiple
            className="hidden"
            onChange={(e) => {
              addVideos(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <label className="mt-5 block">
          <span className="label">Or paste a video link</span>
          <input name="videoLink" className="input" type="url" inputMode="url" placeholder="YouTube / Google Drive link" />
        </label>
      </Section>

      {error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="card p-5 md:p-7">
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy !== ""}>
          {busy && <LoaderCircle className="size-5 animate-spin" />}
          {busy === "preparing" ? "Preparing photos…" : busy === "uploading" ? `Uploading… ${progress}%` : "Submit Property"}
        </button>
        {busy === "uploading" && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-gold transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
        <p className="mt-3 text-center text-xs leading-relaxed text-faint">{CONSENT_TEXT}</p>
      </div>
    </form>
  );
}
