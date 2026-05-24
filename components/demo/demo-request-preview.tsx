"use client";

import { useMemo, useState, type ReactNode } from "react";
import { generateDemoLesson, type DemoVisualLesson } from "@/lib/demo/demo-lesson-generator";
import { DemoVisualPreview } from "./demo-visual-preview";

const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const boards = ["CBSE", "State Board", "ICSE", "Other"];
const subjects = ["English", "Maths", "EVS", "Science", "Social Science", "Hindi", "Kannada", "Telugu", "Computer", "Other"];
const DEMO_LIMIT_KEY = "conceptkid_demo_preview_count";
const DEMO_LIMIT = 3;

export function DemoRequestPreview() {
  const [grade, setGrade] = useState("Class 3");
  const [board, setBoard] = useState("CBSE");
  const [subject, setSubject] = useState("EVS");
  const [chapter, setChapter] = useState("Chapter 3: Plants");
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState<DemoVisualLesson | null>(null);
  const [usedCount, setUsedCount] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    const stored = Number(window.localStorage.getItem(DEMO_LIMIT_KEY) || 0);
    return Number.isFinite(stored) ? stored : 0;
  });
  const [message, setMessage] = useState("");
  const remaining = Math.max(0, DEMO_LIMIT - usedCount);
  const isTopicPreview = Boolean(topic.trim());

  const helperText = useMemo(
    () =>
      isTopicPreview
        ? "For a specific topic request, we show up to 50% of that topic so you can see how visual learning works."
        : "For a full chapter request, we show a 25% preview so you can understand the teaching style.",
    [isTopicPreview]
  );

  function generatePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (usedCount >= DEMO_LIMIT) {
      setMessage("You have used the free demo previews. Please register for full access.");
      return;
    }
    if (!chapter.trim()) {
      setMessage("Please enter a chapter number or chapter name.");
      return;
    }

    const nextLesson = generateDemoLesson({ grade, board, subject, chapter, topic });
    const nextCount = usedCount + 1;
    window.localStorage.setItem(DEMO_LIMIT_KEY, String(nextCount));
    setUsedCount(nextCount);
    setLesson(nextLesson);
    setMessage("Demo preview generated. Full lessons, quizzes, chapter exams, weak-area reports, and progress tracking unlock after registration.");
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={generatePreview} className="rounded-3xl bg-[#f7f5ff] p-5">
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Limited demo preview</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950">Request a sample class demo</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{helperText}</p>
          <p className="mt-2 text-xs font-black text-slate-500">{remaining} of {DEMO_LIMIT} free previews remaining in this browser session.</p>

          <div className="mt-5 grid gap-4">
            <Field label="Class / Grade">
              <select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm">
                {grades.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Board">
              <select value={board} onChange={(event) => setBoard(event.target.value)} className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm">
                {boards.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <input list="demo-subject-options" value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" />
              <datalist id="demo-subject-options">
                {subjects.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Field>
            <Field label="Chapter number/name">
              <input value={chapter} onChange={(event) => setChapter(event.target.value)} placeholder="Example: Chapter 3 or Animals Around Us" className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" />
            </Field>
            <Field label="Topic name (optional)">
              <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Example: Animal homes / Fractions / Motion" className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" />
            </Field>
          </div>

          {message && <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-purple-800">{message}</div>}
          <button className="mt-5 w-full rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white">Generate Demo Preview</button>
        </form>

        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <h3 className="text-2xl font-black">What the limited demo includes</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black">Chapter request</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">25% chapter preview, limited visual lesson cards, 1-2 practice questions, remaining 75% locked.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black">Topic request</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">Up to 50% topic preview with explanation, real-life example, visual card, and 1 practice question.</p>
            </div>
            <div className="rounded-2xl bg-amber-400/15 p-4 text-amber-100">
              <div className="text-sm font-black">Textbook safety</div>
              <p className="mt-1 text-sm font-semibold leading-6">Demo content is general grade-level preview only. It does not expose full textbook or private publisher content.</p>
            </div>
          </div>
        </div>
      </div>

      {lesson && (
        <div className="mt-6">
          <DemoVisualPreview lesson={lesson} />
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      {children}
    </label>
  );
}
