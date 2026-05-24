import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeworkClient } from "@/components/homework/homework-client";
import { AppShell } from "@/components/shared/app-shell";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import { children as mockChildren } from "@/lib/mock-data";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);
  if (!userId) redirect("/login");
  const user = await findAccessById(userId);
  if (!user) redirect("/login");

  const childOptions = isPostgresEnabled()
    ? await prisma.child.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, grade: true } })
    : mockChildren.map((child) => ({ id: child.id, name: child.name, grade: child.grade }));

  return (
    <AppShell>
      <HomeworkClient childOptions={childOptions} />
    </AppShell>
  );
}
