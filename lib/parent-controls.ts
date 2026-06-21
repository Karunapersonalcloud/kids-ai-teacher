import { prisma } from "@/lib/db";
import { getRequestAccess, type RequestAccess } from "@/lib/request-access";

export async function requireParentAccess(request: Request) {
  const access = await getRequestAccess(request);
  if (access.role === "student") {
    return {
      ok: false as const,
      response: Response.json({ error: "Student access cannot perform this action." }, { status: 403 }),
    };
  }

  if (access.status !== "active" && access.status !== "trial") {
    return {
      ok: false as const,
      response: Response.json(
        { error: "Your account is not active. Parent features are available after approval." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, access };
}

export async function findChildForParent(childId: string, access: RequestAccess) {
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: {
      id: true,
      userId: true,
      studentLoginId: true,
      studentLoginEnabled: true,
      name: true,
      grade: true,
      studentPasswordHash: true,
      mustChangeStudentPassword: true,
      studentFailedLoginAttempts: true,
      studentLockedAt: true,
      studentLockedReason: true,
      studentUnlockedAt: true,
    },
  });

  if (!child || (access.role !== "admin" && child.userId !== access.userId)) {
    return {
      ok: false as const,
      response: Response.json({ error: "Child not found." }, { status: 404 }),
    };
  }

  return { ok: true as const, child };
}
