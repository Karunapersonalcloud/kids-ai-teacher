import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";

export type HomeworkRecord = {
  id: string;
  userId?: string;
  childId: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  imageUrl?: string;
  filePath?: string;
  ocrText?: string;
  ocrStatus: string;
  status: string;
  score?: number;
  feedback: { label: string; detail: string; action: string }[];
  submittedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const storageRoot = path.join(process.cwd(), "storage");
const storagePath = path.join(storageRoot, "homework-submissions.json");

export async function listHomeworkForChild(childId: string): Promise<HomeworkRecord[]> {
  if (isPostgresEnabled()) {
    const rows = await prisma.homeworkSubmission.findMany({ where: { childId }, orderBy: { submittedAt: "desc" } });
    return rows.map(rowToRecord);
  }
  const all = await readJsonStore();
  return all.filter((item) => item.childId === childId);
}

export async function createHomeworkSubmission(input: {
  userId?: string;
  childId: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  filePath?: string;
  imageUrl?: string;
  note?: string;
}): Promise<HomeworkRecord> {
  const review = buildHomeworkReview(input.note || "", Boolean(input.filePath || input.imageUrl));
  const now = new Date();

  if (isPostgresEnabled()) {
    const created = await prisma.homeworkSubmission.create({
      data: {
        userId: input.userId,
        childId: input.childId,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        filePath: input.filePath,
        imageUrl: input.imageUrl,
        ocrText: review.ocrText,
        ocrStatus: review.ocrStatus,
        status: review.status,
        score: review.score,
        feedback: review.feedback,
        reviewedAt: now,
      },
    });
    return rowToRecord(created);
  }

  const record: HomeworkRecord = {
    id: randomUUID(),
    userId: input.userId,
    childId: input.childId,
    subject: input.subject,
    chapter: input.chapter,
    topic: input.topic,
    filePath: input.filePath,
    imageUrl: input.imageUrl,
    ocrText: review.ocrText,
    ocrStatus: review.ocrStatus,
    status: review.status,
    score: review.score,
    feedback: review.feedback,
    submittedAt: now.toISOString(),
    reviewedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  const all = await readJsonStore();
  await writeJsonStore([record, ...all]);
  return record;
}

export function buildHomeworkReview(note: string, hasImage: boolean) {
  const lower = note.toLowerCase();
  const unclear = lower.includes("blur") || lower.includes("unclear") || !hasImage;
  const incomplete = lower.includes("incomplete") || lower.includes("pending");
  const status = unclear ? "handwriting unclear" : incomplete ? "incomplete" : "needs correction";
  const score = unclear ? 0 : incomplete ? 50 : 70;
  return {
    ocrStatus: unclear ? "failed" : "complete",
    ocrText: hasImage ? "OCR preview will depend on image clarity. Parent note: " + (note || "No note added.") : "",
    status,
    score,
    feedback: [
      {
        label: unclear ? "Image unclear" : incomplete ? "Incomplete work" : "Review needed",
        detail: unclear
          ? "The image may be too unclear for reliable checking. Upload a brighter, straight photo."
          : incomplete
            ? "Some answers look incomplete. Finish the missing parts before final checking."
            : "We found areas that should be checked against the expected answer.",
        action: unclear ? "Retake the photo near good light." : "Correct the marked parts and upload again after revision.",
      },
    ],
  };
}

async function readJsonStore(): Promise<HomeworkRecord[]> {
  try {
    await fs.mkdir(storageRoot, { recursive: true });
    const raw = await fs.readFile(storagePath, "utf8");
    return JSON.parse(raw) as HomeworkRecord[];
  } catch {
    return [];
  }
}

async function writeJsonStore(records: HomeworkRecord[]) {
  await fs.mkdir(storageRoot, { recursive: true });
  await fs.writeFile(storagePath, JSON.stringify(records, null, 2), "utf8");
}

function rowToRecord(row: {
  id: string;
  userId: string | null;
  childId: string;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  imageUrl: string | null;
  filePath: string | null;
  ocrText: string | null;
  ocrStatus: string;
  status: string;
  score: number | null;
  feedback: unknown;
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): HomeworkRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    childId: row.childId,
    subject: row.subject || undefined,
    chapter: row.chapter || undefined,
    topic: row.topic || undefined,
    imageUrl: row.imageUrl || undefined,
    filePath: row.filePath || undefined,
    ocrText: row.ocrText || undefined,
    ocrStatus: row.ocrStatus,
    status: row.status,
    score: row.score ?? undefined,
    feedback: Array.isArray(row.feedback) ? (row.feedback as HomeworkRecord["feedback"]) : [],
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
