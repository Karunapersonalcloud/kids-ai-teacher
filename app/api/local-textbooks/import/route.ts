import { importLocalTextbooks } from "@/lib/local-textbook-importer";
import { requirePolicy } from "@/lib/request-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const policy = await requirePolicy(request, "canImportFromDrive");
  if (!policy.ok) return policy.response;
  const body = (await request.json()) as { folderKey?: string; importMode?: "all" | "selected"; fileNames?: string[] };
  if (!body.folderKey) {
    return Response.json({ error: "folderKey is required." }, { status: 400 });
  }

  try {
    const imported = await importLocalTextbooks(body.folderKey, body.importMode || "all", body.fileNames || []);
    return Response.json({ imported, importedCount: imported.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Import failed." }, { status: 400 });
  }
}
