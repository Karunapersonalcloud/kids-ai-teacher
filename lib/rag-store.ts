import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
import type { ContentChunk, UploadRecord } from "./types";

const indexRoot = path.join(process.cwd(), "storage", "indexes");
const chunksPath = path.join(indexRoot, "chunks.json");

export async function ensureIndexStorage() {
  await fs.mkdir(indexRoot, { recursive: true });
}

export async function readChunks(): Promise<ContentChunk[]> {
  if (isPostgresEnabled()) {
    const chunks = await prisma.indexedChunk.findMany({ orderBy: [{ createdAt: "desc" }, { chunkIndex: "asc" }] });
    return chunks.map((chunk) => ({
      id: chunk.id,
      fileId: chunk.materialId || "",
      fileName: chunk.title || "",
      childId: chunk.childId === "harini" ? "harini" : "jayadeep",
      grade: typeof chunk.metadata === "object" && chunk.metadata && "grade" in chunk.metadata ? String(chunk.metadata.grade) : "",
      subject: chunk.subject,
      materialType:
        typeof chunk.metadata === "object" && chunk.metadata && "materialType" in chunk.metadata ? (String(chunk.metadata.materialType) as ContentChunk["materialType"]) : "Other",
      chapter: typeof chunk.metadata === "object" && chunk.metadata && "chapter" in chunk.metadata ? String(chunk.metadata.chapter) : "",
      source: chunk.source as ContentChunk["source"],
      originalSourceUrl:
        typeof chunk.metadata === "object" && chunk.metadata && "originalSourceUrl" in chunk.metadata ? String(chunk.metadata.originalSourceUrl) : undefined,
      bookTitle: chunk.bookTitle || undefined,
      chunkIndex: chunk.chunkIndex,
      text: chunk.content,
      keywords: keywordsFor(chunk.content),
    }));
  }

  try {
    await ensureIndexStorage();
    const raw = await fs.readFile(chunksPath, "utf8");
    return JSON.parse(raw) as ContentChunk[];
  } catch {
    return [];
  }
}

export async function writeChunks(chunks: ContentChunk[]) {
  if (isPostgresEnabled()) {
    await prisma.indexedChunk.deleteMany();
    if (chunks.length) {
      await prisma.indexedChunk.createMany({
        data: chunks.map((chunk) => chunkToPrisma(chunk)),
      });
    }
    return;
  }

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
  if (isPostgresEnabled()) {
    const pieces = chunkText(text);
    await prisma.indexedChunk.deleteMany({ where: { materialId: upload.id } });
    if (!pieces.length) return [];
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
    await prisma.indexedChunk.createMany({ data: nextChunks.map((chunk) => chunkToPrisma(chunk)) });
    return nextChunks;
  }

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
  if (isPostgresEnabled()) {
    const queryTerms = keywordsFor(query);
    const limit = filters?.limit || 5;
    const chunks = await prisma.indexedChunk.findMany({
      where: {
        childId: filters?.childId,
        subject: filters?.subject && filters.subject !== "all" ? { equals: filters.subject, mode: "insensitive" } : undefined,
        materialId: filters?.fileId && filters.fileId !== "all" ? filters.fileId : undefined,
        OR: queryTerms.length ? queryTerms.slice(0, 12).map((term) => ({ content: { contains: term, mode: "insensitive" as const } })) : undefined,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return chunks
      .map((chunk) => {
        const content = chunk.content.toLowerCase();
        const score = queryTerms.reduce((total, term) => total + (content.includes(term) ? 1 : 0), 0);
        return {
          id: chunk.id,
          fileId: chunk.materialId || "",
          fileName: chunk.title || "",
          childId: chunk.childId === "harini" ? "harini" : "jayadeep",
          grade: typeof chunk.metadata === "object" && chunk.metadata && "grade" in chunk.metadata ? String(chunk.metadata.grade) : "",
          subject: chunk.subject,
          materialType:
            typeof chunk.metadata === "object" && chunk.metadata && "materialType" in chunk.metadata ? (String(chunk.metadata.materialType) as ContentChunk["materialType"]) : "Other",
          chapter: typeof chunk.metadata === "object" && chunk.metadata && "chapter" in chunk.metadata ? String(chunk.metadata.chapter) : "",
          source: chunk.source as ContentChunk["source"],
          originalSourceUrl:
            typeof chunk.metadata === "object" && chunk.metadata && "originalSourceUrl" in chunk.metadata ? String(chunk.metadata.originalSourceUrl) : undefined,
          bookTitle: chunk.bookTitle || undefined,
          chunkIndex: chunk.chunkIndex,
          text: chunk.content,
          keywords: keywordsFor(chunk.content),
          score,
        };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

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

function chunkToPrisma(chunk: ContentChunk) {
  return {
    id: chunk.id,
    materialId: chunk.fileId,
    childId: chunk.childId,
    subject: chunk.subject,
    title: chunk.fileName,
    chunkIndex: chunk.chunkIndex,
    content: chunk.text,
    source: chunk.source,
    bookTitle: chunk.bookTitle,
    metadata: {
      grade: chunk.grade,
      materialType: chunk.materialType,
      chapter: chunk.chapter,
      originalSourceUrl: chunk.originalSourceUrl,
      keywords: chunk.keywords,
    },
  };
}
