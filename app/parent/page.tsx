import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lock,
  RefreshCw,
  Sparkles,
  Target,
  UploadCloud,
  UserPlus,
} from "lucide-react";
import { findAccessById } from "@/lib/access-store";
import { listAllChaptersForGrade, type ChapterPack } from "@/lib/chapter-catalog";
import { listChapterMasteryForChild, type ChapterMasteryRecord, type ChapterStatus } from "@/lib/chapter-mastery-store";
import { prisma } from "@/lib/db";
import { getLatestDiagnosticForChild, type DiagnosticRecord } from "@/lib/diagnostic-store";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

type SearchParams = { childId?: string };

type ChildRow = {
  id: string;
  name: string;
  grade: string;
  board: string | null;
  weakSubjects: string | null;
  learningGoal: string | null;
};

export default async function ParentDashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const userId = getSessionUserIdFromCookie(cookieHeader);
  if (!userId) redirect("/login");
  const user = await findAccessById(userId);
  if (!user) redirect("/login");

  const children: ChildRow[] = isPostgresEnabled()
    ? (await prisma.child.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, grade: true, board: true, weakSubjects: true, learningGoal: true },
      }))
    : [];

  const params = await searchParams;

  if (children.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="w-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" /> No child profiles yet
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Welcome, {user.parentName}</h1>
          <p className="mt-2 text-slate-600">
            Your account is approved, but no child profiles are linked yet. Register a child to start the baseline diagnostic and create a daily learning plan.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <UserPlus className="h-4 w-4" /> Add a child
          </Link>
        </div>
      </main>
    );
  }

  const selected =
    (params.childId && children.find((c) => c.id === params.childId)) || children[0];
  const diagnostic = await getLatestDiagnosticForChild(selected.id);
  const chapters = listAllChaptersForGrade(selected.grade);
  const mastery = await listChapterMasteryForChild(selected.id);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="w-full max-w-none space-y-6">
        <Header parentName={user.parentName} childCount={children.length} />

        {children.length > 1 && <ChildSwitcher items={children} selectedId={selected.id} />}

        <div className="grid w-full gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8 2xl:col-span-9">
            <ChildProfileCard child={selected} diagnostic={diagnostic} />
            <DiagnosticCallout child={selected} diagnostic={diagnostic} />
            <ChapterProgressCard childId={selected.id} chapters={chapters} mastery={mastery} />
            <TodayPlanCard diagnostic={diagnostic} />
          </div>
          <aside className="space-y-4 xl:col-span-4 2xl:col-span-3">
            <SidebarAction
              href="/uploads"
              tone="purple"
              icon={UploadCloud}
              title="Upload textbook or homework"
              description="Share school books, worksheets, or homework photos."
            />
            <SidebarAction
              href="/parent/ai-review"
              tone="blue"
              icon={Sparkles}
              title="AI learning health check"
              description="Review missing uploads, weak areas, and parent actions."
            />
            <SidebarAction
              href="/progress"
              tone="green"
              icon={ClipboardCheck}
              title="Study report"
              description="See mastery, chapters cleared, and weak concepts."
            />
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50/40"
            >
              <UserPlus className="h-4 w-4" /> Add another child
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Header({ parentName, childCount }: { parentName: string; childCount: number }) {
  return (
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Parent Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Welcome, {parentName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {childCount === 1
              ? "Track today's plan, weak areas, and homework for your child."
              : `Track today's plan, weak areas, and homework across your ${childCount} children.`}
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Link href="/ai-teacher" className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700">
            Ask AI Teacher
          </Link>
          <Link href="/quizzes" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            Practice Quiz
          </Link>
        </div>
      </div>
    </header>
  );
}

function ChildSwitcher({ items, selectedId }: { items: ChildRow[]; selectedId: string }) {
  return (
    <nav className="flex flex-wrap gap-2 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-100" aria-label="Switch child">
      {items.map((child) => {
        const active = child.id === selectedId;
        return (
          <Link
            key={child.id}
            href={`/parent?childId=${child.id}`}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              active ? "bg-purple-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
            aria-current={active ? "true" : undefined}
          >
            <GraduationCap className="h-4 w-4 opacity-80" />
            <span>{child.name}</span>
            <span className={`text-xs ${active ? "text-purple-100" : "text-slate-500"}`}>{child.grade}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ChildProfileCard({ child, diagnostic }: { child: ChildRow; diagnostic: DiagnosticRecord | undefined }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{child.name}</h2>
          <p className="text-sm text-slate-500">{child.grade} · {child.board || "Board not set"}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Target" value="95%" tone="purple" />
          <Metric label="Mastery" value={diagnostic ? `${Math.round(diagnostic.percentage)}%` : "—"} tone="blue" />
          <Metric label="Risk" value={diagnostic?.riskLevel || "—"} tone={diagnostic?.riskLevel === "Low" ? "green" : diagnostic?.riskLevel === "Medium" ? "amber" : diagnostic?.riskLevel === "High" ? "red" : "slate"} />
        </div>
      </div>
      {child.learningGoal && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Goal: </span>
          {child.learningGoal}
        </div>
      )}
    </section>
  );
}

function DiagnosticCallout({ child, diagnostic }: { child: ChildRow; diagnostic: DiagnosticRecord | undefined }) {
  if (!diagnostic) {
    return (
      <section className="rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">First step</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold">Baseline diagnostic for {child.name}</h2>
        <p className="mt-2 max-w-xl text-sm text-white/90">
          Before learning starts, complete a short, honest check to see where {child.name} stands. We&rsquo;ll then build a daily plan and start the right first chapter.
        </p>
        <Link
          href={`/diagnostic?childId=${child.id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-purple-700 shadow-sm hover:bg-slate-50"
        >
          Start diagnostic
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Diagnostic done
          </span>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Current level</h2>
          <p className="text-sm text-slate-500">Recommended start: {diagnostic.recommendedStartLevel || "Grade level"}</p>
        </div>
        <Link
          href={`/diagnostic?childId=${child.id}`}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          View / retake
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ConceptList title="Strong areas" items={diagnostic.strongAreas} tone="green" empty="No strong areas yet." />
        <ConceptList title="Weak areas" items={diagnostic.weakAreas} tone="red" empty="No weak areas detected." />
      </div>
    </section>
  );
}

function ChapterProgressCard({
  childId,
  chapters,
  mastery,
}: {
  childId: string;
  chapters: ChapterPack[];
  mastery: ChapterMasteryRecord[];
}) {
  if (chapters.length === 0) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Chapter progress</h2>
        <p className="mt-2 text-sm text-slate-600">Chapter packs for this grade are being added. Meanwhile, complete the diagnostic above.</p>
      </section>
    );
  }
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Chapter progress</h2>
        <Link href={`/chapters?childId=${childId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-purple-700">
          Open chapters <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {chapters.slice(0, 6).map((ch) => {
          const record = mastery.find((m) => m.subject === ch.subject && m.chapter === ch.chapter);
          const status: ChapterStatus = record?.status ?? "locked";
          return (
            <li key={ch.chapterId} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ChapterStatusChip status={status} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ch.subject}</span>
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">{ch.chapter}</div>
                {record && (
                  <div className="text-xs text-slate-500">
                    Best: {Math.round(record.masteryScore)}% · Attempts: {record.attempts}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/chapters/precheck?childId=${childId}&chapterId=${ch.chapterId}`}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  Pre-check
                </Link>
                <Link
                  href={`/chapters/exam?childId=${childId}&chapterId=${ch.chapterId}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    status === "locked" ? "bg-slate-200 text-slate-500" : "bg-purple-600 text-white"
                  }`}
                  aria-disabled={status === "locked"}
                >
                  Exam
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ChapterStatusChip({ status }: { status: ChapterStatus }) {
  const map: Record<ChapterStatus, { tone: string; label: string; Icon: React.ComponentType<{ className?: string }> }> = {
    locked: { tone: "bg-slate-200 text-slate-600", label: "Locked", Icon: Lock },
    learning: { tone: "bg-blue-100 text-blue-700", label: "Learning", Icon: BookOpen },
    revision: { tone: "bg-amber-100 text-amber-800", label: "Revision", Icon: RefreshCw },
    mastered: { tone: "bg-green-100 text-green-700", label: "Mastered", Icon: CheckCircle2 },
  };
  const { tone, label, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function TodayPlanCard({ diagnostic }: { diagnostic: DiagnosticRecord | undefined }) {
  const plan = diagnostic?.learningPlan?.length
    ? diagnostic.learningPlan
    : [
        "Complete the baseline diagnostic to get a personalised plan.",
        "Once done, the first chapter starts with a short pre-check.",
        "Target 95% mastery in chapter exam before moving on.",
      ];
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-slate-900">Today&rsquo;s focus</h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {plan.map((step, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-purple-600">•</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "purple" | "blue" | "green" | "amber" | "red" | "slate" }) {
  const tones: Record<typeof tone, string> = {
    purple: "bg-purple-50 text-purple-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className={`min-w-[80px] rounded-2xl px-3 py-2 ${tones[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-0.5 text-base font-bold">{value}</div>
    </div>
  );
}

function ConceptList({ title, items, tone, empty }: { title: string; items: string[]; tone: "green" | "red"; empty: string }) {
  const toneClass = tone === "green" ? "text-green-700" : "text-red-700";
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className={`text-xs font-semibold uppercase tracking-wide ${toneClass}`}>{title}</div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SidebarAction({
  href,
  tone,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  tone: "purple" | "blue" | "green";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
  };
  return (
    <Link href={href} className={`block rounded-2xl p-4 shadow-sm transition ${toneClass[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="mt-1 text-xs leading-5 opacity-80">{description}</p>
    </Link>
  );
}
