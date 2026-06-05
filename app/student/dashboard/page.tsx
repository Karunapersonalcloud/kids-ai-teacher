import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Brain, CheckCircle2, Sparkles, Target, Trophy } from "lucide-react";
import { getAdaptiveLearningForChild } from "@/lib/adaptive-learning-store";
import { prisma } from "@/lib/db";
import { getLatestDiagnosticForChild } from "@/lib/diagnostic-store";
import { isPostgresEnabled } from "@/lib/persistence-provider";

type StudentChild = {
  id: string;
  userId?: string;
  name: string;
  grade: string;
};

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("kids_access_role")?.value;
  if (role !== "student") {
    redirect("/login");
  }

  const studentId = decodeURIComponent(cookieStore.get("kids_student_id")?.value || cookieStore.get("kids_user_id")?.value || "");
  if (!studentId) redirect("/login");

  const cookieName = decodeURIComponent(cookieStore.get("kids_student_name")?.value || "Student");
  const cookieGrade = decodeURIComponent(cookieStore.get("kids_student_grade")?.value || "");
  const parentUserId = decodeURIComponent(cookieStore.get("kids_parent_user_id")?.value || "");
  const child = await getStudentChild({ studentId, fallbackName: cookieName, fallbackGrade: cookieGrade, parentUserId });
  const diagnostic = await getLatestDiagnosticForChild(child.id);
  const adaptive = await getAdaptiveLearningForChild({
    userId: child.userId,
    childId: child.id,
    childName: child.name,
    enrolledGrade: child.grade,
    diagnostic,
  });
  const today = adaptive.todayPlan[0];
  const weakTopics = adaptive.weakAreas.length ? adaptive.weakAreas : adaptive.foundationTopics;
  const progress = Math.min(100, Math.max(0, adaptive.examReadiness.currentReadinessPercentage));

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-purple-700">Student Learning Dashboard</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome, {child.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {child.grade} · Current phase: <span className="font-semibold text-slate-900">{adaptive.currentPhase}</span>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Actual" value={adaptive.actualLearningLevel} tone="purple" />
              <Metric label="Ready" value={`${progress}%`} tone="blue" />
              <Metric label="Target" value={`${adaptive.examReadiness.targetScore}%`} tone="green" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <TodayLessonCard task={today} childId={child.id} />
            <WeakPracticeCard weakTopics={weakTopics} />
            <ProgressCard progress={progress} predicted={adaptive.examReadiness.predictedScore} blockers={adaptive.examReadiness.topicsBlockingTarget} />
          </div>

          <aside className="space-y-4">
            <ActionCard
              href={visualHref(today?.subject || "Mathematics", today?.topic || weakTopics[0] || "Fractions")}
              icon={Sparkles}
              title="Visual Teacher Mode"
              text="Watch the concept with animated board steps."
              tone="purple"
            />
            <ActionCard href="/quizzes" icon={BookOpen} title="Practice quiz" text="Try a quick quiz after the visual lesson." tone="green" />
            <ActionCard href="/chapters" icon={Target} title="Chapter path" text="Use pre-checks before class-level chapters." tone="blue" />
            <BadgesCard adaptivePhase={adaptive.currentPhase} masteredCount={adaptive.masteryMap.filter((item) => item.status === "Mastered" || item.status === "Exam-ready").length} />
          </aside>
        </section>
      </div>
    </main>
  );
}

async function getStudentChild({
  studentId,
  fallbackName,
  fallbackGrade,
  parentUserId,
}: {
  studentId: string;
  fallbackName: string;
  fallbackGrade: string;
  parentUserId: string;
}): Promise<StudentChild> {
  if (isPostgresEnabled()) {
    const child = await prisma.child.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true, name: true, grade: true },
    });
    if (child) return { id: child.id, userId: child.userId || undefined, name: child.name, grade: child.grade };
  }
  return {
    id: studentId,
    userId: parentUserId || undefined,
    name: fallbackName,
    grade: fallbackGrade || "Class 9",
  };
}

function TodayLessonCard({ task, childId }: { task: { title: string; subject: string; topic: string; action: string; minutes: number } | undefined; childId: string }) {
  const safeTask = task || {
    title: "Complete baseline diagnostic",
    subject: "Overall",
    topic: "Baseline",
    action: "Ask your parent to start the baseline diagnostic so the app can choose the right level.",
    minutes: 30,
  };
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-slate-900">Today&rsquo;s lesson</h2>
      </div>
      <h3 className="mt-3 text-2xl font-bold text-slate-950">{safeTask.title}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-600">{safeTask.action}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">{safeTask.subject}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{safeTask.topic}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{safeTask.minutes} min</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={visualHref(safeTask.subject, safeTask.topic)} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">
          Continue learning <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={`/chapters?childId=${childId}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
          Open chapter flow
        </Link>
      </div>
    </section>
  );
}

function WeakPracticeCard({ weakTopics }: { weakTopics: string[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-semibold text-slate-900">Weak-topic practice</h2>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {weakTopics.slice(0, 6).map((topic) => (
          <Link key={topic} href={visualHref("Mathematics", topic)} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-800 hover:bg-purple-50">
            {topic}
            <span className="mt-2 block text-xs text-slate-500">Explain again, show another visual, then retry.</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProgressCard({ progress, predicted, blockers }: { progress: number; predicted: number; blockers: string[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-slate-900">Path to 95%</h2>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>Readiness</span>
        <span>{progress}% now · {predicted}% predicted</span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-purple-600" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {blockers.slice(0, 5).map((topic) => (
          <span key={topic} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            {topic}
          </span>
        ))}
      </div>
    </section>
  );
}

function BadgesCard({ adaptivePhase, masteredCount }: { adaptivePhase: string; masteredCount: number }) {
  const badges = ["Diagnostic Starter", adaptivePhase, masteredCount ? `${masteredCount} mastered` : "Practice Builder"];
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <h3 className="text-sm font-semibold text-slate-900">Rewards</h3>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span key={badge} className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  text,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  tone: "purple" | "green" | "blue";
}) {
  const tones: Record<typeof tone, string> = {
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  };
  return (
    <Link href={href} className={`block rounded-3xl p-5 shadow-sm transition ${tones[tone]}`}>
      <Icon className="h-6 w-6" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{text}</p>
    </Link>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "purple" | "blue" | "green" }) {
  const tones: Record<typeof tone, string> = {
    purple: "bg-purple-50 text-purple-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <div className={`min-w-[88px] rounded-2xl px-3 py-2 ${tones[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

function visualHref(subject: string, topic: string) {
  return `/visual-learning?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;
}
