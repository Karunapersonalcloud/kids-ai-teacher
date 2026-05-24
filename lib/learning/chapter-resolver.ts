import { readUploadRecords } from "@/lib/local-uploads";
import { readChunks } from "@/lib/rag-store";
import type { ChildId, ContentChunk, UploadRecord } from "@/lib/types";
import { getChaptersForGradeSubject, normalizeSubject, type LearningChapter } from "./chapter-catalog";
import { getNcertChapters } from "./ncert-catalog";

export type ChapterSource = "uploaded_material" | "ncert_catalog" | "static_catalog" | "fallback";

export type ResolvedChapter = {
  chapterNumber: number;
  chapterName: string;
  concepts: string[];
  source: ChapterSource;
  materialId?: string;
  confidence: number;
  warning?: string;
};

export type ResolveChapterInput = {
  childId: ChildId;
  grade: string;
  board?: string;
  subject: string;
};

export async function resolveChaptersForChildSubject(input: ResolveChapterInput): Promise<ResolvedChapter[]> {
  const uploaded = await resolveUploadedMaterialChapters(input);
  if (uploaded.length) return uploaded;

  const ncert = getNcertChapters(input.grade, input.subject);
  if (ncert.length && isNcertLikely(input.board, input.subject)) {
    return ncert.map((chapter) => toResolvedChapter(chapter, "ncert_catalog", 0.82));
  }

  const staticChapters = getChaptersForGradeSubject(input.grade, input.subject);
  if (staticChapters.length) {
    return staticChapters.map((chapter) => toResolvedChapter(chapter, "static_catalog", 0.68));
  }

  return getChaptersForGradeSubject(input.grade, "Unknown").map((chapter) => toResolvedChapter(chapter, "fallback", 0.35, "No exact grade/subject catalog exists yet."));
}

export async function getSubjectMaterialState(input: ResolveChapterInput) {
  const uploads = await readUploadRecords();
  const chunks = await readChunks();
  const subjectNames = subjectNameSet(input.subject);
  const subjectUploads = uploads.filter((upload) => upload.childId === input.childId && subjectNames.has(upload.subject.toLowerCase()));
  const indexedMaterialIds = new Set(chunks.filter((chunk) => chunk.childId === input.childId && subjectNames.has(chunk.subject.toLowerCase())).map((chunk) => chunk.fileId));
  const indexedUploads = subjectUploads.filter((upload) => indexedMaterialIds.has(upload.id) || upload.indexStatus === "Indexed");

  if (indexedUploads.length) {
    return {
      status: "indexed" as const,
      message: "Using uploaded textbook material.",
      uploads: subjectUploads,
    };
  }

  if (subjectUploads.length) {
    return {
      status: "pending_extraction" as const,
      message: "Uploaded material found. Chapter extraction is pending.",
      uploads: subjectUploads,
    };
  }

  return {
    status: "catalog" as const,
    message: "Showing standard chapter structure. Upload or import the student's actual textbook to make lessons textbook-specific.",
    uploads: subjectUploads,
  };
}

async function resolveUploadedMaterialChapters(input: ResolveChapterInput): Promise<ResolvedChapter[]> {
  const uploads = await readUploadRecords();
  const chunks = await readChunks();
  const subjectNames = subjectNameSet(input.subject);
  const subjectUploads = uploads.filter((upload) => upload.childId === input.childId && subjectNames.has(upload.subject.toLowerCase()));
  const indexedChunks = chunks.filter((chunk) => chunk.childId === input.childId && subjectNames.has(chunk.subject.toLowerCase()));

  const fromUploads = chapterMapFromUploads(subjectUploads);
  const fromChunks = chapterMapFromChunks(indexedChunks);
  const merged = mergeChapterMaps(fromUploads, fromChunks);
  return Array.from(merged.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
}

function chapterMapFromUploads(uploads: UploadRecord[]) {
  const map = new Map<string, ResolvedChapter>();
  for (const upload of uploads) {
    if (upload.materialType !== "Textbook" && upload.materialType !== "Notes" && upload.materialType !== "Worksheet" && upload.materialType !== "School PPT") continue;
    const guessed = guessChapter(upload.chapter || upload.fileName, upload.chapterNumber);
    const key = String(guessed.chapterNumber);
    const existing = map.get(key);
    map.set(key, {
      chapterNumber: guessed.chapterNumber,
      chapterName: existing?.chapterName || guessed.chapterName,
      concepts: mergeConcepts(existing?.concepts || [], conceptsFromText(`${upload.chapter} ${upload.notes} ${upload.fileName}`)),
      source: "uploaded_material",
      materialId: upload.id,
      confidence: upload.indexStatus === "Indexed" ? 0.92 : 0.72,
      warning: upload.indexStatus === "Indexed" ? undefined : "Uploaded material exists, but full chapter extraction/indexing may still be pending.",
    });
  }
  return map;
}

function chapterMapFromChunks(chunks: ContentChunk[]) {
  const map = new Map<string, ResolvedChapter>();
  for (const chunk of chunks) {
    const guessed = guessChapter(chunk.chapter || chunk.text || chunk.fileName);
    const headings = extractHeadings(chunk.text);
    const key = String(guessed.chapterNumber);
    const existing = map.get(key);
    map.set(key, {
      chapterNumber: guessed.chapterNumber,
      chapterName: existing?.chapterName || guessed.chapterName,
      concepts: mergeConcepts(existing?.concepts || [], [...headings, ...conceptsFromText(chunk.text)]),
      source: "uploaded_material",
      materialId: chunk.fileId,
      confidence: 0.94,
    });
  }
  return map;
}

function mergeChapterMaps(...maps: Map<string, ResolvedChapter>[]) {
  const merged = new Map<string, ResolvedChapter>();
  for (const map of maps) {
    for (const [key, chapter] of map) {
      const existing = merged.get(key);
      merged.set(key, existing ? { ...chapter, concepts: mergeConcepts(existing.concepts, chapter.concepts), confidence: Math.max(existing.confidence, chapter.confidence) } : chapter);
    }
  }
  return merged;
}

function guessChapter(text: string, knownNumber?: number) {
  const clean = text.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]/g, " ").trim();
  const explicit = clean.match(/chapter\s*(\d+)/i);
  const ncertTail = clean.match(/(\d{2,3})$/);
  const chapterNumber = knownNumber || (explicit ? Number(explicit[1]) : ncertTail ? Number(ncertTail[1].slice(-2)) : 1);
  const chapterName = clean
    .replace(/chapter\s*\d+\s*[:.-]?\s*/i, "")
    .replace(/^[a-z]{3,}\d{2,3}$/i, `Chapter ${chapterNumber}`)
    .trim();
  return {
    chapterNumber: chapterNumber || 1,
    chapterName: chapterName && !/^\d+$/.test(chapterName) ? titleCase(chapterName) : `Chapter ${chapterNumber}`,
  };
}

function conceptsFromText(text: string) {
  const matches = text.match(/\b[A-Z][A-Za-z /-]{4,45}\b/g) || [];
  return matches
    .map((item) => item.trim())
    .filter((item) => !/chapter|class|pdf|ppt|notes|worksheet/i.test(item))
    .slice(0, 8);
}

function extractHeadings(text: string) {
  const headings: string[] = [];
  const patterns = [/^\s*\d+\.\d+\s+(.{4,70})/gm, /^\s*[A-Z][A-Z\s-]{6,70}$/gm, /\b(?:Activity|Example|Exercise)\s+\d+[:.-]?\s*(.{4,60})/gi];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const heading = (match[1] || match[0]).replace(/\s+/g, " ").trim();
      if (heading) headings.push(titleCase(heading));
    }
  }
  return headings.slice(0, 10);
}

function toResolvedChapter(chapter: LearningChapter, source: ChapterSource, confidence: number, warning?: string): ResolvedChapter {
  return {
    chapterNumber: chapter.number,
    chapterName: chapter.name,
    concepts: chapter.concepts,
    source,
    confidence,
    warning,
  };
}

function mergeConcepts(first: string[], second: string[]) {
  return Array.from(new Set([...first, ...second].map((item) => item.trim()).filter(Boolean))).slice(0, 12);
}

function subjectNameSet(subject: string) {
  const normalized = normalizeSubject(subject);
  const values = new Set([subject, normalized, normalized.replace("Maths", "Mathematics"), normalized.replace("Mathematics", "Maths")].map((item) => item.toLowerCase()));
  if (normalized === "Computer / AI") {
    values.add("computer");
    values.add("ct / ai");
    values.add("ai");
  }
  return values;
}

function isNcertLikely(board: string | undefined, subject: string) {
  return !board || board.toLowerCase().includes("cbse") || ["Maths", "Science", "EVS", "Social Science", "English", "Hindi"].includes(normalizeSubject(subject));
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
