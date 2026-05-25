import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { findAccessById } from "@/lib/access-store";
import { prisma } from "@/lib/db";
import { getLatestDiagnosticForChild } from "@/lib/diagnostic-store";
import { getSubjectsForStudent } from "@/lib/grade-catalog";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { getSessionUserIdFromCookie } from "@/lib/session";
import { normalizeSubmittedSubjects } from "@/lib/student-subjects";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("kids_user_type")?.value === "externalUser") {
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const userId = getSessionUserIdFromCookie(cookieHeader);
    const access = userId ? await findAccessById(userId) : undefined;

    // Mastery-flow gate: if any child of this approved parent has no DiagnosticResult,
    // send the parent to the diagnostic onboarding before the dashboard.
    if (access && isPostgresEnabled()) {
      const firstChildNeedingDiagnostic = await findFirstChildNeedingDiagnostic(access.id);
      if (firstChildNeedingDiagnostic) {
        redirect(`/diagnostic?childId=${firstChildNeedingDiagnostic}`);
      }
    }

    return <ExternalUserDashboard access={access} />;
  }
  return <DashboardHome />;
}

async function findFirstChildNeedingDiagnostic(userId: string): Promise<string | undefined> {
  const children = await prisma.child.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true } });
  for (const child of children) {
    const latest = await getLatestDiagnosticForChild(child.id);
    if (!latest) return child.id;
  }
  return undefined;
}

function ExternalUserDashboard({ access }: { access?: Awaited<ReturnType<typeof findAccessById>> }) {
  const subjects = getSubjectsForStudent(access?.grade || "Class 9", {
    r1Language: access?.r1Language,
    r2Language: access?.r2Language,
    r3Language: access?.r3Language,
  });
  const submittedSubjects = normalizeSubmittedSubjects(access?.submittedSubjects);
  const subjectLabels = submittedSubjects.length
    ? submittedSubjects.map((subject) => (subject.languageRole !== "Not Applicable" ? `${subject.languageRole} ${subject.subjectName}` : subject.subjectName))
    : subjects;
  return (
    <AppShell>
      <PageHeader
        badge="Approved user workspace"
        title="Welcome to ConceptKid"
        subtitle="Your child workspace is active. Family-only profiles, local textbook paths, and internal materials are hidden from external accounts."
      />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/ai-teacher" className="rounded-2xl bg-slate-950 p-5 font-black text-white">Ask AI Teacher</Link>
          <Link href="/visual-learning" className="rounded-2xl bg-blue-50 p-5 font-black text-blue-700">Create Visual Lesson</Link>
          <Link href="/quizzes" className="rounded-2xl bg-green-50 p-5 font-black text-green-700">Practice Quiz</Link>
        </div>
        <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-purple-100">
          <div className="text-sm font-black text-purple-700">Your selected school subjects</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {subjectLabels.map((subject) => (
              <span key={subject} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                {subject}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
          Downloads are restricted. You can learn from approved material inside the app.
        </div>
      </section>
    </AppShell>
  );
}
