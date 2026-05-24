import { randomUUID } from "crypto";
import path from "path";
import { downloadDriveFile } from "@/lib/google-drive";
import { formatFileSize, saveUploadRecord } from "@/lib/local-uploads";
import { sanitizeFileName, storageProvider } from "@/lib/storage-provider";
import type { ChildId, MaterialType, UploadRecord } from "@/lib/types";
import { indexMaterial } from "@/lib/content-indexer";
import { requirePolicy } from "@/lib/request-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const policy = await requirePolicy(request, "canImportFromDrive");
  if (!policy.ok) return policy.response;
  const body = (await request.json()) as {
    fileId?: string;
    fileName?: string;
    mimeType?: string;
    webViewLink?: string;
    childId?: ChildId;
    grade?: string;
    subject?: string;
    materialType?: MaterialType;
    chapter?: string;
    notes?: string;
    indexAfterImport?: boolean;
  };

  if (!body.fileId || !body.fileName || !body.mimeType) {
    return Response.json({ error: "Drive file id, name, and mimeType are required." }, { status: 400 });
  }

  const download = await downloadDriveFile(body.fileId, body.mimeType);
  if (!download.ok) {
    return Response.json({ error: download.error }, { status: 400 });
  }

  const id = randomUUID();
  const safeName = sanitizeFileName(body.fileName);
  const relativePath = path.join("uploads", `${id}-${safeName}`);
  const storagePath = await storageProvider.writeFile(relativePath, download.data);

  const record: UploadRecord = {
    id,
    fileName: body.fileName,
    childId: body.childId || "jayadeep",
    grade: body.grade || "",
    subject: body.subject || "General",
    materialType: body.materialType || "Other",
    chapter: body.chapter || "",
    notes: body.notes || "Imported from Google Drive",
    status: "Ready for AI indexing",
    source: "Google Drive Import",
    driveFileId: body.fileId,
    driveWebViewLink: body.webViewLink,
    mimeType: body.mimeType,
    indexStatus: "Uploaded",
    sizeLabel: formatFileSize(download.data.length),
    uploadedAt: new Date().toISOString(),
    storagePath,
  };

  await saveUploadRecord(record);

  if (body.indexAfterImport) {
    try {
      const indexResult = await indexMaterial(id);
      return Response.json({ upload: { ...record, status: "Indexed", indexStatus: "Indexed" }, indexResult });
    } catch (error) {
      return Response.json({
        upload: record,
        warning: error instanceof Error ? error.message : "Imported, but indexing failed.",
      });
    }
  }

  return Response.json({ upload: record });
}
