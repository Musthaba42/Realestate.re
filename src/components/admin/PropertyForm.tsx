"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash } from "@/components/glyphs";
import { MediaTray, type TrayItem } from "@/components/MediaTray";
import type { Property } from "@prisma/client";
import { savePropertyAction, type FormState } from "@/app/admin/actions";
import { uploadPropertyFiles } from "@/lib/client-image";
import { FormMessage, PendingButton, useFormAction } from "./ui";
import {
  APPROVAL_TYPES,
  BHK_OPTIONS,
  CONSTRUCTION_STAGES,
  FACINGS,
  LANDMARK_KINDS,
  MAX_LANDMARKS,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  RESIDENTIAL_TYPES,
  ROAD_TYPES,
} from "@/lib/constants";
import { formatINR, pricePerSqft } from "@/lib/format";

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 md:p-6">
      <h2 className="font-bold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
  inputMode,
  wide,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  wide?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">
        {label}
        {required && " *"}
      </span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        className="input"
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
      />
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
  empty = "—",
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string | null;
  empty?: string | null;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        name={name}
        className="input"
        {...(value !== undefined ? { value, onChange: (e) => onChange?.(e.target.value) } : { defaultValue: defaultValue ?? "" })}
      >
        {empty !== null && <option value="">{empty}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="checkbox mt-0.5" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

type LandmarkRow = { key: number; name: string; kind: string; km: string };

/** "Explore the locality": big landmarks near the property, with distance in km. */
function LandmarkEditor({ initial }: { initial: { name: string; kind: string; distanceKm: number }[] }) {
  const nextKey = useRef(initial.length + 1);
  const [rows, setRows] = useState<LandmarkRow[]>(() =>
    initial.length
      ? initial.map((l, i) => ({ key: i, name: l.name, kind: l.kind, km: String(l.distanceKm) }))
      : [{ key: 0, name: "", kind: "transport", km: "" }],
  );
  const update = (key: number, patch: Partial<LandmarkRow>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  return (
    <section className="card p-5 md:p-6">
      <h2 className="font-bold">Explore the locality</h2>
      <p className="mt-0.5 text-sm text-muted">
        Big landmarks near this property and how far they are, e.g. “Urapakkam Railway Station – 1.5 km”. Shown on the property page,
        nearest first. Empty rows are ignored.
      </p>
      <div className="mt-5 space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} className="grid gap-2 rounded-2xl bg-surface-2 p-2.5 sm:grid-cols-[1fr_200px_110px_auto] sm:items-center">
            <input
              name="landmarkName"
              className="input"
              placeholder="Landmark name"
              value={r.name}
              maxLength={80}
              onChange={(e) => update(r.key, { name: e.target.value })}
              aria-label="Landmark name"
            />
            <select name="landmarkKind" className="input" value={r.kind} onChange={(e) => update(r.key, { kind: e.target.value })} aria-label="Landmark type">
              {LANDMARK_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                name="landmarkKm"
                className="input pr-10"
                inputMode="decimal"
                placeholder="0.0"
                value={r.km}
                onChange={(e) => update(r.key, { km: e.target.value.replace(/[^\d.]/g, "") })}
                aria-label="Distance in km"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">km</span>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn-solid justify-self-end text-danger"
              aria-label="Remove landmark"
              onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
            >
              <Trash className="size-4" />
            </button>
          </div>
        ))}
      </div>
      {rows.length < MAX_LANDMARKS && (
        <button
          type="button"
          className="btn btn-soft btn-sm mt-3"
          onClick={() => setRows((rs) => [...rs, { key: nextKey.current++, name: "", kind: "other", km: "" }])}
        >
          <Plus className="size-4" /> Add landmark
        </button>
      )}
    </section>
  );
}

type Picked = TrayItem;

/** Photo/video picker used when adding a new property (uploaded right after saving). */
function NewMediaPicker({ items, setItems }: { items: Picked[]; setItems: React.Dispatch<React.SetStateAction<Picked[]>> }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="card p-5 md:p-6">
      <h2 className="font-bold">Photos & videos</h2>
      <p className="mt-0.5 text-sm text-muted">
        Change anything before saving: reorder with the arrows, ↻ replaces a file, ★ makes a photo the cover. On the property page the
        videos play first, then the photos, in one slider. Photos are resized automatically.
      </p>
      <div className="mt-5">
        <MediaTray
          items={items}
          setItems={setItems}
          onAdd={() => input.current?.click()}
          canAdd={items.length < 30}
          addLabel="Add photos / videos"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        />
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          setItems((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, 30));
        }}
      />
      <p className="hint">{items.length} selected · JPG, PNG, WEBP or MP4 (max 30 at a time)</p>
    </section>
  );
}

export function PropertyForm({ property }: { property?: Property | null }) {
  const router = useRouter();
  const edit = useFormAction(savePropertyAction);
  const p = property;
  const [type, setType] = useState(p?.type ?? "house");
  const [stage, setStage] = useState(p?.constructionStage ?? "");
  const [price, setPrice] = useState(p ? String(p.price) : "");
  const [sqft, setSqft] = useState(p ? String(p.totalSqft) : "");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [createState, setCreateState] = useState<FormState>(undefined);
  const [creating, setCreating] = useState<"" | "saving" | "uploading">("");
  const [uploadPct, setUploadPct] = useState(0);
  const residential = RESIDENTIAL_TYPES.includes(type);
  const isLand = type === "land";
  const priceNum = Number(price.replace(/,/g, ""));
  const per = pricePerSqft(priceNum, Number(sqft.replace(/,/g, "")));

  // New property: save details, then upload the chosen photos, then open the property.
  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCreateState(undefined);
    setCreating("saving");
    let res: FormState;
    try {
      res = await savePropertyAction(undefined, fd);
    } catch {
      res = { error: "Could not save. Check your connection and try again." };
    }
    if (!res?.id) {
      setCreateState(res);
      setCreating("");
      return;
    }
    let note = "";
    if (picked.length) {
      setCreating("uploading");
      const up = await uploadPropertyFiles(res.id, picked.map((x) => x.file), { kind: "media", category: "exterior" }, setUploadPct);
      if (up.errors.length) note = "&uploadErrors=1";
    }
    router.push(`/admin/properties/${res.id}?created=1${note}`);
  }

  const state = p ? edit.state : createState;
  const pending = p ? edit.pending : creating !== "";

  return (
    <form onSubmit={p ? edit.onSubmit : onCreate} className="space-y-5">
      {p && <input type="hidden" name="id" value={p.id} />}

      {!p && <NewMediaPicker items={picked} setItems={setPicked} />}

      <Card title="Basic information">
        <Field label="Property title" name="title" defaultValue={p?.title} required wide placeholder="e.g. 2 BHK Individual House" />
        <Select label="Property type *" name="type" options={PROPERTY_TYPES} empty={null} value={type} onChange={setType} />
        <Field label="Sub-type" name="subType" defaultValue={p?.subType} placeholder="e.g. Villa, Flat, Residential Plot" />
        <label className="block sm:col-span-2">
          <span className="label">Description</span>
          <textarea name="description" className="input" rows={5} defaultValue={p?.description ?? ""} maxLength={5000} />
        </label>
      </Card>

      <Card title="Price" desc="One price for the property (no price range). Every price is shown on the website as “Negotiable price”.">
        <input type="hidden" name="isNegotiable" value="on" />
        <label className="block">
          <span className="label">Price (₹) *</span>
          <input
            name="price"
            className="input"
            inputMode="numeric"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d,]/g, ""))}
            placeholder="e.g. 4000000"
          />
          <span className="hint">
            {priceNum > 0 ? formatINR(priceNum) : ""}
            {per ? ` · ${formatINR(per)}/sq.ft (auto)` : ""}
          </span>
        </label>
        <p className="self-end rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-2">Shown as: Negotiable price</p>
      </Card>

      <Card title="Size">
        <label className="block">
          <span className="label">{isLand ? "Land area (sq.ft) *" : "Total area (sq.ft) *"}</span>
          <input
            name="totalSqft"
            className="input"
            inputMode="decimal"
            required
            value={sqft}
            onChange={(e) => setSqft(e.target.value.replace(/[^\d,.]/g, ""))}
          />
        </label>
        {!isLand && <Field label="Built-up area (sq.ft)" name="builtUpSqft" inputMode="decimal" defaultValue={p?.builtUpSqft} />}
        {!isLand && <Field label="Carpet area (sq.ft)" name="carpetSqft" inputMode="decimal" defaultValue={p?.carpetSqft} />}
      </Card>

      {!isLand && (
        <Card title={residential ? "Home specifications" : "Building details"}>
          {residential && <Select label="BHK" name="bhk" options={BHK_OPTIONS} defaultValue={p?.bhk != null ? String(Math.min(p.bhk, 5)) : ""} />}
          {residential && <Field label="Bedrooms" name="bedrooms" type="number" defaultValue={p?.bedrooms} />}
          <Field label="Bathrooms" name="bathrooms" type="number" defaultValue={p?.bathrooms} />
          <Field label="Number of floors" name="floors" type="number" defaultValue={p?.floors} />
          <Field label="Floor number" name="floorNo" type="number" defaultValue={p?.floorNo} hint="0 = Ground floor (apartments)" />
          <Field label="Parking" name="parking" defaultValue={p?.parking} placeholder="e.g. 1 Car (covered)" />
          {residential && <Field label="Balconies" name="balcony" type="number" defaultValue={p?.balcony} />}
          {residential && <Check label="Kitchen" name="kitchen" defaultChecked={p ? p.kitchen : true} />}
          {residential && <Check label="Living room" name="livingRoom" defaultChecked={p ? p.livingRoom : true} />}
        </Card>
      )}

      <Card title="Facing, road & approval">
        <Select label="Facing" name="facing" options={FACINGS} defaultValue={p?.facing} />
        <Select label="Road" name="roadType" options={ROAD_TYPES} defaultValue={p?.roadType} />
        <Field label="Road details" name="roadNote" defaultValue={p?.roadNote} wide placeholder="e.g. 30 ft tar road, 400 m from GST Road" />
        <Select label="Approval type" name="approvalType" options={APPROVAL_TYPES} defaultValue={p?.approvalType} />
        <Field label="Approval number" name="approvalNumber" defaultValue={p?.approvalNumber} />
        <div className="sm:col-span-2">
          <Check
            label="Approval verified by our team"
            name="approvalVerified"
            defaultChecked={p?.approvalVerified}
            hint="Only tick after checking the documents. The approval badge is shown publicly only when this is ticked."
          />
        </div>
      </Card>

      {!isLand && (
        <Card title="Construction">
          <Select label="Construction stage" name="constructionStage" options={CONSTRUCTION_STAGES} value={stage} onChange={setStage} />
          <Field
            label="Completed (%)"
            name="constructionPercent"
            type="number"
            defaultValue={p?.constructionPercent}
            hint={stage === "completed" ? "Leave empty for 100%" : "e.g. 60"}
          />
        </Card>
      )}

      <Card title="Location">
        <Field label="Area / locality" name="locality" defaultValue={p?.locality} required />
        <Field label="City" name="city" defaultValue={p?.city ?? "Chennai"} required />
        <Field label="District" name="district" defaultValue={p?.district} />
        <Field label="PIN code" name="pincode" inputMode="numeric" defaultValue={p?.pincode} />
        <Field label="Address" name="address" defaultValue={p?.address} wide />
        <Field label="Google Maps link" name="mapsUrl" type="url" defaultValue={p?.mapsUrl} wide placeholder="https://maps.app.goo.gl/…" />
        <Field
          label="Latitude"
          name="lat"
          inputMode="decimal"
          defaultValue={p?.lat != null ? p.lat.toFixed(6) : ""}
          placeholder="Filled automatically"
          hint="Used for the “properties near you” feature. Leave empty and it is worked out from the map link or area."
        />
        <Field label="Longitude" name="lng" inputMode="decimal" defaultValue={p?.lng != null ? p.lng.toFixed(6) : ""} placeholder="Filled automatically" />
        <div className="sm:col-span-2">
          <Check
            label="Show exact address & map pin to visitors"
            name="showExactLocation"
            defaultChecked={p?.showExactLocation}
            hint="If unticked, visitors only see the locality and city."
          />
        </div>
      </Card>

      <LandmarkEditor initial={p?.landmarks ?? []} />

      <Card title="Status & visibility">
        <Select label="Status" name="status" options={PROPERTY_STATUSES} empty={null} defaultValue={p?.status ?? "available"} />
        <div />
        <Check label="Show on website" name="isPublished" defaultChecked={p ? p.isPublished : true} hint="Untick to keep it as a hidden draft" />
        <Check label="Featured" name="isFeatured" defaultChecked={p?.isFeatured} hint="Shown first on the home page" />
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line/60 bg-bg/90 px-4 py-4 backdrop-blur-xl md:mx-0 md:rounded-3xl md:border">
        <div className="space-y-3">
          <FormMessage state={state} />
          <PendingButton
            pending={pending}
            className="btn btn-primary btn-lg w-full md:w-auto"
            pendingText={creating === "uploading" ? `Uploading photos… ${uploadPct}%` : "Saving…"}
          >
            {p ? "Save changes" : picked.length ? `Create property & upload ${picked.length} file${picked.length === 1 ? "" : "s"}` : "Create property"}
          </PendingButton>
        </div>
      </div>
    </form>
  );
}
