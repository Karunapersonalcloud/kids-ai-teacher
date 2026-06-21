import { prisma } from "@/lib/db";
import { findChildForParent, requireParentAccess } from "@/lib/parent-controls";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const auth = await requireParentAccess(request);
  if (!auth.ok) return auth.response;

  const childResult = await findChildForParent(childId, auth.access);
  if (!childResult.ok) return childResult.response;

  await prisma.child.update({
    where: { id: childId },
    data: {
      studentFailedLoginAttempts: 0,
      studentLockedAt: null,
      studentLockedReason: null,
      studentUnlockedAt: new Date(),
    },
  });

  return Response.json({ message: "Student account unlocked successfully." });
}
