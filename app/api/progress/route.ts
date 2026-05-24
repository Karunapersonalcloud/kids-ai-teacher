import { type NextRequest } from "next/server";
import { getProgress, readProgressRecords } from "@/lib/progress-store";
import type { ChildId } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId") as ChildId | null;
  if (childId) {
    return Response.json({ progress: await getProgress(childId) });
  }
  return Response.json({ progress: await readProgressRecords() });
}
