import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
import type { UploadRecord } from "./types";
import { mockUploads } from "./mock-data";
import { sanitizeFileName, storageProvider } from "./storage-provider";

const storageRoot = storageProvider.toAbsolutePath("uploads");
const metadataPath = path.join(storageRoot, "metadata.json");

export async function ensureUploadStorage() {
  await fs.mkdir(storageRoot, { recursive: true });
}

export async function readUploadRecords(): Promise<UploadRecord[]> {
  if (isPostgresEnabled()) {
    const records = await prisma.uploadMaterial.findMany({ orderBy: { createdAt: "desc" } });
    return records.map(uploadFromPrisma);
  }

  try {
    await ensureUploadStorage();
    const raw = await fs.readFile(metadataPath, "utf8");
    return JSON.parse(raw) as UploadRecord[];
  } catch {
    return mockUploads;
  }
}

export async function saveUploadRecord(record: UploadRecord) {
  if (isPostgresEnabled()) {
    await prisma.uploadMaterial.upsert({
      where: { id: record.id },
      update: uploadToPrisma(record),
      create: { id: record.id, ...uploadToPrisma(record) },
    });
    return readUploadRecords();
  }

  await ensureUploadStorage();
  const records = await readUploadRecords();
  const nextRecords = [record, ...records.filter((item) => item.id !== record.id)];
  await fs.writeFile(metadataPath, JSON.stringify(nextRecords, null, 2), "utf8");
  return nextRecords;
}

export async function updateUploadRecord(id: string, patch: Partial<UploadRecord>) {
  if (isPostgresEnabled()) {
    const existing = await prisma.uploadMaterial.findUnique({ where: { id } });
    if (!existing) return undefined;
    const updated = await prisma.uploadMaterial.update({
      where: { id },
      data: uploadToPrisma({ ...uploadFromPrisma(existing), ...patch }),
    });
    return uploadFromPrisma(updated);
  }

  await ensureUploadStorage();
  const records = await readUploadRecords();
  const nextRecords = records.map((record) => (record.id === id ? { ...record, ...patch } : record));
  await fs.writeFile(metadataPath, JSON.stringify(nextRecords, null, 2), "utf8");
  return nextRecords.find((record) => record.id === id);
}

export function getStorageFilePath(id: string, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  return path.join(storageRoot, `${id}-${safeName}`);
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadToPrisma(record: UploadRecord) {
  return {
    userId: null,
    childId: record.childId,
    childName: record.childId === "jayadeep" ? "Jayadeep" : record.childId === "harini" ? "Harini" : undefined,
    grade: record.grade,
    subject: record.subject,
    materialType: record.materialType,
    chapter: record.chapter,
    topic: record.chapter,
    title: record.fileName,
    originalFileName: record.fileName,
    storedFileName: record.storagePath ? path.basename(record.storagePath) : undefined,
    mimeType: record.mimeType,
    sizeLabel: record.sizeLabel,
    source: record.source || "Local Upload",
    originalSourceUrl: record.originalSourceUrl,
    bookTitle: record.bookTitle,
    chapterNumber: record.chapterNumber,
    status: record.status,
    indexStatus: record.indexStatus,
    indexError: record.indexError,
    ocrStatus: record.indexStatus?.startsWith("OCR") ? record.indexStatus : undefined,
    canDownload: false,
    internalFamilyOnly: record.childId === "jayadeep" || record.childId === "harini",
    storagePath: record.storagePath,
    metadata: {
      notes: record.notes,
      driveFileId: record.driveFileId,
      driveWebViewLink: record.driveWebViewLink,
      localFolderKey: record.localFolderKey,
      languageRole: record.languageRole,
      uploadedAt: record.uploadedAt,
    },
  };
}

function uploadFromPrisma(record: {
  id: string;
  childId: string | null;
  grade: string | null;
  subject: string;
  materialType: string;
  chapter: string | null;
  title: string;
  originalFileName: string;
  mimeType: string | null;
  sizeLabel: string | null;
  source: string;
  originalSourceUrl: string | null;
  bookTitle: string | null;
  chapterNumber: number | null;
  status: string;
  indexStatus: string | null;
  indexError: string | null;
  storagePath: string | null;
  metadata: unknown;
  createdAt: Date;
}): UploadRecord {
  const metadata = typeof record.metadata === "object" && record.metadata ? (record.metadata as Record<string, string>) : {};
  return {
    id: record.id,
    fileName: record.originalFileName || record.title,
    childId: record.childId === "harini" ? "harini" : "jayadeep",
    grade: record.grade || "",
    subject: record.subject,
    materialType: record.materialType as UploadRecord["materialType"],
    chapter: record.chapter || "",
    notes: metadata.notes || "",
    status: record.status as UploadRecord["status"],
    source: record.source as UploadRecord["source"],
    driveFileId: metadata.driveFileId,
    driveWebViewLink: metadata.driveWebViewLink,
    localFolderKey: metadata.localFolderKey,
    languageRole: metadata.languageRole as UploadRecord["languageRole"],
    originalSourceUrl: record.originalSourceUrl || undefined,
    bookTitle: record.bookTitle || undefined,
    chapterNumber: record.chapterNumber || undefined,
    mimeType: record.mimeType || undefined,
    indexStatus: record.indexStatus as UploadRecord["indexStatus"],
    indexError: record.indexError || undefined,
    sizeLabel: record.sizeLabel || "",
    uploadedAt: metadata.uploadedAt || record.createdAt.toISOString(),
    storagePath: record.storagePath || undefined,
  };
}
