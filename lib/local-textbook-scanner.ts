import { promises as fs } from "fs";
import path from "path";
import type { ChildId, MaterialType, UploadRecord } from "./types";
import { readUploadRecords } from "./local-uploads";

export type LocalTextbookFolder = {
  folderKey: string;
  relativePath: string;
  alternateRelativePaths?: string[];
  childId: ChildId;
  childName: string;
  grade: string;
  subject: string;
  languageRole?: "R1" | "R2" | "R3";
  materialType: MaterialType;
};

export type LocalTextbookFile = {
  fileName: string;
  extension: string;
  size: number;
  modifiedTime: string;
  guessedChapterNumber?: number;
  guessedChapterTitle: string;
  importStatus: "Not imported" | "Imported" | "Indexed";
};

export type LocalTextbookScanFolder = LocalTextbookFolder & {
  folderPath: string;
  exists: boolean;
  message?: string;
  filesCount: number;
  detectedChapterCount: number;
  status: "Not imported" | "Partially imported" | "Imported" | "Indexed";
  files: LocalTextbookFile[];
};

const supportedExtensions = new Set([".pdf", ".docx", ".txt", ".pptx", ".jpg", ".jpeg", ".png"]);

export const localTextbookFolders: LocalTextbookFolder[] = [
  {
    folderKey: "grade9-mathematics",
    relativePath: path.join("9thText_Books", "Mathematics"),
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "Mathematics",
    materialType: "Textbook",
  },
  {
    folderKey: "grade9-science",
    relativePath: path.join("9thText_Books", "Science"),
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "Science",
    materialType: "Textbook",
  },
  {
    folderKey: "grade9-hindi",
    relativePath: path.join("9thText_Books", "Hindi"),
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "Hindi",
    languageRole: "R2",
    materialType: "Textbook",
  },
  {
    folderKey: "grade9-english",
    relativePath: path.join("9thText_Books", "English"),
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "English",
    languageRole: "R1",
    materialType: "Textbook",
  },
  {
    folderKey: "grade9-physical-education-and-well-being",
    relativePath: path.join("9thText_Books", "Physical Education and Well-being"),
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "Physical Education and Well-being",
    materialType: "Textbook",
  },
  {
    folderKey: "grade9-skill-education",
    relativePath: path.join("9thText_Books", "Skill Education"),
    alternateRelativePaths: [path.join("9thText_Books", "Skill_Education")],
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "Skill Education",
    materialType: "Textbook",
  },
  {
    folderKey: "grade9-arts",
    relativePath: path.join("9thText_Books", "Arts"),
    childId: "jayadeep",
    childName: "Jayadeep",
    grade: "Class 9",
    subject: "Arts",
    materialType: "Textbook",
  },
  {
    folderKey: "grade2-future",
    relativePath: "2nd_Text_Books",
    childId: "harini",
    childName: "Harini",
    grade: "Class 2",
    subject: "General",
    materialType: "Textbook",
  },
];

export function getLocalTextbookRoot() {
  return process.env.LOCAL_TEXTBOOK_ROOT || "";
}

export function getFolderMapping(folderKey: string) {
  return localTextbookFolders.find((folder) => folder.folderKey === folderKey);
}

export function resolveFolderPath(folder: LocalTextbookFolder) {
  const root = getLocalTextbookRoot();
  return root ? path.join(root, folder.relativePath) : "";
}

export async function resolveExistingFolderPath(folder: LocalTextbookFolder) {
  const root = getLocalTextbookRoot();
  if (!root) return "";

  const relativePaths = [folder.relativePath, ...(folder.alternateRelativePaths || [])];
  for (const relativePath of relativePaths) {
    const folderPath = path.join(root, relativePath);
    try {
      const stat = await fs.stat(folderPath);
      if (stat.isDirectory()) return folderPath;
    } catch {
      // Try the next allowed folder name.
    }
  }

  return path.join(root, folder.relativePath);
}

export async function scanLocalTextbookFolders() {
  const root = getLocalTextbookRoot();
  const uploads = await readUploadRecords();

  if (!root) {
    return {
      configured: false,
      message: "Local textbook root is not configured. Add LOCAL_TEXTBOOK_ROOT in .env.local.",
      folders: localTextbookFolders.map((folder) => emptyFolder(folder, "")),
    };
  }

  const folders = await Promise.all(localTextbookFolders.map((folder) => scanFolder(folder, uploads)));
  return {
    configured: true,
    root,
    message: "Local textbook scanner is ready.",
    folders,
  };
}

async function scanFolder(folder: LocalTextbookFolder, uploads: UploadRecord[]): Promise<LocalTextbookScanFolder> {
  const folderPath = await resolveExistingFolderPath(folder);
  try {
    const entries = await readSupportedFiles(folderPath);
    const files = await Promise.all(
      entries
        .map(async (entry) => {
          const stat = await fs.stat(entry.filePath);
          const chapterNumber = guessChapterNumber(entry.fileName);
          const baseName = path.basename(entry.fileName);
          const imported = uploads.find(
            (upload) =>
              (upload.localFolderKey === folder.folderKey || upload.source === "NCERT Official Download") &&
              upload.subject.toLowerCase() === folder.subject.toLowerCase() &&
              (upload.fileName === entry.fileName || upload.fileName === baseName)
          );
          return {
            fileName: entry.fileName,
            extension: path.extname(entry.fileName).toLowerCase(),
            size: stat.size,
            modifiedTime: stat.mtime.toISOString(),
            guessedChapterNumber: chapterNumber,
            guessedChapterTitle: chapterNumber ? `Chapter ${chapterNumber}` : guessSpecialChapterTitle(entry.fileName),
            importStatus: imported?.status === "Indexed" || imported?.indexStatus === "Indexed" ? "Indexed" : imported ? "Imported" : "Not imported",
          } satisfies LocalTextbookFile;
        })
    );

    const importedCount = files.filter((file) => file.importStatus !== "Not imported").length;
    const indexedCount = files.filter((file) => file.importStatus === "Indexed").length;
    return {
      ...folder,
      folderPath,
      exists: true,
      filesCount: files.length,
      detectedChapterCount: files.filter((file) => file.guessedChapterNumber).length,
      status: getFolderStatus(files.length, importedCount, indexedCount),
      files,
      message: files.length ? undefined : "No textbook files detected in this folder.",
    };
  } catch {
    return emptyFolder(folder, folderPath, "Folder not found yet. Please create/upload textbook folder.");
  }
}

async function readSupportedFiles(folderPath: string, relativePrefix = ""): Promise<{ fileName: string; filePath: string }[]> {
  const entries = await fs.readdir(path.join(folderPath, relativePrefix), { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativeName = path.join(relativePrefix, entry.name);
      const fullPath = path.join(folderPath, relativeName);
      if (entry.isDirectory()) {
        return readSupportedFiles(folderPath, relativeName);
      }
      if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
        return [{ fileName: relativeName, filePath: fullPath }];
      }
      return [];
    })
  );
  return files.flat();
}

function emptyFolder(folder: LocalTextbookFolder, folderPath: string, message?: string): LocalTextbookScanFolder {
  return {
    ...folder,
    folderPath,
    exists: false,
    filesCount: 0,
    detectedChapterCount: 0,
    status: "Not imported",
    files: [],
    message,
  };
}

function getFolderStatus(filesCount: number, importedCount: number, indexedCount: number): LocalTextbookScanFolder["status"] {
  if (!filesCount || importedCount === 0) return "Not imported";
  if (indexedCount === filesCount) return "Indexed";
  if (importedCount === filesCount) return "Imported";
  return "Partially imported";
}

export function guessChapterNumber(fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
  if (baseName.includes("ps")) return undefined;
  const match = baseName.match(/(\d{2,3})$/);
  if (!match) return undefined;
  const raw = Number(match[1]);
  const chapter = raw >= 100 ? raw % 100 : raw;
  return chapter > 0 ? chapter : undefined;
}

export function guessSpecialChapterTitle(fileName: string) {
  const baseName = path.basename(fileName, path.extname(fileName)).toLowerCase();
  if (baseName.includes("ps")) return "Preface / Preliminary / Syllabus";
  return path.basename(fileName, path.extname(fileName));
}
