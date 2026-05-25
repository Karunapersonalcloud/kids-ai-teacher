"use client";

import { useMemo, useState, type ReactNode } from "react";
import { generateDemoLesson, type DemoVisualLesson } from "@/lib/demo/demo-lesson-generator";
import { getChaptersForGradeSubject, getDefaultVisualSubjectsForGrade, type LearningChapter } from "@/lib/learning/chapter-catalog";
import { indiaStateOptions } from "@/lib/india-state-catalog";
import { DemoVisualPreview } from "./demo-visual-preview";

const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const boards = ["CBSE", "State Board", "ICSE", "Other"];
const narrationLanguages = ["English", "Hindi", "Telugu", "Kannada"];
const DEMO_LIMIT_KEY = "conceptkid_demo_preview_count";
const DEMO_LIMIT = 3;

export function DemoRequestPreview() {
  const [grade, setGrade] = useState("Class 3");
  const [board, setBoard] = useState("CBSE");
  const [state, setState] = useState("");
  const [subject, setSubject] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [language, setLanguage] = useState("English");
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
  const isStateBoard = board === "State Board";
  const canLoadSubjects = Boolean(grade && board && (!isStateBoard || state));
  const subjectOptions = useMemo(() => (canLoadSubjects ? getSubjectOptions(grade, board, state) : []), [board, canLoadSubjects, grade, state]);
  const chapterOptions = useMemo(() => (subject.trim() ? getChaptersForGradeSubject(grade, subject) : []), [grade, subject]);
  const selectedChapter = useMemo(() => findChapter(chapterOptions, chapterInput), [chapterInput, chapterOptions]);
  const topicOptions = useMemo(() => selectedChapter?.concepts ?? [], [selectedChapter]);
  const selectedTopic = useMemo(() => findTopic(topicOptions, topicInput), [topicInput, topicOptions]);
  const isTopicPreview = Boolean(topicInput.trim());

  const helperText = useMemo(
    () =>
      isTopicPreview
        ? "For a specific topic request, we show up to 50% of that topic so you can see how visual learning works."
        : "For a full chapter request, we show a 25% preview so you can understand the teaching style.",
    [isTopicPreview]
  );

  function resetSubjectFlow(nextGrade = grade, nextBoard = board, nextState = state) {
    const needsState = nextBoard === "State Board";
    const nextCanLoadSubjects = Boolean(nextGrade && nextBoard && (!needsState || nextState));
    setSubject("");
    setChapterInput("");
    setTopicInput("");
    setLesson(null);
    if (!nextCanLoadSubjects) {
      setMessage("Select class, board, and state to load subjects for State Board demos.");
    } else {
      setMessage("");
    }
  }

  function resetChapterFlow(nextSubject: string) {
    setSubject(nextSubject);
    setChapterInput("");
    setTopicInput("");
    setLesson(null);
    setMessage("");
  }

  function generatePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (usedCount >= DEMO_LIMIT) {
      setMessage("You have used the free demo previews. Please register for full access.");
      return;
    }
    if (isStateBoard && !state.trim()) {
      setMessage("Please select state for State Board demo previews.");
      return;
    }
    if (!subject.trim()) {
      setMessage("Please select or type a subject.");
      return;
    }
    if (!chapterInput.trim()) {
      setMessage("Please select or search a chapter.");
      return;
    }

    const chapterName = selectedChapter?.name || cleanChapterName(chapterInput);
    const chapterId = selectedChapter ? `chapter-${selectedChapter.number}` : slugify(chapterInput);
    const topicName = selectedTopic || topicInput.trim();
    const topicId = topicName ? slugify(topicName) : "";
    const nextLesson = generateDemoLesson({
      grade,
      classGrade: grade,
      board,
      state,
      subject,
      chapter: formatChapterLabel(selectedChapter, chapterInput),
      chapterId,
      chapterName,
      topic: topicName,
      topicId,
      topicName,
      language,
      narrationLanguage: language,
    });
    const nextCount = usedCount + 1;
    window.localStorage.setItem(DEMO_LIMIT_KEY, String(nextCount));
    setUsedCount(nextCount);
    setLesson(nextLesson);
    setMessage("Demo preview generated. Full lessons, quizzes, chapter exams, weak-area reports, and progress tracking unlock after registration.");
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="grid gap-6 xl:grid-cols-12">
        <form onSubmit={generatePreview} className="rounded-3xl bg-[#f7f5ff] p-5 xl:col-span-5">
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Interactive visual demo</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950">Select class, subject, chapter, and topic</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{helperText}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            ConceptKid demos are interactive. Instead of showing one fixed video, we generate a visual lesson preview based on what you select.
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-purple-800">
            Full textbook-based learning unlocks after registration and authorized textbook setup.
          </p>
          <p className="mt-2 text-xs font-black text-slate-500">{remaining} of {DEMO_LIMIT} free previews remaining in this browser session.</p>

          <div className="mt-5 grid gap-4">
            <Field label="Class / Grade">
              <select
                value={grade}
                onChange={(event) => {
                  const nextGrade = event.target.value;
                  setGrade(nextGrade);
                  resetSubjectFlow(nextGrade, board, state);
                }}
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {grades.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Board">
              <select
                value={board}
                onChange={(event) => {
                  const nextBoard = event.target.value;
                  setBoard(nextBoard);
                  const nextState = nextBoard === "State Board" ? state : "";
                  setState(nextState);
                  resetSubjectFlow(grade, nextBoard, nextState);
                }}
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {boards.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label={`State${isStateBoard ? "" : " (optional)"}`}>
              <input
                list="demo-state-options"
                value={state}
                onChange={(event) => {
                  const nextState = event.target.value;
                  setState(nextState);
                  resetSubjectFlow(grade, board, nextState);
                }}
                required={isStateBoard}
                disabled={!isStateBoard}
                placeholder={isStateBoard ? "Select state" : "State not required for this board"}
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <datalist id="demo-state-options">
                {indiaStateOptions.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Field>
            <Field label="Subject">
              <input
                list="demo-subject-options"
                value={subject}
                onChange={(event) => resetChapterFlow(event.target.value)}
                disabled={!canLoadSubjects}
                placeholder="Select or search subject"
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <datalist id="demo-subject-options">
                {subjectOptions.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Field>
            <Field label="Chapter number/name">
              <input
                list="demo-chapter-options"
                value={chapterInput}
                onChange={(event) => {
                  setChapterInput(event.target.value);
                  setTopicInput("");
                  setLesson(null);
                }}
                disabled={!subject.trim()}
                placeholder="Select or search chapter"
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <datalist id="demo-chapter-options">
                {chapterOptions.map((item) => <option key={item.number} value={formatChapterLabel(item)} />)}
              </datalist>
            </Field>
            <Field label="Topic name (optional)">
              <input
                list="demo-topic-options"
                value={topicInput}
                onChange={(event) => {
                  setTopicInput(event.target.value);
                  setLesson(null);
                }}
                disabled={!chapterInput.trim()}
                placeholder="Select or search topic, or leave blank for chapter preview"
                className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <datalist id="demo-topic-options">
                {topicOptions.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Field>
            <Field label="Narration language">
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-2xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100">
                {narrationLanguages.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
          </div>

          {message && <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-purple-800">{message}</div>}
          <button className="mt-5 w-full rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white">Generate Visual Demo</button>
        </form>

        <div className="rounded-3xl bg-slate-950 p-5 text-white xl:col-span-7">
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

function getSubjectOptions(grade: string, board: string, state: string) {
  const base = getDefaultVisualSubjectsForGrade(grade);
  const stateSpecific = board === "State Board" && state === "Andhra Pradesh" ? ["Telugu", "English", "Maths", "EVS", "Science", "Social Science"] : [];
  return Array.from(new Set([...base, ...stateSpecific, "Other"]));
}

function formatChapterLabel(chapter?: LearningChapter, fallback = "") {
  if (!chapter) return fallback;
  return `Chapter ${chapter.number} - ${chapter.name}`;
}

function findChapter(chapters: LearningChapter[], value: string) {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  return chapters.find((chapter) => {
    const label = normalize(formatChapterLabel(chapter));
    return label === normalized || normalize(chapter.name) === normalized || normalize(String(chapter.number)) === normalized || normalize(`Chapter ${chapter.number}`) === normalized;
  });
}

function findTopic(topics: string[], value: string) {
  const normalized = normalize(value);
  if (!normalized) return "";
  return topics.find((topic) => normalize(topic) === normalized) || "";
}

function cleanChapterName(value: string) {
  return value.replace(/^chapter\s*\d+\s*[-:]\s*/i, "").trim() || value.trim();
}

function slugify(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
