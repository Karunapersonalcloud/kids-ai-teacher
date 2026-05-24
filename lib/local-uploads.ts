import { promises as fs } from "fs";
import path from "path";
import type { UploadRecord } from "./types";
import { mockUploads } from "./mock-data";
import { sanitizeFileName, storageProvider } from "./storage-provider";

const storageRoot = storageProvider.toAbsolutePath("uploads");
const metadataPath = path.join(storageRoot, "metadata.json");

export async function ensureUploadStorage() {
  await fs.mkdir(storageRoot, { recursive: true });
}

export async function readUploadRecords(): Promise<UploadRecord[]> {
  try {
    await ensureUploadStorage();
    const raw = await fs.readFile(metadataPath, "utf8");
    return JSON.parse(raw) as UploadRecord[];
  } catch {
    return mockUploads;
  }
}

export async function saveUploadRecord(record: UploadRecord) {
  await ensureUploadStorage();
  const records = await readUploadRecords();
  const nextRecords = [record, ...records.filter((item) => item.id !== record.id)];
  await fs.writeFile(metadataPath, JSON.stringify(nextRecords, null, 2), "utf8");
  return nextRecords;
}

export async function updateUploadRecord(id: string, patch: Partial<UploadRecord>) {
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
