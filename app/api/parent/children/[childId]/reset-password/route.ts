import { hashPin } from "@/lib/credentials";
import { prisma } from "@/lib/db";
import { findChildForParent, requireParentAccess } from "@/lib/parent-controls";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const auth = await requireParentAccess(request);
  if (!auth.ok) return auth.response;

  const childResult = await findChildForParent(childId, auth.access);
  if (!childResult.ok) return childResult.response;

  const body = (await request.json()) as { newPin?: string };
  const newPin = (body.newPin || "").trim();
  if (!newPin) {
    return Response.json({ error: "Please provide a new PIN or password." }, { status: 400 });
  }

  await prisma.child.update({
    where: { id: childId },
    data: {
      studentPasswordHash: hashPin(newPin),
      mustChangeStudentPassword: false,
    },
  });

  return Response.json({ message: "Student PIN/password has been reset successfully." });
}
