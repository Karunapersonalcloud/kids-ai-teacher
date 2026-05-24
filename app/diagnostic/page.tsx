import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DiagnosticClient } from "@/components/diagnostic/diagnostic-client";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import { getLatestDiagnosticForChild } from "@/lib/diagnostic-store";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

type SearchParams = { childId?: string };

export default async function DiagnosticPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);
  if (!userId) redirect("/login");
  const user = await findAccessById(userId);
  if (!user) redirect("/login");

  const params = await searchParams;
  const children = isPostgresEnabled()
    ? await prisma.child.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } })
    : [];

  if (!children.length) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">No child profile found</h1>
          <p className="mt-2 text-slate-600">
            We could not find any child profile linked to your account yet. Please complete approval, or register a child to start the diagnostic.
          </p>
          <Link href="/parent" className="mt-4 inline-flex items-center rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">
            Go to Parent Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const selectedChild = params.childId
    ? children.find((c) => c.id === params.childId) || children[0]
    : children[0];
  const latest = await getLatestDiagnosticForChild(selectedChild.id);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <Link href="/parent" className="text-sm font-semibold text-purple-700 hover:underline">← Parent Dashboard</Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Baseline Diagnostic</h1>
          <p className="mt-2 text-sm text-slate-600">
            A short, honest check to understand your child&rsquo;s current level. The result helps us choose the right starting point and a daily plan.
          </p>

          {children.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {children.map((child) => {
                const active = child.id === selectedChild.id;
                return (
                  <Link
                    key={child.id}
                    href={`/diagnostic?childId=${child.id}`}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      active ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {child.name} · {child.grade}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        <DiagnosticClient
          childId={selectedChild.id}
          childName={selectedChild.name}
          grade={selectedChild.grade}
          existingResult={latest || null}
        />
      </div>
    </main>
  );
}
