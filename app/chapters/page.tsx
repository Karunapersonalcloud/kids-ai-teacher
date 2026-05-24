import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { findAccessById } from "@/lib/access-store";
import { listAllChaptersForGrade } from "@/lib/chapter-catalog";
import { listChapterMasteryForChild, type ChapterStatus } from "@/lib/chapter-mastery-store";
import { prisma } from "@/lib/db";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

type SearchParams = { childId?: string };

export default async function ChaptersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);
  if (!userId) redirect("/login");
  const user = await findAccessById(userId);
  if (!user) redirect("/login");

  const params = await searchParams;
  const children = isPostgresEnabled()
    ? await prisma.child.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, grade: true } })
    : [];

  if (children.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">No child profiles yet</h1>
          <p className="mt-2 text-slate-600">Register a child first to start chapter learning.</p>
          <Link href="/register" className="mt-4 inline-block rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">Register a child</Link>
        </div>
      </main>
    );
  }

  const selected = (params.childId && children.find((c) => c.id === params.childId)) || children[0];
  const chapters = listAllChaptersForGrade(selected.grade);
  const mastery = await listChapterMasteryForChild(selected.id);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">Mastery Learning</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Chapters for {selected.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{selected.grade} · 95% required to mark a chapter mastered.</p>
        </header>

        {children.length > 1 && (
          <nav className="flex flex-wrap gap-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100" aria-label="Switch child">
            {children.map((child) => {
              const active = child.id === selected.id;
              return (
                <Link
                  key={child.id}
                  href={`/chapters?childId=${child.id}`}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-purple-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {child.name}
                  <span className={`ml-2 text-xs ${active ? "text-purple-100" : "text-slate-500"}`}>{child.grade}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {chapters.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-slate-600">Chapter packs for {selected.grade} are being added. Check back soon.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {chapters.map((ch) => {
              const record = mastery.find((m) => m.subject === ch.subject && m.chapter === ch.chapter);
              const status: ChapterStatus = record?.status ?? "locked";
              return (
                <li key={ch.chapterId} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusChip status={status} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ch.subject}</span>
                      </div>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900">{ch.chapter}</h2>
                      <p className="mt-1 text-sm text-slate-600">{ch.description}</p>
                      {record && (
                        <p className="mt-2 text-xs text-slate-500">
                          Best exam score: <span className="font-semibold text-slate-700">{Math.round(record.masteryScore)}%</span> · Attempts: {record.attempts}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/chapters/precheck?childId=${selected.id}&chapterId=${ch.chapterId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Pre-check <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/chapters/exam?childId=${selected.id}&chapterId=${ch.chapterId}`}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold ${
                          status === "locked"
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                        aria-disabled={status === "locked"}
                      >
                        Chapter exam <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function StatusChip({ status }: { status: ChapterStatus }) {
  const map: Record<ChapterStatus, { tone: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    locked: { tone: "bg-slate-100 text-slate-600", label: "Locked", Icon: Lock },
    learning: { tone: "bg-blue-50 text-blue-700", label: "Learning", Icon: BookOpen },
    revision: { tone: "bg-amber-50 text-amber-800", label: "Revision", Icon: RefreshCw },
    mastered: { tone: "bg-green-50 text-green-700", label: "Mastered", Icon: CheckCircle2 },
  };
  const { tone, label, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
