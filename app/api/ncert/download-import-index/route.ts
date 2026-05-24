import { downloadImportIndexNcertBook } from "@/lib/ncert-downloader";
import { requirePolicy } from "@/lib/request-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const policy = await requirePolicy(request, "canImportFromDrive");
  if (!policy.ok) return policy.response;
  const body = (await request.json()) as { bookId?: string };
  if (!body.bookId) {
    return Response.json({ error: "bookId is required." }, { status: 400 });
  }

  try {
    return Response.json(await downloadImportIndexNcertBook(body.bookId));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "NCERT download, import, and index failed." }, { status: 400 });
  }
}
