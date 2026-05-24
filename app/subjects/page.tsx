import { SubjectsClient } from "@/components/subjects/subjects-client";
import { cookies } from "next/headers";
import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { findAccessById } from "@/lib/access-store";
import { getSubjectsForStudent } from "@/lib/grade-catalog";
import { readUploadRecords } from "@/lib/local-uploads";
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
    const uploads = await readUploadRecords();

    return (
      <AppShell>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-black text-purple-700">My Subjects</h1>
          <p className="mt-1 font-semibold text-slate-500">Subjects are based on the languages selected during registration.</p>
        </section>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard key={subject} subject={subject} grade={access?.grade || ""} uploads={uploads} />
          ))}
        </div>
      </AppShell>
    );
  }
  return <SubjectsClient />;
}

function SubjectCard({ subject, grade, uploads }: { subject: string; grade: string; uploads: Awaited<ReturnType<typeof readUploadRecords>> }) {
  const roleMatch = subject.match(/^(R[123])\s+(.+)$/);
  const language = roleMatch?.[2] || subject;
  const matchingUploads = uploads.filter((upload) => {
    const haystack = `${upload.grade} ${upload.subject} ${upload.fileName} ${upload.chapter} ${upload.bookTitle || ""}`.toLowerCase();
    return haystack.includes(grade.toLowerCase()) && (haystack.includes(subject.toLowerCase()) || haystack.includes(language.toLowerCase()));
  });
  const slug = encodeURIComponent(subject.toLowerCase().replaceAll(" ", "-").replaceAll("/", ""));

  return (
    <Link href={`/subjects/${slug}`} className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition hover:scale-[1.01]">
      <h2 className="text-2xl font-black text-purple-800">{subject}</h2>
      <p className="mt-2 min-h-14 text-sm font-semibold leading-6 text-slate-600">Open AI teaching, visual lessons, quizzes, and revision for {subject}.</p>
      {matchingUploads.length ? (
        <div className="mt-4 rounded-xl bg-green-50 p-3 text-xs font-bold leading-5 text-green-700">
          {matchingUploads.length} matching textbook/material file{matchingUploads.length === 1 ? "" : "s"} available.
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
          No textbook uploaded yet for {subject}. Parent/admin can upload textbook or import from NCERT/CBSE source.
          {roleMatch?.[1] === "R3" && grade.includes("9") ? " R3 material may use Class VI level textbooks as per CBSE transition guidance, where applicable." : ""}
        </div>
      )}
    </Link>
  );
}
