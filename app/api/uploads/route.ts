import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { formatFileSize, getStorageFilePath, readUploadRecords, saveUploadRecord } from "@/lib/local-uploads";
import { getRequestAccess, requirePolicy } from "@/lib/request-access";
import type { ChildId, MaterialType, UploadRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const uploads = await readUploadRecords();
  const access = await getRequestAccess(request);
  if (access.userType === "internalFamily") return Response.json({ uploads });
  return Response.json({
    uploads: uploads
      .filter((upload) => upload.childId !== "jayadeep" && upload.childId !== "harini")
      .map((upload) => {
        const sanitized = { ...upload };
        delete sanitized.storagePath;
        delete sanitized.driveWebViewLink;
        delete sanitized.driveFileId;
        delete sanitized.originalSourceUrl;
        return sanitized;
      }),
    notice: "Downloads are restricted. You can learn from this material inside the app.",
  });
}

export async function POST(request: Request) {
  const uploadPolicy = await requirePolicy(request, "canUploadMaterials");
  if (!uploadPolicy.ok) return uploadPolicy.response;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  const id = randomUUID();
  const storagePath = getStorageFilePath(id, file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, bytes);

  const record: UploadRecord = {
    id,
    fileName: file.name,
    childId: (formData.get("childId") || "jayadeep") as ChildId,
    grade: String(formData.get("grade") || ""),
    subject: String(formData.get("subject") || "General"),
    materialType: (formData.get("materialType") || "Other") as MaterialType,
    chapter: String(formData.get("chapter") || ""),
    notes: String(formData.get("notes") || ""),
    status: "Ready for AI indexing",
    source: "Local Upload",
    mimeType: file.type,
    indexStatus: "Uploaded",
    sizeLabel: formatFileSize(file.size),
    uploadedAt: new Date().toISOString(),
    storagePath,
  };

  await saveUploadRecord(record);
  return Response.json({ upload: record });
}
