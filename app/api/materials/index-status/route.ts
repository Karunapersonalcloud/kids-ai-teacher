import { readUploadRecords } from "@/lib/local-uploads";
import { readChunks } from "@/lib/rag-store";

export const runtime = "nodejs";

export async function GET() {
  const [uploads, chunks] = await Promise.all([readUploadRecords(), readChunks()]);
  return Response.json({
    materials: uploads.map((upload) => ({
      id: upload.id,
      fileName: upload.fileName,
      childId: upload.childId,
      subject: upload.subject,
      indexStatus: upload.indexStatus || (upload.status === "Indexed" ? "Indexed" : "Uploaded"),
      indexError: upload.indexError,
      chunks: chunks.filter((chunk) => chunk.fileId === upload.id).length,
    })),
  });
}
