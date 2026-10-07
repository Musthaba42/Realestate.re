/* eslint-disable no-console */
// Imports ONE property from a folder into MongoDB (details + photos + videos).
//
//   node --env-file=.env scripts/import-property.cjs datas/1
//
// The folder must contain property.json with the property details and the list of
// files to publish, e.g.
//   { "title": "...", "type": "land", "locality": "...", "city": "...", "price": 123, "totalSqft": 1000,
//     "media": [ { "file": "photo.jpeg", "category": "exterior" }, { "file": "clip.mp4", "category": "walkthrough" } ] }
// Photos are resized (max 1920px, JPEG) before saving. Files not listed in "media" are ignored.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");

const FACINGS = ["east", "west", "north", "south", "north-east", "north-west", "south-east", "south-west"];
const TYPES = ["land", "house", "apartment", "commercial"];
const STATUSES = ["available", "new", "under_construction", "ready_to_move", "coming_soon", "reserved", "sold", "not_available"];
const CATEGORIES = ["exterior", "interior", "road", "construction", "walkthrough", "promo"];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function detect(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image";
  if (buf.toString("ascii", 4, 8) === "ftyp") return "video";
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "video";
  return null;
}

function fail(msg) {
  console.error("ERROR:", msg);
  process.exit(1);
}

async function main() {
  const dir = path.resolve(process.argv[2] || "");
  if (!process.argv[2] || !fs.existsSync(path.join(dir, "property.json"))) fail("Usage: node --env-file=.env scripts/import-property.cjs <folder with property.json>");
  const spec = JSON.parse(fs.readFileSync(path.join(dir, "property.json"), "utf8"));

  // ---- validate ----
  if (!spec.title || !spec.locality || !spec.city) fail("title, locality and city are required");
  if (!TYPES.includes(spec.type)) fail("type must be one of " + TYPES.join(", "));
  if (!(spec.price > 0) || !(spec.totalSqft > 0)) fail("price and totalSqft must be positive numbers");
  if (spec.facing && !FACINGS.includes(spec.facing)) fail("bad facing");
  const status = spec.status || "available";
  if (!STATUSES.includes(status)) fail("bad status");
  if (spec.mapsUrl && !/^https?:\/\//i.test(spec.mapsUrl)) fail("mapsUrl must start with https://");
  for (const m of spec.media || []) {
    const src = m.file || m.frameFrom;
    if (!src || !fs.existsSync(path.join(dir, src))) fail("file not found: " + src);
    if (m.category && !CATEGORIES.includes(m.category)) fail("bad category for " + src);
  }

  const db = new PrismaClient();
  const client = await new MongoClient(process.env.DATABASE_URL).connect();
  const mdb = client.db();
  const bucket = new GridFSBucket(mdb, { bucketName: "media" });
  const stored = [];

  try {
    const dup = await db.property.findFirst({ where: { title: spec.title, locality: spec.locality } });
    if (dup) fail(`Already imported as ${dup.code}. Delete it in Admin first if you want to import again.`);

    // ---- store files in GridFS ----
    let totalBytes = 0;
    for (const [i, m] of (spec.media || []).entries()) {
      let buf;
      if (m.frameFrom) {
        // Use a still frame of a video as a photo (needs ffmpeg: set FFMPEG_PATH).
        const tmp = path.join(require("os").tmpdir(), `frame-${Date.now()}-${i}.jpg`);
        const r = require("child_process").spawnSync(process.env.FFMPEG_PATH || "ffmpeg", ["-y", "-ss", String(m.at ?? 1), "-i", path.join(dir, m.frameFrom), "-frames:v", "1", "-q:v", "2", tmp], { encoding: "utf8" });
        if (r.status !== 0 || !fs.existsSync(tmp)) fail("could not extract a frame from " + m.frameFrom);
        buf = fs.readFileSync(tmp);
        fs.unlinkSync(tmp);
      } else {
        buf = fs.readFileSync(path.join(dir, m.file));
      }
      const label = m.file || `frame of ${m.frameFrom}`;
      const kind = detect(buf);
      if (!kind) fail("unsupported file type: " + label);
      let ext = "mp4";
      let mime = "video/mp4";
      if (kind === "image") {
        buf = await sharp(buf).rotate().resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
        ext = "jpg";
        mime = "image/jpeg";
      } else if (buf.length > 100 * 1024 * 1024) fail("video too large (>100 MB): " + label);
      const id = new ObjectId();
      await new Promise((resolve, reject) => {
        const up = bucket.openUploadStreamWithId(id, `properties/${id.toHexString().slice(-8)}.${ext}`, {
          metadata: { kind, mime, private: false, folder: "properties" },
        });
        up.once("finish", resolve);
        up.once("error", reject);
        up.end(buf);
      });
      totalBytes += buf.length;
      stored.push({ id, url: `/media/${id.toHexString()}.${ext}`, kind, category: m.category || (kind === "video" ? "walkthrough" : "exterior"), order: i });
      console.log(`  stored ${label} -> ${kind}, ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // ---- create the property ----
    const counter = await mdb.collection("Counter").findOneAndUpdate({ _id: "property" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    const number = 1000 + (counter.seq ?? 1);
    const code = `P-${number}`;
    const base = spec.title.toLowerCase().includes(spec.locality.toLowerCase()) ? spec.title : `${spec.title} ${spec.locality}`;
    const slug = `${slugify(base) || "property"}-${code.toLowerCase()}`;
    const searchText = [spec.title, spec.locality, spec.city, spec.district, spec.pincode, spec.subType, spec.address].filter(Boolean).join(" ").toLowerCase();
    let coverSet = false;

    const created = await db.property.create({
      data: {
        number,
        code,
        slug,
        title: spec.title,
        type: spec.type,
        subType: spec.subType ?? null,
        locality: spec.locality,
        city: spec.city,
        district: spec.district ?? null,
        pincode: spec.pincode ?? null,
        address: spec.address ?? null,
        mapsUrl: spec.mapsUrl ?? null,
        showExactLocation: Boolean(spec.showExactLocation),
        price: Math.round(spec.price),
        isNegotiable: spec.isNegotiable !== false,
        totalSqft: spec.totalSqft,
        builtUpSqft: spec.builtUpSqft ?? null,
        carpetSqft: spec.carpetSqft ?? null,
        bhk: spec.bhk ?? null,
        bedrooms: spec.bedrooms ?? null,
        bathrooms: spec.bathrooms ?? null,
        floors: spec.floors ?? null,
        floorNo: spec.floorNo ?? null,
        parking: spec.parking ?? null,
        balcony: spec.balcony ?? null,
        kitchen: Boolean(spec.kitchen),
        livingRoom: Boolean(spec.livingRoom),
        facing: spec.facing ?? null,
        constructionStage: spec.constructionStage ?? null,
        constructionPercent: spec.constructionPercent ?? null,
        roadType: spec.roadType ?? null,
        roadNote: spec.roadNote ?? null,
        approvalType: spec.approvalType ?? null,
        approvalNumber: spec.approvalNumber ?? null,
        approvalVerified: Boolean(spec.approvalVerified),
        loanAvailable: Boolean(spec.loanAvailable),
        loanBanks: spec.loanBanks ?? null,
        loanPercent: spec.loanPercent ?? null,
        status,
        isFeatured: Boolean(spec.isFeatured),
        isPublished: spec.isPublished !== false,
        description: spec.description ?? null,
        searchText,
        source: "team",
        media: {
          create: stored.map((s) => {
            const isCover = s.kind === "image" && !coverSet;
            if (isCover) coverSet = true;
            return { kind: s.kind, category: s.category, url: s.url, isCover, sortOrder: s.order };
          }),
        },
      },
    });

    console.log(`\nDONE: ${code} "${spec.title}" (${(totalBytes / 1024 / 1024).toFixed(2)} MB of media)`);
    console.log(`  id:   ${created.id}`);
    console.log(`  page: /properties/${slug}`);
  } finally {
    await db.$disconnect();
    await client.close();
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
