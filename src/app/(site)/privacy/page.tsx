import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { displayPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <div className="container-x max-w-3xl pb-10 pt-6 md:pt-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-muted [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink">
        <section>
          <h2>What we collect</h2>
          <p>
            You can browse all properties without giving any personal details. We only collect information you choose to
            send us — for example your name and phone number when you tap “I am Interested”, request loan assistance,
            submit a property for sale or send us a message. Property owners may also share property details, photos,
            videos and location.
          </p>
        </section>
        <section>
          <h2>How we use it</h2>
          <p>
            We use your details only to contact you about your enquiry by call or WhatsApp, arrange site visits, assist with
            loans and documentation, and verify properties submitted for sale. Owner contact details are never shown on the
            website.
          </p>
        </section>
        <section>
          <h2>Sharing</h2>
          <p>
            We do not sell your information. With your consent, we may share relevant details with banks or housing finance
            companies when you request loan assistance, or with the other party in a property transaction.
          </p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>
            To update or delete your information, contact us at {displayPhone(s.phone)}
            {s.email ? ` or ${s.email}` : ""}.
          </p>
        </section>
        <p className="text-sm text-faint">{s.businessName}</p>
      </div>
    </div>
  );
}
