import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";

loadLocalEnv();

// Keep this in sync with lib/credentials.ts. Format: scrypt$<saltHex>$<hashHex>.
function hashPin(pin) {
  if (!pin) throw new Error("pin is required");
  const salt = randomBytes(16);
  const derived = scryptSync(pin, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kids_ai_teacher",
});
const prisma = new PrismaClient({ adapter });
const productionMode = process.env.NODE_ENV === "production" || process.env.PERSISTENCE_PROVIDER === "postgres";
const adminEmail = process.env.ADMIN_EMAIL || (productionMode ? "" : "admin@kids-ai-teacher.local");
const adminPin = process.env.ADMIN_PIN || (productionMode ? "" : "000000");
const adminName = process.env.ADMIN_NAME || "Family Admin";

if (!adminEmail || !adminPin) {
  throw new Error("ADMIN_EMAIL and ADMIN_PIN are required when seeding production/admin PostgreSQL data.");
}

async function main() {
  const credentialHash = hashPin(adminPin);
  const admin = await prisma.user.upsert({
    where: { id: "family-admin" },
    update: {
      email: adminEmail,
      name: adminName,
      role: "admin",
      userType: "internalFamily",
      status: "active",
      plan: "family",
      loginIdentifier: adminEmail,
      credentialHash,
      tempPin: adminPin,
      mustChangeCredentials: true,
      dailyAiLimit: 500,
      uploadLimit: 500,
      canDownloadMaterials: true,
      canUploadMaterials: true,
      canUseAI: true,
      canUseOCR: true,
      canImportFromDrive: true,
      canIndexMaterials: true,
    },
    create: {
      id: "family-admin",
      email: adminEmail,
      name: adminName,
      role: "admin",
      userType: "internalFamily",
      status: "active",
      plan: "family",
      loginIdentifier: adminEmail,
      credentialHash,
      tempPin: adminPin,
      mustChangeCredentials: true,
      approvedAt: new Date(),
      approvedBy: "seed",
      dailyAiLimit: 500,
      uploadLimit: 500,
      canDownloadMaterials: true,
      canUploadMaterials: true,
      canUseAI: true,
      canUseOCR: true,
      canImportFromDrive: true,
      canIndexMaterials: true,
    },
  });
  console.log(`Admin user seeded/updated for ${adminEmail} (PIN is stored as a hashed credential).`);

  for (const child of [
    {
      childId: "jayadeep",
      name: "Jayadeep",
      grade: "Class 9",
      classNumber: 9,
      board: "CBSE",
      preferredLanguage: "English",
      weakSubjects: "Mathematics, Science, reading foundations",
      learningGoal: "Rebuild fundamentals with concept-first learning.",
    },
    {
      childId: "harini",
      name: "Harini",
      grade: "Class 2",
      classNumber: 2,
      board: "CBSE",
      preferredLanguage: "English",
      weakSubjects: "Phonics, reading fluency, number sense",
      learningGoal: "Joyful foundational learning.",
    },
  ]) {
    const existing = await prisma.child.findFirst({ where: { userId: admin.id, childId: child.childId } });
    if (!existing) {
      await prisma.child.create({ data: { ...child, userId: admin.id } });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    if (!existsSync(fileName)) continue;
    const lines = readFileSync(fileName, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
