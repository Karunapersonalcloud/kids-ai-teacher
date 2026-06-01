import { hashPin, verifyPin } from "@/lib/credentials";
import { prisma } from "@/lib/db";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { parseCookieHeader } from "@/lib/request-access";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isPostgresEnabled()) {
      return Response.json({ error: "Student login is not configured in this environment." }, { status: 503 });
    }

    const body = (await request.json()) as { newPin?: string; confirmPin?: string };
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookieHeader(cookieHeader);
    if (cookies.kids_access_role !== "student") {
      return Response.json({ error: "Student session required." }, { status: 403 });
    }

    const sessionStudentId = getSessionUserIdFromCookie(cookieHeader) || cookies.kids_student_id;
    if (!sessionStudentId) {
      return Response.json({ error: "Student session not found." }, { status: 401 });
    }

    const child = await prisma.child.findUnique({
      where: { id: sessionStudentId },
      select: { id: true, studentPasswordHash: true },
    });
    if (!child) {
      return Response.json({ error: "Student account not found." }, { status: 404 });
    }

    const newPin = (body.newPin || "").trim();
    const confirmPin = (body.confirmPin || "").trim();
    if (!newPin || newPin.length < 6) {
      return Response.json({ error: "New PIN/password must be at least 6 characters." }, { status: 400 });
    }
    if (newPin !== confirmPin) {
      return Response.json({ error: "Confirm PIN/password must match." }, { status: 400 });
    }

    const currentMatch = verifyPin(child.studentPasswordHash, newPin);
    if (currentMatch.ok) {
      return Response.json({ error: "New PIN/password must be different from the current one." }, { status: 400 });
    }

    await prisma.child.update({
      where: { id: child.id },
      data: {
        studentPasswordHash: hashPin(newPin),
        mustChangeStudentPassword: false,
      },
    });

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", "kids_must_change_student_password=false; Path=/; SameSite=Lax");
    return new Response(JSON.stringify({ ok: true, redirectTo: "/student/dashboard" }), { headers });
  } catch (error) {
    const err = error as { code?: string; message?: string; name?: string };
    console.error("[auth][change-student-password] Failed", { code: err?.code, name: err?.name, message: err?.message });
    return Response.json({ error: "Could not update student password." }, { status: 500 });
  }
}
