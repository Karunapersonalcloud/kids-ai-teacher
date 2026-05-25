import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SubjectActions } from "@/components/subjects/subject-actions";
import { children, getChild, getSubjectBySlug } from "@/lib/mock-data";
import { getSubjectMaterialState, resolveChaptersForChildSubject, type ResolvedChapter } from "@/lib/learning/chapter-resolver";
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
  const board = "CBSE";
  const chapters = await resolveChaptersForChildSubject({ childId, grade: childProfile.grade, board, subject: subject.name });
  const materialState = await getSubjectMaterialState({ childId, grade: childProfile.grade, board, subject: subject.name });

  return (
    <AppShell activeChildAvatar={childProfile.avatar}>
      <PageHeader
        badge={`${childProfile.grade} · ${board}`}
        title={`${subject.name} for ${childProfile.name}`}
        subtitle={subject.description}
        actions={
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ${subject.color}`}>
              <Icon className="h-8 w-8" />
            </div>
            <Link href={`/ai-teacher?subject=${subject.slug}&child=${childId}`} className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white shadow-sm">
              Ask AI Teacher
            </Link>
          </div>
        }
      />

      <div className="grid w-full gap-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-purple-700">Chapters & Concepts</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">Student → Subject → Chapter → Concept → Visual Lesson / Practice / Quiz / Exam</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${materialState.status === "indexed" ? "bg-green-50 text-green-700" : materialState.status === "pending_extraction" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
              {materialState.status === "indexed" ? "Uploaded material ready" : materialState.status === "pending_extraction" ? "Extraction pending" : "Catalog view"}
            </span>
          </div>

          <div className={`mb-4 rounded-2xl p-4 text-sm font-bold ${materialState.status === "indexed" ? "bg-green-50 text-green-800" : materialState.status === "pending_extraction" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"}`}>
            {materialState.message}
            {materialState.status === "pending_extraction" && (
              <Link href={`/uploads?child=${childId}&subject=${subject.slug}`} className="ml-2 underline">
                Extract chapters
              </Link>
            )}
          </div>

          <div className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {chapters.map((chapter) => (
              <ChapterCard key={`${chapter.chapterNumber}-${chapter.chapterName}`} chapter={chapter} childId={childId} subjectName={subject.name} subjectSlug={subject.slug} />
            ))}
          </div>
        </section>

        <aside className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-black text-purple-700">Uploaded Materials</h2>
            <div className="space-y-3">
              {materialState.uploads.slice(0, 5).map((upload) => (
                <div key={upload.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="font-black">{upload.fileName}</div>
                  <div className="text-xs font-semibold text-slate-500">{upload.materialType} • {upload.source || "Local Upload"} • {upload.indexStatus || upload.status}</div>
                </div>
              ))}
              {!materialState.uploads.length && (
                <div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-500">
                  No textbook uploaded yet for this subject.
                </div>
              )}
            </div>
          </section>
          <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
            <h2 className="font-black">AI Study Path</h2>
            <p className="mt-2 text-sm font-semibold text-white/85">Start from basics, use visuals, practice small questions, then prepare for test-style answers.</p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function ChapterCard({
  chapter,
  childId,
  subjectName,
  subjectSlug,
}: {
  chapter: ResolvedChapter;
  childId: ChildId;
  subjectName: string;
  subjectSlug: string;
}) {
  const sourceLabel = {
    uploaded_material: "Uploaded PDF",
    ncert_catalog: "NCERT official",
    static_catalog: "Fallback catalog",
    fallback: "No textbook uploaded yet",
  }[chapter.source];
  const status = chapter.source === "uploaded_material" ? "In progress" : "Not started";
  const chapterSlug = `${chapter.chapterNumber}-${chapter.chapterName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">Chapter {chapter.chapterNumber}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{sourceLabel}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-green-700">{status}</span>
          </div>
          <h3 className="mt-3 text-xl font-black text-slate-950">{chapter.chapterName}</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">{chapter.concepts.length} concepts/topics</p>
          {chapter.warning && <p className="mt-2 text-sm font-bold text-amber-700">{chapter.warning}</p>}
        </div>
        <Link href={`/subjects/${subjectSlug}/chapters/${chapterSlug}?child=${childId}`} className="rounded-2xl bg-purple-600 px-4 py-2 text-center text-sm font-black text-white">
          Open Chapter
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chapter.concepts.slice(0, 8).map((concept) => (
          <Link
            key={concept}
            href={`/visual-learning?child=${childId}&subject=${subjectSlug}&chapter=${chapter.chapterNumber}&concept=${encodeURIComponent(concept)}`}
            className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 hover:text-purple-700"
          >
            {concept}
          </Link>
        ))}
      </div>

      <div className="mt-2">
        <SubjectActions childId={childId} subject={subjectName} subjectSlug={subjectSlug} chapter={chapter.chapterName} chapterNumber={chapter.chapterNumber} concept="All Concepts" />
      </div>
    </article>
  );
}
