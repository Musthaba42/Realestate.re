# Real Estate Platform — Project Plan (v2)

> Status: Planning · Last updated: 2026-10-02
> Design reference: `ui image _Desighn.jpeg` (dark, mobile-first property app UI)

---

## 0. What Changed From v1 (Read This First)

These are the client's changes to the original workflow. They override anything in the v1 concept.

| # | Area | v1 (old) | v2 (new) |
|---|------|----------|----------|
| 1 | Buyer flow | Buyer fills a long "Requirement Form" with personal details first | Buyer simply **Selects / Finds a Property** — **no personal details needed** to search or browse |
| 2 | Buyer search input | Many fields (sq.ft min/max, price min/max, BHK, facing…) | **Area/location is enough.** Property type + area are the main inputs; everything else is an optional "More filters" panel |
| 3 | Lead capture | Requirement form submission | Buyer views a property → if interested, taps **"I am Interested"** button at the bottom → enters name + phone → details are **sent to our number** (WhatsApp) and saved for the team |
| 4 | Price (Sell form + listings) | Expected price + price range | **Only a fixed price.** No price range. Shown with a "Slightly negotiable" note when applicable |
| 5 | Owner details (Sell form) | Name, phone, email, bio, preferred contact method | **Reduced to the minimum** (see Open Question Q1). Owner details are **never shown publicly** |

Unchanged from v1: Sell Your Property, Admin dashboard, detailed property info (construction %, approvals, road, loan, facing, Google Maps, photos/videos), team section, loan-assistance disclaimer.

---

## 1. Project Summary

A real-estate **sales and lead-generation website** for selling:

- **Land** — residential/commercial land and plots
- **Houses** — individual houses, apartments, flats, new/under-construction homes
- **Commercial** — commercial buildings and properties

It has three layers:

```
PUBLIC WEBSITE          → buyers browse & find properties (no sign-up)
        ↓
LEAD CAPTURE            → "I am Interested" / Sell Property / Loan enquiry
        ↓
ADMIN / TEAM DASHBOARD  → team adds properties, reviews sellers, handles leads
```

**Core principle (v2):** Make browsing frictionless. Ask for contact details **only at the moment the buyer shows interest** in a specific property. Every lead must reach the team's phone immediately.

---

## 2. User Types

| User | Login? | Can do |
|------|--------|--------|
| **Buyer / Visitor** | No | Browse, search by type + area, filter, view property details, tap "I am Interested", call/WhatsApp, request loan help |
| **Property Owner / Seller** | No | Submit property via "Sell Your Property" form with photos/videos and location |
| **Admin / Team** | Yes (email + password) | Manage properties, review seller submissions, manage leads, team members, site content |

---

## 3. Site Map

```
HOME
├── FIND PROPERTY  (/properties)
│   ├── Filter: Type → Land | House | Apartment | Commercial
│   ├── Filter: Area / Locality   ← main input
│   └── More filters (optional): Budget, Sq.ft, BHK, Facing, Status
│
├── PROPERTY DETAILS  (/properties/[slug])
│   ├── Photo gallery + videos
│   ├── Fixed price (+ negotiable note), price/sq.ft
│   ├── Area, BHK, facing, construction status
│   ├── Approval, road status, bank-loan info
│   ├── View on Google Maps
│   └── [ I am Interested ]  ← sticky bottom button
│
├── SELL YOUR PROPERTY  (/sell)
├── LOAN ASSISTANCE     (/loan)
├── ABOUT US            (/about)
├── OUR TEAM            (/team)
├── GALLERY             (/gallery)  — photos & videos, Instagram/Facebook links
└── CONTACT US          (/contact)

ADMIN  (/admin — login required)
├── Dashboard (counts: new leads, pending seller requests, live properties)
├── Properties      — add / edit / delete / status / media
├── Interested Leads — from "I am Interested"
├── Seller Requests — from "Sell Your Property"
├── Loan Enquiries
├── Team Members
└── Site Settings   — business phone/WhatsApp, address, social links, hero text
```

---

## 4. Key Workflows

### 4.1 Buyer — Find Property (NEW, no personal details)

```
Visitor opens website
        ↓
Taps "Find Property"  (or picks a type card on Home)
        ↓
Selects Property Type  (Land / House / Apartment / Commercial)
        ↓
Selects / types Area   (e.g. Urapakkam, Guduvanchery…)   ← enough to search
        ↓
(Optional) More filters: budget, sq.ft, BHK, facing, status
        ↓
Sees matching property cards
        ↓
Opens a property → views photos, video, price, details, map
        ↓
Interested?  ── No ──→ back to results
        │
       Yes
        ↓
Taps  [ I am Interested ]  (sticky at bottom)
        ↓
Small popup: Name*, Phone*, (optional) preferred call time, message
        ↓
Submit
        ↓
 ① Lead saved in database (linked to that property)
 ② Team notified on OUR NUMBER (WhatsApp) with property + buyer details
 ③ Buyer sees "Thank you — our team will call you shortly"
        ↓
Team calls buyer → site visit → loan help (if needed) → documentation → sale
```

**Rules**
- No sign-up, no login, no personal details before this point.
- The popup asks only **Name** and **Phone** as required fields (10-digit Indian mobile, `+91`).
- The lead record automatically includes: property ID, title, price, area, and page link — the buyer does not retype anything.
- Also show secondary buttons next to it: **Call** (`tel:`) and **WhatsApp** (direct chat).

**No-results fallback (recommended):** if a search returns nothing, show
"Didn't find it? Leave your number and we'll find one for you in *{area}*" → Name + Phone. This keeps the "we find it for you" value of the old requirement form without forcing it on everyone. The search filters used are saved with the lead.

### 4.2 How a lead reaches "our number"

| Phase | Method | Notes |
|-------|--------|-------|
| **MVP** | Save lead in DB **+** open WhatsApp click-to-chat (`wa.me/<business number>`) with a pre-filled message **+** email/Telegram alert to team | Free, no approval needed. Buyer presses "Send" in WhatsApp. Even if they don't, the lead is already saved in the dashboard and the email alert has gone out. |
| **Phase 2** | WhatsApp Business Cloud API sends an automatic message to the team number (and an auto-confirmation to the buyer) | Needs Meta Business verification + approved message templates; small per-message cost. |

Pre-filled WhatsApp message example:

```
Hi, I am interested in this property.
Property: 2 BHK House – Urapakkam (ID: P-1042)
Price: ₹40,00,000
Link: https://<domain>/properties/2bhk-house-urapakkam-p1042
Name: Ravi
Phone: 98XXXXXXXX
```

### 4.3 Sell Your Property (UPDATED)

```
Owner taps "Sell Your Property"
        ↓
Owner details (minimal — see Q1)
        ↓
Property details  (type, area/locality, sq.ft, FIXED expected price, negotiable?, BHK, facing…)
        ↓
Location  (address, locality, city, district, PIN, Google Maps link)
        ↓
Upload photos / videos
        ↓
Submit → saved as "Pending Review" + team notified
        ↓
Team reviews → verifies → contacts owner
        ↓
Approved / Rejected / Needs more info
        ↓
Approved → admin converts it into a live listing (one click, data pre-filled)
        ↓
Buyers see it → "I am Interested" → team handles the sale
```

### 4.4 Loan Assistance

- Simple form on `/loan` and a "Need a loan?" button on every property with `bank_loan_available = true`.
- Fields: Name*, Phone*, property (auto-filled if coming from a property page), approximate amount available, loan required (auto-calculated = price − available amount).
- Always shows the disclaimer (Section 9).

### 4.5 Admin

```
Admin login → Dashboard
  ├─ New leads today / pending seller requests / live listings
  ├─ Properties: add, edit, delete, change status, upload media, set featured
  ├─ Interested Leads: view, call, WhatsApp, set status (New → Contacted → Visit → Closed / Lost), add notes
  ├─ Seller Requests: view, approve → "Create listing", reject, needs-info
  ├─ Loan Enquiries
  ├─ Team Members
  └─ Site Settings
```

---

## 5. Form Specifications

### 5.1 "I am Interested" popup
| Field | Type | Required |
|-------|------|----------|
| Name | text | ✅ |
| Phone | tel (10 digits, +91) | ✅ |
| Preferred call time | select: Morning / Afternoon / Evening / Anytime | ❌ |
| Message | textarea | ❌ |
| *Property ID, page URL* | hidden, auto | auto |

### 5.2 Sell Your Property
**Owner details** (minimal — pending Q1)
| Field | Required |
|-------|----------|
| Owner name | ✅ |
| Phone / WhatsApp number | ✅ (needed for the team to call back; never shown publicly) |

_Removed in v2: email, bio, preferred contact method._

**Property details**
| Field | Type | Required |
|-------|------|----------|
| Property type | Land / House / Apartment / Commercial | ✅ |
| Area / locality | text + suggestions | ✅ |
| City, District, PIN | text | ✅ City, others optional |
| Address | textarea | ❌ |
| Google Maps link | url | ❌ (recommended) |
| Total sq.ft | number | ✅ |
| **Expected price (fixed)** | number (₹) | ✅ |
| Negotiable | Yes / No | ✅ (default: Yes) |
| BHK | 1 / 2 / 3 / 4 / 5+ (only for House/Apartment) | conditional |
| Facing | E / W / N / S (+ NE/NW/SE/SW later) | ❌ |
| Construction status | Ready / Under construction (+%) / Not started | conditional |
| Road info | select + custom text | ❌ |
| Approval | DTCP / CMDA / Other / Not sure | ❌ |
| Bank loan available? | Yes / No / Not sure | ❌ |
| Description | textarea | ❌ |
| Photos | up to 15 images, max 10 MB each | ❌ (recommended) |
| Videos | up to 2 videos, max 100 MB each — or paste a YouTube/Drive link | ❌ |

> No "price range" field anywhere. One fixed price.

### 5.3 Find Property filters
| Filter | Default view | Notes |
|--------|--------------|-------|
| Property type | Visible (pill buttons) | All / Land / House / Apartment / Commercial |
| Area / locality | Visible (search box) | Main input; autocomplete from localities that have listings |
| Budget (max) | Under "More filters" | Slider or presets: ₹20L, ₹40L, ₹60L, ₹1Cr+ |
| Sq.ft (min–max) | Under "More filters" | |
| BHK | Under "More filters" | Only shown for House/Apartment |
| Facing | Under "More filters" | |
| Status | Under "More filters" | Ready to Move / Under Construction / New |

---

## 6. Property Listing Data (what the team enters)

**Basic:** title, type, sub-type (plot/villa/flat…), area/locality, city, district, PIN, description
**Price:** fixed price (₹), negotiable (Yes/No), price per sq.ft (**auto-calculated**)
**Size:** total sq.ft / land area, built-up area, carpet area (optional)
**Home specs (House/Apartment):** BHK, bedrooms, bathrooms, floors, floor number, parking, balcony, kitchen, living room
**Facing:** E / W / N / S (later: NE / NW / SE / SW)
**Construction:** status (Not Started · Planning · Foundation · Structure · In Progress · Completed) + editable % (0–100)
**Approval:** type (DTCP / CMDA / Other), approval number, document upload (admin-only), **verified checkbox** — the badge shows publicly only when verified
**Road:** preset (Main Road / 40 ft / 30 ft / 20 ft / Internal / Tar / Concrete / Proposed / Under construction) + custom text
**Loan:** bank loan available (Y/N), banks, approx financing % (e.g. "up to 90%*"), loan enquiry button
**Status:** Available · New · Featured · Under Construction · Ready to Move · Reserved · Sold · Coming Soon · Not Available
**Location:** Google Maps link, show exact location (Y/N) — if No, show only locality
**Media:** cover image, gallery (exterior / interior / road / construction), videos (walkthrough / construction / location / promo)

**Price display format (Indian):**
```
₹40,00,000   → shown as "₹40 Lakhs"
₹1,25,00,000 → shown as "₹1.25 Cr"
Area: 1,200 sq.ft · ₹3,333/sq.ft · Slightly negotiable
```

---

## 7. Database Design

```
properties
  id, slug, code (P-1042), title, type, sub_type,
  locality, city, district, pincode, address, maps_url, show_exact_location,
  price, is_negotiable, total_sqft, built_up_sqft, carpet_sqft,
  bhk, bedrooms, bathrooms, floors, floor_no, parking, balcony,
  facing, construction_stage, construction_percent,
  road_type, road_note,
  approval_type, approval_number, approval_verified,
  loan_available, loan_banks, loan_percent,
  status, is_featured, is_published,
  description, source ('team' | 'seller_request'), seller_request_id,
  created_by, created_at, updated_at

property_media
  id, property_id, kind ('image' | 'video' | 'youtube'),
  category ('exterior' | 'interior' | 'road' | 'construction' | 'walkthrough' | 'promo'),
  url, is_cover, sort_order

property_documents          -- private, admin only
  id, property_id, name, file_url, uploaded_at

leads                       -- "I am Interested" + no-results + contact form
  id, source ('interested' | 'no_results' | 'contact' | 'loan'),
  property_id (nullable), name, phone, preferred_time, message,
  search_filters (json, for no_results), loan_amount_available,
  status ('new' | 'contacted' | 'site_visit' | 'negotiation' | 'closed' | 'lost'),
  assigned_to, notes, created_at

seller_requests
  id, owner_name, owner_phone,
  (all property fields as above), media (json),
  status ('pending' | 'needs_info' | 'approved' | 'rejected'),
  admin_notes, created_at

team_members
  id, name, role, bio, photo_url, phone, whatsapp, email, show_contact, sort_order

site_settings               -- single row
  business_name, phone, whatsapp_number, email, address, maps_url,
  instagram_url, facebook_url, hero_title, hero_subtitle, about_text

admin_users                 -- handled by auth provider
  id, email, name, role ('owner' | 'staff')
```

---

## 8. UI / Design Direction (from reference image)

The reference (`ui image _Desighn.jpeg`) shows a **dark, modern, mobile-first** property app. Translate it to the website like this:

| Reference element | Our website |
|-------------------|-------------|
| Greeting + search bar "Austin, TX" with filter icon | Home hero: search box **"Search area (e.g. Urapakkam)"** + filter icon |
| Pill tabs: All · Price · Property · Bed/Bath | Pill tabs: **All · Land · House · Apartment · Commercial** |
| Large image cards with "For sale" badge, price, address, beds/baths/sq.ft chips | Property cards: status badge (Available / Under Construction 60%), **₹ price**, locality, chips: **BHK · sq.ft · facing** |
| Detail page: big hero image, photo counter "1/25", thumbnail strip | Gallery with counter, swipe on mobile, lightbox, video tab |
| Price + "Est. $1,524/mo" | Price + **"Loan available up to 90%*"** line |
| Info tiles: Property type · Year built | Info tiles: **Type · Facing · Road · Approval · Construction %** |
| Bottom buttons: "Contact an Agent" / "Schedule Tour" | Sticky bottom bar: **[ Call ] [ I am Interested ]** (primary, white/accent) |
| Filter screen: Buy/Rent, Property type dropdown, price wheel, Bedrooms chips | "More filters" sheet: Type, Budget, Sq.ft, **BHK chips (Any · 1 · 2 · 3 · 4+)**, Facing |

**Design tokens (starting point)**
- Background: charcoal `#2B3038`, surface `#363C45`, border `#454C56`
- Text: white `#FFFFFF`, muted `#A3AAB4`
- Primary button: white with dark text (as in reference); accent green `#3DD68C` for "Available" dot
- Radius: 20–24px cards, full-pill buttons/chips
- Font: Inter / Plus Jakarta Sans
- Optional light theme later; dark theme is the default per the reference

**Mobile-first:** most Indian buyers will come from Instagram/Facebook on phones. Design every page at 375px width first, then desktop.

---

## 9. Legal & Trust Rules (must follow)

1. **Loan disclaimer** on every loan mention:
   _"\*Loan/financing up to 90% is subject to lender approval, applicant eligibility, property valuation and documentation. We assist with the process; we do not guarantee approval."_
2. **Approvals:** show a DTCP/CMDA badge **only** when `approval_verified = true` (admin checked the document).
3. **Owner privacy:** owner name/phone from seller requests are **never** shown on the public site. All buyer contact goes through our team.
4. **Exact location:** show the full map pin only when `show_exact_location = true`; otherwise show locality only.
5. **Consent text** under every form: _"By submitting, you agree to be contacted by our team by call/WhatsApp."_ + Privacy Policy page.
6. **RERA:** if the business sells registered projects or acts as an agent in Tamil Nadu, display the RERA registration number(s) where required. (Confirm with the business — Q5.)

---

## 10. Tech Stack (recommended)

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend + backend | **Next.js (App Router) + TypeScript** | SEO-friendly property pages, one codebase for site + admin |
| Styling | **Tailwind CSS** + shadcn/ui | Fast to build the reference design, consistent components |
| Database + Auth + File storage | **Supabase** (PostgreSQL) | Admin login, row-level security, image/video storage, generous free tier |
| Images | Supabase Storage (or Cloudinary for auto-resizing) | Compress + resize on upload |
| Videos | **YouTube (unlisted) embeds** for team videos; direct upload only for seller submissions | Saves storage/bandwidth cost |
| Hosting | **Vercel** | Free/low cost, automatic deploys |
| Notifications | WhatsApp click-to-chat + email (Resend) in MVP → WhatsApp Cloud API in Phase 2 | |
| Spam protection | Cloudflare Turnstile + rate limiting on public forms | Stops fake leads |
| Analytics | Google Analytics 4 / Vercel Analytics | Track which properties get interest |
| Domain | `.in` or `.com` | |

---

## 11. Development Phases

### Phase 0 — Setup & Content (Week 1)
- [ ] Confirm open questions (Section 13)
- [ ] Collect: logo, business name, phone/WhatsApp number, address, social links, team photos + bios, 5–10 real properties with photos/videos
- [ ] Domain + hosting + Supabase project
- [ ] Final design mockups (Home, Results, Property Detail, Sell form, Admin) based on reference

### Phase 1 — MVP (Weeks 2–5)
- [ ] Database tables + admin auth
- [ ] **Admin:** add/edit/delete property, media upload, status, construction %, featured
- [ ] **Home page:** hero search (type + area), featured properties, services, why us, team preview, contact
- [ ] **Find Property page:** type pills, area search, "More filters", result cards
- [ ] **Property detail page:** gallery, video, all details, map button, loan line + disclaimer
- [ ] **"I am Interested"** sticky button → popup → save lead → WhatsApp + email alert
- [ ] Call / WhatsApp buttons
- [ ] **Sell Your Property** form (fixed price, minimal owner details, uploads)
- [ ] **Admin:** Interested Leads + Seller Requests lists with status + notes; "Approve → Create listing"
- [ ] Loan enquiry form
- [ ] About, Team, Gallery, Contact pages, Privacy Policy
- [ ] SEO basics: page titles, Open Graph images (so WhatsApp/Instagram link previews show the property photo), sitemap

### Phase 2 — Polish & Launch (Week 6)
- [ ] Mobile testing on real Android phones (low-end + mid-range)
- [ ] Image optimization, page speed (target: Lighthouse ≥ 90 on mobile)
- [ ] Spam protection, form validation, error states
- [ ] Load real listings, train team on admin dashboard
- [ ] Launch + share on Instagram/Facebook

### Phase 3 — After Launch (future)
- WhatsApp Cloud API automatic alerts + buyer auto-reply
- Auto-matching: saved "no-results" searches → notify team when a matching property is added
- EMI calculator, loan eligibility estimator
- Site-visit booking with date/time slots
- Map-based search
- Property comparison, recently viewed
- Lead assignment to team members, follow-up reminders, simple CRM analytics
- Tamil language version
- Mobile app (PWA first)

---

## 12. MVP Acceptance Checklist

- [ ] A visitor can find properties by **type + area** without entering any personal details.
- [ ] Every property page has a visible **"I am Interested"** button at the bottom on mobile.
- [ ] Submitting it with name + phone saves the lead **and** the team receives it on the business WhatsApp/email within seconds, including the property name, ID, price and link.
- [ ] Sell form has **one fixed price** field + negotiable toggle — no price range anywhere on the site.
- [ ] Owner contact details never appear on the public site.
- [ ] Approval badge appears only for verified properties; loan disclaimer appears wherever loan % is shown.
- [ ] Admin can add a full property (with photos, video, map link, construction %) in under 5 minutes.
- [ ] Admin can approve a seller request and turn it into a listing without retyping.
- [ ] All pages work well on a 375px-wide phone screen.

---

## 13. Open Questions (need client confirmation)

| # | Question | Current assumption |
|---|----------|--------------------|
| Q1 | The note said "(Phone / Owner) details are not needed" — does this mean (a) don't collect owner details at all, (b) collect only name + phone, or (c) collect them but don't show them on the listing? | **(b) + (c):** collect only name + phone (team must be able to call the owner back) and never show them publicly |
| Q2 | Part of the recording was unclear after "once the property he searched for comes up…" — anything else should happen between viewing a property and "I am Interested"? (e.g. shortlist / save) | No extra step in MVP |
| Q3 | "Send to our number" — one number for all leads, or different numbers per property/team member? | One business WhatsApp number (editable in Site Settings) |
| Q4 | Keep the "no results → leave your number" fallback? | Yes (recommended) |
| Q5 | Is the business RERA-registered? Number to display? | To be provided |
| Q6 | Should rentals be supported (reference design shows Buy/Rent)? | **No** — sales only, per the business scope |
| Q7 | Which localities/cities are covered at launch? | Chennai suburbs (e.g. Urapakkam) — list to be provided |
| Q8 | Is "Negotiable" shown to buyers as "Slightly negotiable", or hidden and handled by the team on call? | Show "Slightly negotiable" badge when enabled |

---

## 14. Final Flow (v2 at a glance)

```
                         WEBSITE
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
        BUYER                               SELLER
          │                                   │
  Type + Area search                 "Sell Your Property"
  (no personal details)              Name + Phone, property,
          │                          FIXED price, location, media
  View property details                       │
          │                                   │
  [ I am Interested ]                         │
  Name + Phone                                │
          │                                   │
          └─────────────┬─────────────────────┘
                        ↓
          OUR NUMBER (WhatsApp) + ADMIN DASHBOARD
                        │
           Verify · Call · Match · Site visit
                        │
            Loan assistance (if needed)
                        │
              Documentation → Sale
```
