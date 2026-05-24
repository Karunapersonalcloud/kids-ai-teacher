import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kids_ai_teacher",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { id: "family-admin" },
    update: {},
    create: {
      id: "family-admin",
      email: "admin@kids-ai-teacher.local",
      name: "Family Admin",
      role: "admin",
      userType: "internalFamily",
      status: "active",
      plan: "family",
      loginIdentifier: "admin@kids-ai-teacher.local",
      credentialHash: "000000",
      mustChangeCredentials: false,
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
