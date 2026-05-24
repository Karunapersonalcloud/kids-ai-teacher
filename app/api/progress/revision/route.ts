import { unique, updateProgress } from "@/lib/progress-store";
import type { ChildId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: ChildId; topic?: string; subject?: string };
  if (!body.childId || !body.topic) return Response.json({ error: "childId and topic are required." }, { status: 400 });
  const progress = await updateProgress(body.childId, (record) => ({
    ...record,
    topicsRevised: unique([...record.topicsRevised, `${body.subject || "General"}: ${body.topic}`]),
    starsEarned: record.starsEarned + 3,
  }));
  return Response.json({ progress });
}
