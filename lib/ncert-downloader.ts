import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { indexMaterial } from "./content-indexer";
import { formatFileSize, readUploadRecords, saveUploadRecord } from "./local-uploads";
import { getRequiredNcertBook, requiredNcertBooks, type RequiredNcertBook } from "./ncert-required-books";
import { sanitizeFileName, storageProvider } from "./storage-provider";
import type { UploadRecord } from "./types";

export type NcertDetectedFile = {
  title: string;
  chapterNumber?: number;
  fileName: string;
  downloadUrl: string;
  type: "chapter" | "complete" | "preface" | "appendix" | "unknown";
  status?: "Not downloaded" | "Downloaded" | "Imported" | "Indexed";
};

export type NcertDownloadResult = {
  book: RequiredNcertBook;
  sourceUrl: string;
  targetFolderPath: string;
  files: NcertDetectedFile[];
  downloaded: NcertDetectedFile[];
  skipped: NcertDetectedFile[];
  failed: { fileName: string; error: string }[];
};

const allowedDomains = new Set(["ncert.nic.in", "www.ncert.nic.in", "epathshala.nic.in", "www.epathshala.nic.in"]);
const ncertTextbookPage = "https://ncert.nic.in/textbook.php";
const ncertPdfRoot = "https://ncert.nic.in/textbook/pdf";

export async function getNcertBooksWithStatus() {
  const uploads = await readUploadRecords();
  return Promise.all(
    requiredNcertBooks.map(async (book) => {
      const files = await getDownloadedFiles(book);
      const imported = uploads.filter((upload) => upload.source === "NCERT Official Download" && upload.bookTitle === book.bookTitle && upload.subject === book.subject);
      return {
        ...book,
        localFolderPath: getBookTargetFolder(book),
        downloadedCount: files.length,
        importedCount: imported.length,
        indexedCount: imported.filter((upload) => upload.indexStatus === "Indexed" || upload.status === "Indexed").length,
      };
    })
  );
}

export async function checkNcertBook(bookId: string) {
  const book = getBookOrThrow(bookId);
  const sourceUrl = getBookSourceUrl(book);

  try {
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "KidsAITeacher/1.0" } });
    if (!response.ok) throw new Error(`NCERT page responded with ${response.status}.`);
    const html = await response.text();
    const parsedFiles = parseOfficialLinks(html, book);
    const generatedFiles = await discoverGeneratedLinks(book);
    const merged = mergeDetectedFiles([...parsedFiles, ...generatedFiles]);
    const files = await withStatuses(book, merged);

    return {
      book,
      sourceUrl,
      status: files.length ? "Available" : "No downloadable PDFs detected",
      message: files.length
        ? `Found ${files.filter((file) => file.type === "chapter").length} chapter PDFs from NCERT.`
        : "NCERT page was reachable, but no chapter PDFs were detected. The site structure may have changed.",
      files,
    };
  } catch (error) {
    return {
      book,
      sourceUrl,
      status: "Check failed",
      message: error instanceof Error ? error.message : "Could not check NCERT right now.",
      files: [] as NcertDetectedFile[],
    };
  }
}

export async function downloadNcertBook(bookId: string, mode: "all" | "selected", selectedFileNames: string[] = [], forceDownload = false): Promise<NcertDownloadResult> {
  const check = await checkNcertBook(bookId);
  if (!check.files.length) {
    throw new Error(check.message || "No NCERT files detected for this book.");
  }

  const selected = new Set(selectedFileNames);
  const candidates = check.files
    .filter((file) => file.downloadUrl.toLowerCase().endsWith(".pdf"))
    .filter((file) => mode === "all" || selected.has(file.fileName));

  if (!candidates.length) {
    throw new Error("No PDF files selected for download.");
  }

  const targetFolderPath = getBookTargetFolder(check.book);
  if (!targetFolderPath) {
    throw new Error("LOCAL_TEXTBOOK_ROOT is not configured. Add LOCAL_TEXTBOOK_ROOT in .env.local.");
  }
  await fs.mkdir(targetFolderPath, { recursive: true });

  const downloaded: NcertDetectedFile[] = [];
  const skipped: NcertDetectedFile[] = [];
  const failed: { fileName: string; error: string }[] = [];

  for (const file of candidates) {
    try {
      assertAllowedNcertUrl(file.downloadUrl);
      const targetPath = path.join(targetFolderPath, sanitizeFileName(file.fileName));
      if (!forceDownload && (await exists(targetPath))) {
        skipped.push(file);
        continue;
      }

      const response = await fetch(file.downloadUrl, { headers: { "User-Agent": "KidsAITeacher/1.0" } });
      if (!response.ok) throw new Error(`Download failed with ${response.status}.`);
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("pdf") && !file.fileName.toLowerCase().endsWith(".pdf")) {
        throw new Error("NCERT response did not look like a PDF.");
      }

      const data = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(targetPath, data);
      downloaded.push(file);
    } catch (error) {
      failed.push({ fileName: file.fileName, error: error instanceof Error ? error.message : "Download failed." });
    }
  }

  await writeDownloadMetadata(check.book, check.sourceUrl, [...downloaded, ...skipped]);
  return { book: check.book, sourceUrl: check.sourceUrl, targetFolderPath, files: check.files, downloaded, skipped, failed };
}

export async function downloadImportIndexNcertBook(bookId: string) {
  const download = await downloadNcertBook(bookId, "all", [], false);
  const localFiles = await getDownloadedFiles(download.book);
  const imported: UploadRecord[] = [];
  const skippedImports: string[] = [];
  const failures: { fileName: string; error: string }[] = [...download.failed];

  for (const file of localFiles) {
    try {
      const alreadyImported = await findImportedRecord(download.book, file.fileName);
      if (alreadyImported) {
        skippedImports.push(file.fileName);
        continue;
      }
      imported.push(await importDownloadedNcertFile(download.book, file));
    } catch (error) {
      failures.push({ fileName: file.fileName, error: error instanceof Error ? error.message : "Import failed." });
    }
  }

  let indexedCount = 0;
  for (const record of imported) {
    try {
      await indexMaterial(record.id);
      indexedCount += 1;
    } catch (error) {
      failures.push({ fileName: record.fileName, error: error instanceof Error ? error.message : "Indexing failed." });
    }
  }

  return {
    book: download.book,
    downloadedCount: download.downloaded.length,
    importedCount: imported.length,
    indexedCount,
    skippedCount: download.skipped.length + skippedImports.length,
    failedCount: failures.length,
    failures,
  };
}

function getBookOrThrow(bookId: string) {
  const book = getRequiredNcertBook(bookId);
  if (!book || !book.enabled) {
    throw new Error("Unknown or disabled NCERT book. Only configured books can be checked or downloaded.");
  }
  return book;
}

function getBookSourceUrl(book: RequiredNcertBook) {
  return `${ncertTextbookPage}?${book.ncertBookCode}=0-${book.chapterEnd}`;
}

function getBookTargetFolder(book: RequiredNcertBook) {
  const root = process.env.LOCAL_TEXTBOOK_ROOT || "";
  if (!root) return "";
  return path.join(root, "9thText_Books", book.targetFolder, book.bookTitle);
}

function parseOfficialLinks(html: string, book: RequiredNcertBook) {
  const matches = Array.from(html.matchAll(/(?:href|src)=["']([^"']+(?:\.pdf|\.zip)[^"']*)["']/gi));
  return matches
    .map((match) => normalizeNcertUrl(match[1]))
    .filter(Boolean)
    .filter((url): url is string => Boolean(url && isAllowedNcertUrl(url)))
    .map((url) => detectedFromUrl(url, book));
}

async function discoverGeneratedLinks(book: RequiredNcertBook) {
  const candidates: NcertDetectedFile[] = [
    detectedFromUrl(`${ncertPdfRoot}/${book.ncertBookCode}ps.pdf`, book),
    ...Array.from({ length: book.chapterEnd - book.chapterStart + 1 }, (_, index) => {
      const chapterNumber = book.chapterStart + index;
      return detectedFromUrl(`${ncertPdfRoot}/${book.ncertBookCode}${String(chapterNumber).padStart(2, "0")}.pdf`, book);
    }),
    detectedFromUrl(`${ncertPdfRoot}/${book.ncertBookCode}dd.zip`, book),
  ];

  const results = await Promise.all(candidates.map(async (file) => ((await isOfficialFileReachable(file.downloadUrl)) ? file : undefined)));
  return results.filter((file): file is NcertDetectedFile => Boolean(file));
}

function detectedFromUrl(downloadUrl: string, book: RequiredNcertBook): NcertDetectedFile {
  const fileName = path.basename(new URL(downloadUrl).pathname);
  const lower = fileName.toLowerCase();
  const chapterMatch = lower.match(/(\d{2})\.pdf$/);
  const chapterNumber = chapterMatch ? Number(chapterMatch[1]) : undefined;
  const type = lower.endsWith("dd.zip") ? "complete" : lower.includes("ps.pdf") ? "preface" : chapterNumber ? "chapter" : "unknown";

  return {
    title: type === "chapter" ? `Chapter ${chapterNumber}` : type === "preface" ? "Preface / Preliminary / Syllabus" : type === "complete" ? "Complete book" : book.bookTitle,
    chapterNumber,
    fileName,
    downloadUrl,
    type,
  };
}

function mergeDetectedFiles(files: NcertDetectedFile[]) {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = file.downloadUrl.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function withStatuses(book: RequiredNcertBook, files: NcertDetectedFile[]) {
  const uploads = await readUploadRecords();
  const downloadedFiles = await getDownloadedFiles(book);
  return files.map((file) => {
    const local = downloadedFiles.some((item) => item.fileName === file.fileName);
    const imported = uploads.find((upload) => upload.source === "NCERT Official Download" && upload.bookTitle === book.bookTitle && upload.fileName === file.fileName);
    const status: NcertDetectedFile["status"] =
      imported?.indexStatus === "Indexed" || imported?.status === "Indexed" ? "Indexed" : imported ? "Imported" : local ? "Downloaded" : "Not downloaded";
    return {
      ...file,
      status,
    };
  });
}

async function getDownloadedFiles(book: RequiredNcertBook) {
  const targetFolder = getBookTargetFolder(book);
  if (!targetFolder) return [] as NcertDetectedFile[];
  try {
    const entries = await fs.readdir(targetFolder, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
      .map((entry) => detectedFromUrl(`${ncertPdfRoot}/${entry.name}`, book));
  } catch {
    return [];
  }
}

async function importDownloadedNcertFile(book: RequiredNcertBook, file: NcertDetectedFile) {
  const targetFolder = getBookTargetFolder(book);
  if (!targetFolder) {
    throw new Error("LOCAL_TEXTBOOK_ROOT is not configured. Add LOCAL_TEXTBOOK_ROOT in .env.local.");
  }
  const sourcePath = path.join(targetFolder, file.fileName);
  const stat = await fs.stat(sourcePath);
  const id = randomUUID();
  const safeName = sanitizeFileName(file.fileName);
  const relativePath = path.join("uploads", `${id}-${safeName}`);
  const storagePath = await storageProvider.writeFile(relativePath, await fs.readFile(sourcePath));

  const record: UploadRecord = {
    id,
    fileName: file.fileName,
    childId: book.childId,
    grade: book.grade,
    subject: book.subject,
    materialType: book.materialType,
    chapter: file.chapterNumber ? `Chapter ${file.chapterNumber}` : file.title,
    notes: `Imported from official NCERT ${book.bookTitle}.`,
    status: "Ready for AI indexing",
    source: "NCERT Official Download",
    localFolderKey: `ncert-${book.id}`,
    languageRole: book.languageRole,
    originalSourceUrl: file.downloadUrl,
    bookTitle: book.bookTitle,
    chapterNumber: file.chapterNumber,
    mimeType: "application/pdf",
    indexStatus: "Uploaded",
    sizeLabel: formatFileSize(stat.size),
    uploadedAt: new Date().toISOString(),
    storagePath,
  };

  await saveUploadRecord(record);
  return record;
}

async function findImportedRecord(book: RequiredNcertBook, fileName: string) {
  const records = await readUploadRecords();
  return records.find((record) => record.source === "NCERT Official Download" && record.bookTitle === book.bookTitle && record.subject === book.subject && record.fileName === fileName);
}

async function writeDownloadMetadata(book: RequiredNcertBook, sourceUrl: string, files: NcertDetectedFile[]) {
  const targetFolder = getBookTargetFolder(book);
  if (!targetFolder) return;
  await fs.mkdir(targetFolder, { recursive: true });
  await fs.writeFile(
    path.join(targetFolder, "ncert-download-metadata.json"),
    JSON.stringify(
      {
        sourceUrl,
        downloadedAt: new Date().toISOString(),
        bookTitle: book.bookTitle,
        classNumber: book.classNumber,
        subject: book.subject,
        files,
      },
      null,
      2
    ),
    "utf8"
  );
}

function normalizeNcertUrl(value: string) {
  try {
    return new URL(value, "https://ncert.nic.in/").toString();
  } catch {
    return "";
  }
}

function isAllowedNcertUrl(url: string) {
  try {
    const parsed = new URL(url);
    return allowedDomains.has(parsed.hostname) && /\.(pdf|zip)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function assertAllowedNcertUrl(url: string) {
  if (!isAllowedNcertUrl(url)) {
    throw new Error("Only official NCERT/ePathshala PDF URLs are allowed.");
  }
}

async function isOfficialFileReachable(url: string) {
  if (!isAllowedNcertUrl(url)) return false;
  try {
    const response = await fetch(url, { method: "HEAD", headers: { "User-Agent": "KidsAITeacher/1.0" } });
    if (response.ok) return true;
    if (response.status !== 405 && response.status !== 403) return false;
  } catch {
    // Fall through to a small GET request.
  }

  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-0", "User-Agent": "KidsAITeacher/1.0" } });
    return response.ok || response.status === 206;
  } catch {
    return false;
  }
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
