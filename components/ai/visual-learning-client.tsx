"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect } from "@/components/shared/controls";
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
  const { childId, subject, chapterNumber, concept } = selection;
  const child = getChild(childId);
  const board = "CBSE";
  const subjectOptions = useMemo(() => getSubjectOptions(childId), [childId]);
  const chapters = useMemo(() => getChaptersForGradeSubject(child.grade, subject), [child.grade, subject]);
  const selectedChapter = getChapterByNumber(child.grade, subject, chapterNumber);
  const conceptOptions = selectedChapter.concepts;
  const selectedConcept = conceptOptions.includes(concept) ? concept : conceptOptions[0] || "Introduction";

  async function createLesson() {
    setLoading(true);
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
        topic: selectedConcept,
      }),
    });
    const data = (await response.json()) as VisualLesson;
    setLesson(data);
    setLoading(false);
  }

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h1 className="text-2xl font-black text-slate-950">Create a Visual Lesson</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">Select chapter and concept to generate a focused visual lesson.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[220px_210px_minmax(260px,1fr)_minmax(220px,1fr)_auto]">
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
                concept: nextChapter.concepts[0] || "Introduction",
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
                concept: nextChapter.concepts[0] || "Introduction",
              });
            }}
            options={subjectOptions}
          />
          <label className="grid gap-1">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Chapter</span>
            <select
              className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm"
              value={chapterNumber}
              onChange={(event) => {
                const nextChapterNumber = Number(event.target.value);
                const nextChapter = getChapterByNumber(child.grade, subject, nextChapterNumber);
                setSelection({
                  childId,
                  subject,
                  chapterNumber: nextChapterNumber,
                  concept: nextChapter.concepts[0] || "Introduction",
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
          <button onClick={createLesson} className="rounded-xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm hover:bg-purple-700">
            {loading ? "Creating..." : "Create Visual Lesson"}
          </button>
        </div>
        <p className="mt-4 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold text-purple-700">
          {child.grade} · {subject} · {board} · Chapter {selectedChapter.number}: {selectedChapter.name} · Concept: {selectedConcept}
        </p>
      </section>

      <section className="mt-5 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-6xl">🎨</div>
          <div>
            <h1 className="text-3xl font-black">{lesson.title}</h1>
            <p className="mt-1 text-white/85">{lesson.gradeLevel}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-purple-700">Simple Overview</h2>
          <p className="text-lg font-semibold leading-8 text-slate-700">{lesson.simpleExplanation}</p>
        </section>
        <section className="rounded-2xl bg-amber-50 p-5 shadow-sm">
          <h2 className="mb-3 font-black text-orange-700">Remember This</h2>
          <p className="font-semibold leading-7 text-slate-700">{lesson.memoryTrick}</p>
        </section>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lesson.visualSteps.map((step) => (
          <section key={step.title} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 text-5xl">{step.icon}</div>
            <h3 className="font-black text-slate-900">{step.title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{step.description}</p>
          </section>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl bg-green-50 p-5 shadow-sm">
          <h2 className="mb-3 font-black text-green-700">Real-life Example</h2>
          <p className="font-semibold leading-7">{lesson.realLifeExample}</p>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-purple-700">Vocabulary</h2>
          <div className="space-y-2">
            {lesson.vocabulary.map((item) => (
              <div key={item.word} className="rounded-xl bg-slate-50 p-3">
                <div className="font-black">{item.word}</div>
                <div className="text-sm text-slate-500">{item.meaning}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-black text-purple-700">Mini Quiz</h2>
          {lesson.quiz.map((item) => (
            <div key={item.question}>
              <p className="font-bold">{item.question}</p>
              <div className="mt-3 grid gap-2">
                {item.options.map((option) => (
                  <div key={option} className="rounded-xl bg-purple-50 px-3 py-2 text-sm font-bold text-purple-700">{option}</div>
                ))}
              </div>
            </div>
          ))}
          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-black text-white">
            <Sparkles className="h-5 w-5" /> Ask AI to simplify more
          </button>
        </section>
      </div>
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
      <select className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={value} onChange={(event) => onChange(event.target.value)}>
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
  if (!conceptParam) return chapter.concepts[0] || "Introduction";
  const lower = conceptParam.toLowerCase();
  return chapter.concepts.find((concept) => concept.toLowerCase() === lower || concept.toLowerCase().includes(lower) || lower.includes(concept.toLowerCase())) || chapter.concepts[0] || conceptParam;
}
