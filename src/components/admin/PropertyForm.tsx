"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Video, X } from "lucide-react";
import type { Property } from "@prisma/client";
import { savePropertyAction, type FormState } from "@/app/admin/actions";
import { uploadPropertyFiles } from "@/lib/client-image";
import { FormMessage, PendingButton, useFormAction } from "./ui";
import {
  APPROVAL_TYPES,
  BHK_OPTIONS,
  CONSTRUCTION_STAGES,
  FACINGS,
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

type Picked = { file: File; preview: string };

/** Photo/video picker used when adding a new property (uploaded right after saving). */
function NewMediaPicker({ items, setItems }: { items: Picked[]; setItems: React.Dispatch<React.SetStateAction<Picked[]>> }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="card p-5 md:p-6">
      <h2 className="font-bold">Photos & videos</h2>
      <p className="mt-0.5 text-sm text-muted">
        The first photo becomes the cover. Photos are resized automatically. You can add more, reorder and set the cover later.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {items.map((it, i) => (
          <div key={it.preview} className="relative aspect-square overflow-hidden rounded-2xl bg-surface-2">
            {it.file.type.startsWith("video/") ? (
              <div className="grid size-full place-items-center text-xs text-muted">
                <Video className="size-6" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.preview} alt={`Selected ${i + 1}`} className="size-full object-cover" />
            )}
            {i === 0 && !it.file.type.startsWith("video/") && <span className="badge absolute bottom-1.5 left-1.5 text-warn">Cover</span>}
            <button
              type="button"
              className="icon-btn absolute right-1.5 top-1.5 size-7"
              aria-label={`Remove ${it.file.name}`}
              onClick={() => {
                URL.revokeObjectURL(it.preview);
                setItems((prev) => prev.filter((x) => x !== it));
              }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line text-muted transition-colors hover:border-faint hover:text-ink"
        >
          <span className="grid justify-items-center gap-1 text-xs font-medium">
            <ImagePlus className="size-6" /> Add photos
          </span>
        </button>
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

      <Card title="Price" desc="One fixed price. No price range.">
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
        <div className="self-end">
          <Check label="Slightly negotiable" name="isNegotiable" defaultChecked={p ? p.isNegotiable : true} hint="Shows “Slightly negotiable” next to the price" />
        </div>
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

      <Card title="Bank loan">
        <div className="sm:col-span-2">
          <Check label="Bank loan available" name="loanAvailable" defaultChecked={p ? p.loanAvailable : true} />
        </div>
        <Field label="Banks" name="loanBanks" defaultValue={p?.loanBanks} placeholder="e.g. SBI, HDFC, ICICI" />
        <Field label="Financing up to (%)" name="loanPercent" type="number" defaultValue={p?.loanPercent} hint="Leave empty to use the default from Settings" />
      </Card>

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
