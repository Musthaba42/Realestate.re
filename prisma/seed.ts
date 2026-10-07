/* eslint-disable no-console */
// Creates the ONE admin account and the default site settings.
// No demo properties or team members are created — add real ones from /admin.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) in .env before running setup.");
  }

  // The admin role is only ever created here, never through the public sign-up page.
  const existingAdmin = await db.user.findFirst({ where: { role: "admin" } });
  if (!existingAdmin) {
    await db.user.create({
      data: { login: email, name: "Admin", email, passwordHash: await bcrypt.hash(password, 12), role: "admin" },
    });
    console.log(`✔ Admin account created: ${email}`);
  } else {
    console.log(`• Admin account already exists: ${existingAdmin.login}`);
  }

  if (!(await db.siteSettings.findUnique({ where: { id: "site" } }))) {
    await db.siteSettings.create({
      data: {
        id: "site",
        businessName: "Golden Groups",
        tagline: "Real Estate · Land · Houses · Apartments · Commercial",
        phone: "+919876543210",
        whatsappNumber: "+919876543210",
        email: null,
        address: "Chennai, Tamil Nadu",
        workingHours: "Mon – Sat, 9:30 AM – 7:00 PM",
        heroTitle: "Find the right property in the right area",
        heroSubtitle:
          "Land, houses, apartments and commercial properties. Pick an area, explore, and tap “I am Interested”. Our team will call you.",
        aboutText:
          "Golden Groups helps families and investors buy the right property with complete clarity: verified documents, honest pricing and support with bank loans from start to registration.",
        loanMaxPercent: 90,
      },
    });
    console.log("✔ Site settings created (update phone / WhatsApp in Admin → Settings)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
