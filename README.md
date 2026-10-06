# Golden Groups – Real Estate Website

The website and team dashboard for Golden Groups: selling land, houses, apartments and commercial property.

**Tech:** Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · **MongoDB Atlas** (Prisma + GridFS for photos)

Everything is stored in MongoDB: properties, leads, owner submissions, team, settings **and all uploaded photos, videos and documents**. Nothing is saved on the server's disk.

---

## 1. Connect MongoDB Atlas (one time)

1. Sign in at https://cloud.mongodb.com and create a free **M0** cluster.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add your server's IP address. While testing you can use `0.0.0.0/0`.
4. **Database → Connect → Drivers** → copy the connection string.
5. Paste it into `.env` as `DATABASE_URL`, and add the database name `/goldengroups` before the `?`:

   ```
   DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/goldengroups?retryWrites=true&w=majority"
   ```

   If your password contains special characters (`@ : / ? # %`), URL-encode them. For example, `@` becomes `%40`.

---

## 2. Run it

You need **Node.js 20 or newer**.

```bash
npm install
npm run setup      # first time only: creates collections/indexes + your admin login + settings
npm run dev
```

- Website: http://localhost:3000
- Log in at http://localhost:3000/login. The **admin** account is created by `npm run setup` from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` and opens the team dashboard at `/admin`. Change its password in **Admin → Settings**.

**Without Atlas (offline development):** run `npm run db:local` in a second terminal. It starts a local MongoDB on your computer, with data kept in `.mongo-data/`. Then use the local `DATABASE_URL` shown in `.env.example`.

---

## 3. Accounts and roles

| Role | How you get it | What it can do |
|------|----------------|----------------|
| **Visitor** (no account) | – | Browse properties, tap "I am Interested", loan and contact forms |
| **User** (customer) | Sign up at `/signup` with name, mobile number and a password | Everything a visitor can, plus **sell a property** and follow its approval status under **My account** (`/account`) |
| **Admin** | Created only by `npm run setup` (there is exactly one) | The team dashboard: properties, leads, owner submissions, team, settings |

- Sign-ups are always the **User** role. Nobody can become admin through the website.
- The admin area (`/admin`) and its upload API refuse everyone who is not the admin, and owners' private photos can only be opened by the admin.
- When a user submits a property it appears in **Admin → Seller Requests**. The admin chooses **Approve & publish** (it goes live for everyone) or **Reject**, with an optional reason. The user sees the decision and the reason under **My account**.

## 4. Properties near you

- The home page has a **Properties near you** section and the Find Property page has a **Near me** button. They ask the browser for the visitor's location **only when tapped** (or automatically if the visitor already allowed it). The location is used for that one request and is **never stored**.
- Each property has a map position (latitude/longitude). It is worked out from the Google Maps link, or, if there is no link, from the area name (accurate to the area, not the plot). You can type exact latitude/longitude in **Admin → Properties → Location**.
- A property with no position does not appear in "near you". The edit page shows a yellow warning when this happens.
## 5. Adding properties (team)

**Admin → Properties → Add property**

1. Tap **Add photos** and choose all the photos (and videos) at once. The first photo becomes the cover. Photos are resized automatically.
2. Fill in the details. Only the fields marked * are required.
3. Press **Create property & upload…**. Everything is saved in one step and the property goes live.

Afterwards you can reorder photos, change the cover, add YouTube links and upload private approval documents.

**Marking a property as sold:** in the **Properties** list, change the status dropdown to **Sold**. The listing stays on the website with a large **SOLD** stamp on its photos, and the "I am Interested" button changes to "Find Similar".

## 6. Owners selling their property

1. A logged-in user fills in **Sell Your Property** on the website, with photos.
2. It appears in **Admin → Seller Requests** as *Pending Review*. The owner's photos stay private until then.
3. The team opens it, calls the owner if needed, and chooses:
   - **Approve & publish:** the property goes live on the website for everyone, with the owner's photos. The owner's name and phone are never shown.
   - **Reject:** it stays off the website.

---

## 7. Before going live (checklist)

1. **Admin → Settings:** set the real **phone** and **WhatsApp number** (buyer leads are sent there), address, email, Instagram/Facebook links and RERA number.
2. **Admin → Team:** add team members with photos.
3. **Admin → Properties:** add your properties.
4. `.env` on the server:
   - `DATABASE_URL`: your Atlas connection string
   - `NEXT_PUBLIC_SITE_URL`: your real domain, for example `https://goldengroups.in`
   - `AUTH_SECRET`: a long random string (one was generated for you)
5. Optional instant alerts to your phone when a lead arrives:
   - **Telegram (free):** set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
   - **Email (Resend):** set `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` and `NOTIFY_EMAIL_FROM`.

---

## 8. Deploying

Since all data is in Atlas, the site can run on any Node.js host: a VPS, Render, Railway, or Vercel.

```bash
npm ci
npm run setup        # first time only
npm run build
npm run start
```

- Use **HTTPS**. Admin login cookies require it in production.
- On the hosting side, allow uploads of at least 50 MB. For Nginx, use `client_max_body_size 100M;`.
- **Vercel** limits each upload request to about 4.5 MB. Photos are resized and uploaded one at a time from the dashboard, so they work. Use **YouTube links** for videos there.
- In Atlas, add your server's IP under **Network Access**, and turn on backups (paid tiers) or export the data regularly.

---

## 9. Useful commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start in development mode |
| `npm run build` / `npm run start` | Production build and start |
| `npm run setup` | Create indexes + admin login + settings (safe to re-run) |
| `npm run db:local` | Optional local MongoDB for offline development |
| `npm run db:studio` | Visual database browser |
| `npm run typecheck` | TypeScript check |

---

## 10. Project structure

```
prisma/schema.prisma        Database models (MongoDB)
prisma/seed.ts              First admin login + default settings (no demo data)
scripts/local-mongo.mjs     Optional local MongoDB for development
public/logo.png             Golden Groups emblem (also used as the browser icon)
src/app/(site)/             Public website pages
src/app/admin/              Team dashboard (admin only) and its server actions (actions.ts)
src/app/api/leads           "I am Interested" / loan / contact / no-results leads
src/app/api/sell            Sell Your Property submissions (photos stored privately)
src/app/api/admin/upload    Dashboard photo/video/document uploads
src/app/media/[...path]     Serves files from MongoDB GridFS (private files: admin only)
src/lib/                    Database, MongoDB/GridFS, auth + roles, map positions (geo.ts), formatting (₹ Lakh/Crore), notifications
```
