import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { SubjectActions } from "@/components/subjects/subject-actions";
import { listChaptersForGradeSubject } from "@/lib/chapter-catalog";
import { children, getChild, getSubjectBySlug } from "@/lib/mock-data";
import { readUploadRecords } from "@/lib/local-uploads";
import type { ChildId } from "@/lib/types";

export default async function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: string }>;
  searchParams: Promise<{ child?: string }>;
}) {
  const { subject: subjectSlug } = await params;
  const { child = "jayadeep" } = await searchParams;
  const childId = (children.some((item) => item.id === child) ? child : "jayadeep") as ChildId;
  const childProfile = getChild(childId);
  const subject = getSubjectBySlug(subjectSlug);
  const Icon = subject.icon;
  const catalogSubjectName = subject.name === "Maths" ? "Mathematics" : subject.name;
  const masteryChapters = listChaptersForGradeSubject(childProfile.grade, catalogSubjectName);
  const uploadRecords = await readUploadRecords();
  const subjectNames = new Set([subject.name, subject.slug, subject.name.replace("Maths", "Mathematics")].map((item) => item.toLowerCase()));
  const uploadedMaterials = uploadRecords.filter((upload) => upload.childId === childId && subjectNames.has(upload.subject.toLowerCase()));
  const importedChapters = uploadedMaterials.filter((upload) => upload.materialType === "Textbook");

  return (
    <AppShell activeChildAvatar={childProfile.avatar}>
      <section className={`rounded-3xl border p-6 shadow-sm ${subject.bg} ${subject.border}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white ${subject.color}`}>
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black">{subject.name} for {childProfile.name}</h1>
              <p className="mt-1 font-semibold text-slate-600">{subject.description}</p>
            </div>
          </div>
          <Link href={`/ai-teacher?subject=${subject.slug}&child=${childId}`} className="rounded-xl bg-purple-600 px-5 py-3 text-center font-black text-white shadow-sm">
            Teach this topic
          </Link>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-black text-purple-700">Chapters & Topics</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(masteryChapters.length ? masteryChapters : subject.chapters).map((chapterItem) => {
              const chapter = typeof chapterItem === "string" ? chapterItem : chapterItem.chapter;
              const chapterId = typeof chapterItem === "string" ? undefined : chapterItem.chapterId;
              return (
              <article key={chapter} className="rounded-2xl bg-slate-50 p-4">
                <h3 className="font-black">{chapter}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Start with pre-check, then learn visually, practice, and take a strict 95% mastery exam.
                </p>
                <SubjectActions childId={childId} subject={subject.name} subjectSlug={subject.slug} chapter={chapter} />
                <Link
                  href={`/subjects/${subject.slug}/chapters/${encodeURIComponent(chapter.toLowerCase().replaceAll(" ", "-"))}?child=${childId}${chapterId ? `&chapterId=${chapterId}` : ""}`}
                  className="mt-3 inline-flex rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white"
                >
                  Open mastery flow
                </Link>
              </article>
              );
            })}
            {importedChapters.map((material) => (
              <article key={material.id} className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">{material.source || "Uploaded Material"}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-green-700">{material.indexStatus || material.status}</span>
                </div>
                <h3 className="font-black">{material.chapter || material.fileName}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-500">{material.fileName}</p>
                <SubjectActions childId={childId} subject={subject.name} subjectSlug={subject.slug} chapter={material.chapter || material.fileName} />
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-black text-purple-700">Uploaded Materials</h2>
            <div className="space-y-3">
              {uploadedMaterials.slice(0, 5).map((upload) => (
                <div key={upload.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="font-black">{upload.fileName}</div>
                  <div className="text-xs font-semibold text-slate-500">{upload.materialType} • {upload.source || "Local Upload"} • {upload.indexStatus || upload.status}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl bg-purple-600 p-5 text-white shadow-sm">
            <h2 className="font-black">AI Study Path</h2>
            <p className="mt-2 text-sm font-semibold text-white/85">Start from basics, use visuals, practice small questions, then prepare for test-style answers.</p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
