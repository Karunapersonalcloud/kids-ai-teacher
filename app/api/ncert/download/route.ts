import { downloadNcertBook } from "@/lib/ncert-downloader";
import { requirePolicy } from "@/lib/request-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const policy = await requirePolicy(request, "canImportFromDrive");
  if (!policy.ok) return policy.response;
  const body = (await request.json()) as { bookId?: string; mode?: "all" | "selected"; selectedFileNames?: string[]; forceDownload?: boolean };
  if (!body.bookId) {
    return Response.json({ error: "bookId is required." }, { status: 400 });
  }

  try {
    const result = await downloadNcertBook(body.bookId, body.mode || "all", body.selectedFileNames || [], Boolean(body.forceDownload));
    return Response.json({
      ...result,
      downloadedCount: result.downloaded.length,
      skippedCount: result.skipped.length,
      failedCount: result.failed.length,
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "NCERT download failed." }, { status: 400 });
  }
}
