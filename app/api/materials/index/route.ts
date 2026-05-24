import { indexMaterial } from "@/lib/content-indexer";
import { requirePolicy } from "@/lib/request-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const policy = await requirePolicy(request, "canIndexMaterials");
  if (!policy.ok) return policy.response;
  const body = (await request.json()) as { fileId?: string };
  if (!body.fileId) {
    return Response.json({ error: "fileId is required." }, { status: 400 });
  }

  try {
    const result = await indexMaterial(body.fileId);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Indexing failed." }, { status: 400 });
  }
}
