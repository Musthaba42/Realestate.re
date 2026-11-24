import type { Metadata } from "next";
import { HomeTrail } from "@/components/site/HomeTrail";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { displayPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <div className="container-x max-w-3xl pb-10 pt-6 md:pt-10">
      <HomeTrail items={[{ label: "Terms of Service" }]} />
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 text-[34px] leading-tight md:text-5xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-faint">These terms apply to your use of the {s.businessName} website.</p>
      <div className="mt-8 space-y-6 leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink">
        <section>
          <h2>1. About this website</h2>
          <p>
            {s.businessName} (“we”, “us”) lists land, houses, apartments and commercial properties for sale and helps buyers and
            owners connect with our team. By using this website you agree to these terms.
          </p>
        </section>
        <section>
          <h2>2. Property information</h2>
          <p>
            We try to keep every listing accurate, but details such as price, area, approvals, road access and availability are
            provided by owners or sellers and can change. Please confirm everything during the site visit and the documentation
            process. A listing is not an offer or a contract. Approval badges (for example DTCP or CMDA) are shown only after our
            team has checked the documents.
          </p>
        </section>
        <section>
          <h2>3. Enquiries and contact</h2>
          <p>
            When you tap “I am Interested” or send a message, you agree that our team may contact you by call or
            WhatsApp about that enquiry. See our <Link href="/privacy" className="text-gold-2 underline">Privacy Policy</Link> for how
            your details are used.
          </p>
        </section>
        <section>
          <h2>4. Accounts</h2>
          <p>
            You can create an account to sell a property. Keep your password private and give us true details. You are responsible for
            activity on your account. We may suspend accounts that are misused.
          </p>
        </section>
        <section>
          <h2>5. Selling a property through us</h2>
          <p>
            Only submit a property that you own or are authorised to sell. Every submission goes only to our admin team. Nothing is posted
            on the website automatically: the admin reviews it, may edit the details, ask for more information or reject it, and
            decides whether and when to publish it. Once published, your photos and videos are shown publicly on the website, while
            your name and phone number are not.
          </p>
        </section>
        <section>
          <h2>6. Acceptable use</h2>
          <p>
            Do not post false or misleading information, upload material you have no right to use, try to break into the website, or
            use it to send spam.
          </p>
        </section>
        <section>
          <h2>7. Limits of our responsibility</h2>
          <p>
            The website is provided “as is”. To the extent allowed by law, we are not liable for losses that result from relying on
            listing information without checking it, or from the website being unavailable.
          </p>
        </section>
        <section>
          <h2>8. Changes and contact</h2>
          <p>
            We may update these terms from time to time; the latest version is always on this page. Questions? Call us on{" "}
            {displayPhone(s.phone)}
            {s.email ? ` or write to ${s.email}` : ""}.
          </p>
        </section>
        <p className="text-sm text-faint">{s.businessName}</p>
      </div>
    </div>
  );
}
