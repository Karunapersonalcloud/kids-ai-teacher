import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import { createHomeworkSubmission, listHomeworkForChild } from "@/lib/homework-store";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const runtime = "nodejs";

async function getSessionUser() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);
  if (!userId) return undefined;
  return findAccessById(userId);
}

async function getOwnedChild(userId: string, childId: string) {
  if (!isPostgresEnabled()) return { id: childId, userId };
  return prisma.child.findFirst({ where: { id: childId, userId }, select: { id: true, userId: true } });
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });
  const url = new URL(request.url);
  const childId = url.searchParams.get("childId");
  if (!childId) return Response.json({ error: "childId is required." }, { status: 400 });
  const child = await getOwnedChild(user.id, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });
  return Response.json({ submissions: await listHomeworkForChild(childId) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Sign-in required." }, { status: 401 });

  const form = await request.formData();
  const childId = String(form.get("childId") || "");
  if (!childId) return Response.json({ error: "childId is required." }, { status: 400 });
  const child = await getOwnedChild(user.id, childId);
  if (!child) return Response.json({ error: "Child not found." }, { status: 404 });

  const file = form.get("file");
  let filePath: string | undefined;
  if (file instanceof File && file.size > 0) {
    const ext = path.extname(file.name) || ".jpg";
    const dir = path.join(process.cwd(), "storage", "homework");
    await fs.mkdir(dir, { recursive: true });
    const storedName = `${randomUUID()}${ext}`;
    const target = path.join(dir, storedName);
    await fs.writeFile(target, Buffer.from(await file.arrayBuffer()));
    filePath = target;
  }

  const submission = await createHomeworkSubmission({
    userId: user.id,
    childId,
    subject: String(form.get("subject") || ""),
    chapter: String(form.get("chapter") || ""),
    topic: String(form.get("topic") || ""),
    note: String(form.get("note") || ""),
    filePath,
  });

  return Response.json({ submission });
}
