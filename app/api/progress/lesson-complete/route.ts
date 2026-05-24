import { unique, updateProgress } from "@/lib/progress-store";
import type { ChildId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: ChildId; lesson?: string; subject?: string };
  if (!body.childId || !body.lesson) return Response.json({ error: "childId and lesson are required." }, { status: 400 });
  const progress = await updateProgress(body.childId, (record) => ({
    ...record,
    lessonsCompleted: unique([...record.lessonsCompleted, `${body.subject || "General"}: ${body.lesson}`]),
    starsEarned: record.starsEarned + 5,
  }));
  return Response.json({ progress });
}
