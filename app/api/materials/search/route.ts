import { type NextRequest } from "next/server";
import { searchChunks } from "@/lib/rag-store";
import { getRequestAccess } from "@/lib/request-access";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const access = await getRequestAccess(request);
  const q = request.nextUrl.searchParams.get("q") || "";
  const childId = request.nextUrl.searchParams.get("childId") || undefined;
  const subject = request.nextUrl.searchParams.get("subject") || undefined;
  const fileId = request.nextUrl.searchParams.get("fileId") || undefined;
  const results = await searchChunks(q, { childId, subject, fileId, limit: 8 });
  if (access.userType !== "internalFamily") {
    return Response.json({
      query: q,
      results: results.map((result) => {
        const sanitized: Record<string, unknown> = { ...result, textPreview: "Content preview is restricted. Ask the AI Teacher inside the app." };
        delete sanitized.text;
        delete sanitized.originalSourceUrl;
        return sanitized;
      }),
    });
  }
  return Response.json({ query: q, results });
}
