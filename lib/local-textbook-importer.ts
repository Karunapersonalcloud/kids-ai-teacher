import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { indexMaterial } from "./content-indexer";
import { formatFileSize, saveUploadRecord } from "./local-uploads";
import { getFolderMapping, guessChapterNumber, guessSpecialChapterTitle, scanLocalTextbookFolders } from "./local-textbook-scanner";
import { sanitizeFileName, storageProvider } from "./storage-provider";
import type { UploadRecord } from "./types";

export async function importLocalTextbooks(folderKey: string, importMode: "all" | "selected", fileNames: string[] = []) {
  const folder = getFolderMapping(folderKey);
  if (!folder) {
    throw new Error("Unknown textbook folder. Only predefined folders can be imported.");
  }

  const scan = await scanLocalTextbookFolders();
  const scannedFolder = scan.folders.find((item) => item.folderKey === folderKey);
  if (!scannedFolder?.exists) {
    throw new Error(scannedFolder?.message || "Folder not found yet. Please create/upload textbook folder.");
  }

  const allowedFileNames = new Set(scannedFolder.files.map((file) => file.fileName));
  const targetFileNames = importMode === "all" ? scannedFolder.files.map((file) => file.fileName) : fileNames;
  const safeFileNames = targetFileNames.filter((fileName) => allowedFileNames.has(fileName));

  if (!safeFileNames.length) {
    throw new Error("No matching textbook files selected for import.");
  }

  const folderPath = scannedFolder.folderPath;
  const imported: UploadRecord[] = [];

  for (const fileName of safeFileNames) {
    const id = randomUUID();
    const sourcePath = path.join(folderPath, fileName);
    const stat = await fs.stat(sourcePath);
    const data = await fs.readFile(sourcePath);
    const safeName = sanitizeFileName(fileName);
    const relativePath = path.join("uploads", `${id}-${safeName}`);
    const storagePath = await storageProvider.writeFile(relativePath, data);
    const chapterNumber = guessChapterNumber(fileName);

    const record: UploadRecord = {
      id,
      fileName,
      childId: folder.childId,
      grade: folder.grade,
      subject: folder.subject,
      materialType: folder.materialType,
      chapter: chapterNumber ? `Chapter ${chapterNumber}` : guessSpecialChapterTitle(fileName),
      notes: `Imported from ${folder.relativePath}`,
      status: "Ready for AI indexing",
      source: "Local Textbook Folder",
      localFolderKey: folder.folderKey,
      languageRole: folder.languageRole,
      mimeType: mimeTypeFor(fileName),
      indexStatus: "Uploaded",
      sizeLabel: formatFileSize(stat.size),
      uploadedAt: new Date().toISOString(),
      storagePath,
    };

    await saveUploadRecord(record);
    imported.push(record);
  }

  return imported;
}

export async function importAndIndexLocalTextbooks(folderKey: string, importMode: "all" | "selected", fileNames: string[] = []) {
  const imported = await importLocalTextbooks(folderKey, importMode, fileNames);
  const failures: { fileName: string; error: string }[] = [];
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
    imported,
    importedCount: imported.length,
    indexedCount,
    failedCount: failures.length,
    failures,
  };
}

function mimeTypeFor(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };
  return map[extension] || "application/octet-stream";
}
