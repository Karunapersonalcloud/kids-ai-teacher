import { prisma } from "@/lib/db";
import { findChildForParent, requireParentAccess } from "@/lib/parent-controls";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const auth = await requireParentAccess(request);
  if (!auth.ok) return auth.response;

  const childResult = await findChildForParent(childId, auth.access);
  if (!childResult.ok) return childResult.response;

  const body = (await request.json()) as { enabled?: boolean };
  if (typeof body.enabled !== "boolean") {
    return Response.json({ error: "Please specify true or false for enabled." }, { status: 400 });
  }

  await prisma.child.update({
    where: { id: childId },
    data: { studentLoginEnabled: body.enabled },
  });

  return Response.json({ message: body.enabled ? "Student login enabled." : "Student login disabled." });
}
