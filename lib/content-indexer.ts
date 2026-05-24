import { extractTextFromFile, getParserSupportLabel } from "./document-parser";
import { readUploadRecords, updateUploadRecord } from "./local-uploads";
import { replaceFileChunks } from "./rag-store";

export async function indexMaterial(fileId: string) {
  const uploads = await readUploadRecords();
  const upload = uploads.find((item) => item.id === fileId);

  if (!upload) {
    throw new Error("Material not found.");
  }

  if (!upload.storagePath) {
    await updateUploadRecord(fileId, { indexStatus: "Failed", indexError: "This demo seed file has no local storage path. Upload the file again to index it." });
    throw new Error("No local file path found for this material.");
  }

  const imageLike = /\.(jpg|jpeg|png)$/i.test(upload.fileName);
  await updateUploadRecord(fileId, { indexStatus: imageLike ? "OCR Pending" : "Parsing", indexError: undefined });
  const text = await extractTextFromFile(upload.storagePath, upload.fileName);
  if (imageLike) {
    await updateUploadRecord(fileId, { indexStatus: "OCR Complete" });
  }

  if (!text.trim()) {
    const support = getParserSupportLabel(upload.fileName);
    await updateUploadRecord(fileId, { indexStatus: "Failed", indexError: `${support}. No readable text extracted.` });
    throw new Error(`${support}. No readable text extracted.`);
  }

  const chunks = await replaceFileChunks(upload, text);
  await updateUploadRecord(fileId, { indexStatus: "Indexed", status: "Indexed", indexError: undefined });
  return { uploadId: fileId, chunksIndexed: chunks.length };
}
