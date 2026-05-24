import { SubjectsClient } from "@/components/subjects/subjects-client";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { findAccessById } from "@/lib/access-store";
import { getSubjectsForStudent } from "@/lib/grade-catalog";
import { getSessionUserIdFromCookie } from "@/lib/session";

export default async function SubjectsPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("kids_user_type")?.value === "externalUser") {
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const userId = getSessionUserIdFromCookie(cookieHeader);
    const access = userId ? await findAccessById(userId) : undefined;
    const subjects = getSubjectsForStudent(access?.grade || "Class 9", {
      r1Language: access?.r1Language,
      r2Language: access?.r2Language,
      r3Language: access?.r3Language,
    });

    return (
      <AppShell>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black text-purple-700">My Subjects</h1>
          <p className="mt-1 font-semibold text-slate-500">Subjects are based on the languages selected during registration.</p>
        </section>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <Link key={subject} href={`/subjects/${encodeURIComponent(subject.toLowerCase().replaceAll(" ", "-").replaceAll("/", ""))}`} className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:scale-[1.01]">
              <h2 className="text-2xl font-black text-purple-800">{subject}</h2>
              <p className="mt-2 min-h-14 text-sm font-semibold leading-6 text-slate-600">Open AI teaching, visual lessons, quizzes, and revision for {subject}.</p>
              <span className="mt-4 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Selected subject</span>
            </Link>
          ))}
        </div>
      </AppShell>
    );
  }
  return <SubjectsClient />;
}
