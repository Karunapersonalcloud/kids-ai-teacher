"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { VisualLessonPlayer } from "@/components/learning/visual-lesson-player";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect } from "@/components/shared/controls";
import { PageHeader } from "@/components/shared/page-header";
import {
  getChapterByNumber,
  getChaptersForGradeSubject,
  getDefaultVisualSubjectsForGrade,
  normalizeSubject,
  type LearningChapter,
} from "@/lib/learning/chapter-catalog";
import { children, getChild, getSubjectsForChild, mockVisualLesson } from "@/lib/mock-data";
import type { ChildId, VisualLesson } from "@/lib/types";

type VisualSelection = {
  childId: ChildId;
  subject: string;
  chapterNumber: number;
  concept: string;
};

type VisualLearningClientProps = {
  initialParams?: {
    child?: string;
    subject?: string;
    chapter?: string;
    concept?: string;
    topic?: string;
  };
};

export function VisualLearningClient({ initialParams }: VisualLearningClientProps) {
  const [selection, setSelection] = useState<VisualSelection>(() => getInitialSelection(initialParams));
  const [lesson, setLesson] = useState<VisualLesson>(mockVisualLesson);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { childId, subject, chapterNumber, concept } = selection;
  const child = getChild(childId);
  const board = "CBSE";
  const subjectOptions = useMemo(() => getSubjectOptions(childId), [childId]);
  const chapters = useMemo(() => getChaptersForGradeSubject(child.grade, subject), [child.grade, subject]);
  const selectedChapter = getChapterByNumber(child.grade, subject, chapterNumber);
  const conceptOptions = ["All Concepts", ...selectedChapter.concepts];
  const selectedConcept = conceptOptions.includes(concept) ? concept : "All Concepts";
  const sceneCount = lesson.scenes?.length || 0;
  const slideCount = lesson.slides?.length || 0;

  async function createLesson() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai-teacher/visual-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          childName: child.name,
          grade: child.grade,
          board,
          subject,
          chapterNumber: selectedChapter.number,
          chapterName: selectedChapter.name,
          conceptName: selectedConcept,
          concepts: selectedChapter.concepts,
          topic: selectedConcept,
        }),
      });
      const rawResponse = await response.text();
      let data: Partial<VisualLesson> & { error?: string } = {};
      try {
        data = rawResponse ? (JSON.parse(rawResponse) as Partial<VisualLesson> & { error?: string }) : {};
      } catch {
        data = { error: "Could not read the lesson response. Please try again." };
      }
      if (!response.ok || data.error) {
        setError(data.error || "Could not create the lesson right now.");
        return;
      }
      setLesson(data as VisualLesson);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <PageHeader
        badge="Visual Learning"
        title="Create a focused visual lesson"
        subtitle="Select the student, subject, chapter, and concept. Use All Concepts for a complete chapter lesson or choose one concept for focused teaching."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ChildSelect
            value={childId}
            onChange={(nextChild) => {
              const nextSubject = getSubjectOptions(nextChild)[0];
              const nextChildProfile = getChild(nextChild);
              const nextChapter = getChaptersForGradeSubject(nextChildProfile.grade, nextSubject)[0];
              setSelection({
                childId: nextChild,
                subject: nextSubject,
                chapterNumber: nextChapter.number,
                concept: "All Concepts",
              });
            }}
          />
          <LabeledSelect
            label="Subject"
            value={subject}
            onChange={(nextSubject) => {
              const nextChapter = getChaptersForGradeSubject(child.grade, nextSubject)[0];
              setSelection({
                childId,
                subject: nextSubject,
                chapterNumber: nextChapter.number,
                concept: "All Concepts",
              });
            }}
            options={subjectOptions}
          />
          <label className="grid gap-1">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Chapter</span>
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm"
              value={chapterNumber}
              onChange={(event) => {
                const nextChapterNumber = Number(event.target.value);
                setSelection({
                  childId,
                  subject,
                  chapterNumber: nextChapterNumber,
                  concept: "All Concepts",
                });
              }}
            >
              {chapters.map((chapter) => (
                <option key={`${chapter.number}-${chapter.name}`} value={chapter.number}>
                  Chapter {chapter.number}: {chapter.name}
                </option>
              ))}
            </select>
          </label>
          <LabeledSelect label="Concept / Topic" value={selectedConcept} onChange={(nextConcept) => setSelection({ ...selection, concept: nextConcept })} options={conceptOptions} />
          <button onClick={createLesson} className="self-end rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800">
            {loading ? "Creating..." : "Create Visual Lesson"}
          </button>
        </div>
        <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
          {child.grade} · {subject} · {board} · Chapter {selectedChapter.number}: {selectedChapter.name} · Concept: {selectedConcept}
        </p>
      </section>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">{lesson.lessonTitle || lesson.title}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">{lesson.gradeLevel}</p>
            </div>
          </div>
          <div>
            <p className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {sceneCount ? `${sceneCount} animated scenes` : `${slideCount} teacher slides`}
            </p>
          </div>
        </div>
      </section>

      <VisualLessonPlayer
        key={`${lesson.title}-${selectedConcept}-${sceneCount}-${slideCount}`}
        lesson={lesson}
        grade={child.grade}
        board={board}
        subject={subject}
        chapter={selectedChapter}
        selectedConcept={selectedConcept}
        source="Catalog / uploaded material aware"
      />

      <button className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
        <Sparkles className="h-5 w-5" /> Ask AI to simplify more
      </button>
    </AppShell>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function getSubjectOptions(childId: ChildId) {
  const child = getChild(childId);
  const profileSubjects = getSubjectsForChild(childId).map((item) => item.name);
  if (profileSubjects.length > 0) return Array.from(new Set(profileSubjects));
  return getDefaultVisualSubjectsForGrade(child.grade);
}

function getInitialSelection(initialParams?: VisualLearningClientProps["initialParams"]): VisualSelection {
  const childParam = initialParams?.child as ChildId | undefined;
  const childId = children.some((item) => item.id === childParam) ? childParam! : "jayadeep";
  const subjectOptions = getSubjectOptions(childId);
  const child = getChild(childId);
  const subject = resolveSubjectParam(initialParams?.subject || null, subjectOptions);
  const topicParam = initialParams?.topic || null;
  const conceptParam = initialParams?.concept || topicParam;
  const chapters = getChaptersForGradeSubject(child.grade, subject);
  const chapter = resolveChapterParam(initialParams?.chapter || null, conceptParam, chapters);
  const concept = resolveConceptParam(conceptParam, chapter);
  return {
    childId,
    subject,
    chapterNumber: chapter.number,
    concept,
  };
}

function resolveSubjectParam(subjectParam: string | null, options: string[]) {
  if (!subjectParam) return options[0];
  const normalizedParam = normalizeSubject(subjectParam.replace(/-/g, " "));
  return options.find((option) => normalizeSubject(option).toLowerCase() === normalizedParam.toLowerCase() || option.toLowerCase() === subjectParam.toLowerCase()) || options[0];
}

function resolveChapterParam(chapterParam: string | null, topicParam: string | null, chapters: LearningChapter[]) {
  const chapterNumber = chapterParam ? Number(chapterParam.replace(/\D/g, "")) : NaN;
  if (Number.isFinite(chapterNumber)) {
    const byNumber = chapters.find((chapter) => chapter.number === chapterNumber);
    if (byNumber) return byNumber;
  }

  const text = topicParam?.toLowerCase();
  if (text) {
    const byName = chapters.find((chapter) => chapter.name.toLowerCase().includes(text) || text.includes(chapter.name.toLowerCase()));
    if (byName) return byName;
    const byConcept = chapters.find((chapter) => chapter.concepts.some((concept) => concept.toLowerCase().includes(text) || text.includes(concept.toLowerCase())));
    if (byConcept) return byConcept;
  }

  return chapters[0];
}

function resolveConceptParam(conceptParam: string | null, chapter: LearningChapter) {
  if (!conceptParam) return "All Concepts";
  const lower = conceptParam.toLowerCase();
  if (lower === "all" || lower === "all concepts") return "All Concepts";
  return chapter.concepts.find((concept) => concept.toLowerCase() === lower || concept.toLowerCase().includes(lower) || lower.includes(concept.toLowerCase())) || chapter.concepts[0] || conceptParam;
}
