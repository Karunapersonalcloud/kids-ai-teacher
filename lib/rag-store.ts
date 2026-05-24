import { promises as fs } from "fs";
import path from "path";
import type { ContentChunk, UploadRecord } from "./types";

const indexRoot = path.join(process.cwd(), "storage", "indexes");
const chunksPath = path.join(indexRoot, "chunks.json");

export async function ensureIndexStorage() {
  await fs.mkdir(indexRoot, { recursive: true });
}

export async function readChunks(): Promise<ContentChunk[]> {
  try {
    await ensureIndexStorage();
    const raw = await fs.readFile(chunksPath, "utf8");
    return JSON.parse(raw) as ContentChunk[];
  } catch {
    return [];
  }
}

export async function writeChunks(chunks: ContentChunk[]) {
  await ensureIndexStorage();
  await fs.writeFile(chunksPath, JSON.stringify(chunks, null, 2), "utf8");
}

export function chunkText(text: string, maxChars = 1200) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end = Math.min(cursor + maxChars, normalized.length);
    const slice = normalized.slice(cursor, end);
    const lastStop = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("?"), slice.lastIndexOf("!"));
    const cut = lastStop > 400 && end < normalized.length ? cursor + lastStop + 1 : end;
    chunks.push(normalized.slice(cursor, cut).trim());
    cursor = cut;
  }
  return chunks.filter(Boolean);
}

export function keywordsFor(text: string) {
  const stop = new Set(["the", "and", "for", "with", "this", "that", "from", "are", "was", "you", "your", "into", "have", "has", "what", "why", "how"]);
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stop.has(word))
    )
  ).slice(0, 80);
}

export async function replaceFileChunks(upload: UploadRecord, text: string) {
  const existing = await readChunks();
  const pieces = chunkText(text);
  const nextChunks: ContentChunk[] = pieces.map((piece, index) => ({
    id: `${upload.id}-${index}`,
    fileId: upload.id,
    fileName: upload.fileName,
    childId: upload.childId,
    grade: upload.grade,
    subject: upload.subject,
    materialType: upload.materialType,
    chapter: upload.chapter,
    source: upload.source,
    originalSourceUrl: upload.originalSourceUrl,
    bookTitle: upload.bookTitle,
    chunkIndex: index,
    text: piece,
    keywords: keywordsFor(piece),
  }));

  await writeChunks([...existing.filter((chunk) => chunk.fileId !== upload.id), ...nextChunks]);
  return nextChunks;
}

export async function searchChunks(query: string, filters?: { childId?: string; subject?: string; fileId?: string; limit?: number }) {
  const chunks = await readChunks();
  const queryTerms = keywordsFor(query);
  const limit = filters?.limit || 5;

  return chunks
    .filter((chunk) => !filters?.childId || chunk.childId === filters.childId)
    .filter((chunk) => !filters?.subject || filters.subject === "all" || chunk.subject.toLowerCase() === filters.subject.toLowerCase())
    .filter((chunk) => !filters?.fileId || filters.fileId === "all" || chunk.fileId === filters.fileId)
    .map((chunk) => {
      const haystack = `${chunk.text} ${chunk.keywords.join(" ")}`.toLowerCase();
      const score = queryTerms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
