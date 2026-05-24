import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";
import { findAccessById } from "@/lib/access-store";
import { getSessionUserIdFromCookie } from "@/lib/session";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);

  if (!userId) redirect("/login");

  const user = await findAccessById(userId);
  if (!user) redirect("/login");
  if (user.mustChangeCredentials) redirect("/change-credentials");
  if (user.role !== "admin" || user.userType !== "internalFamily" || user.status !== "active") redirect("/access-denied");

  return <AdminPanel />;
}
