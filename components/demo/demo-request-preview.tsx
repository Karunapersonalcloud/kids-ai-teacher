"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Languages,
  LayoutList,
  LockKeyhole,
  MapPin,
  Menu,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Stars,
  WandSparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { generateDemoLesson, type DemoVisualLesson } from "@/lib/demo/demo-lesson-generator";
import { getChaptersForGradeSubject, getDefaultVisualSubjectsForGrade, type LearningChapter } from "@/lib/learning/chapter-catalog";
import { indiaStateOptions } from "@/lib/india-state-catalog";
import { DemoVisualPreview } from "./demo-visual-preview";

const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const boards = ["CBSE", "ICSE", "State Board", "Other"];
const narrationLanguages = ["English", "Hindi", "Telugu", "Kannada", "Tamil"];
const DEMO_LIMIT_KEY = "conceptkid_demo_preview_count";
const DEMO_LIMIT = 3;

export function DemoRequestPreview() {
  return <DemoSelectionPage />;
}

export function DemoSelectionPage() {
  const [grade, setGrade] = useState("");
  const [board, setBoard] = useState("");
  const [state, setState] = useState("");
  const [subject, setSubject] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [language, setLanguage] = useState("");
  const [lesson, setLesson] = useState<DemoVisualLesson | null>(null);
  const [usedCount, setUsedCount] = useState(() => {
    if (typeof window === "undefined") return 0;
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
  const previewLabel = `${remaining} of ${DEMO_LIMIT} free previews remaining`;

  function clearFromClass(nextGrade: string) {
    setGrade(nextGrade);
    setBoard("");
    setState("");
    setSubject("");
    setChapterInput("");
    setTopicInput("");
    setLesson(null);
    setMessage("");
  }

  function clearFromBoard(nextBoard: string) {
    setBoard(nextBoard);
    setState("");
    setSubject("");
    setChapterInput("");
    setTopicInput("");
    setLesson(null);
    setMessage("");
  }

  function clearFromState(nextState: string) {
    setState(nextState);
    setSubject("");
    setChapterInput("");
    setTopicInput("");
    setLesson(null);
    setMessage("");
  }

  function clearFromSubject(nextSubject: string) {
    setSubject(nextSubject);
    setChapterInput("");
    setTopicInput("");
    setLesson(null);
    setMessage("");
  }

  function clearFromChapter(nextChapter: string) {
    setChapterInput(nextChapter);
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
    if (!grade) {
      setMessage("Please select class / grade.");
      return;
    }
    if (!board) {
      setMessage("Please select board.");
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
    if (!language) {
      setMessage("Please select narration language.");
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
    <section className="overflow-hidden rounded-[2rem] border border-purple-100 bg-gradient-to-br from-[#f8f5ff] via-white to-[#eaf9ff] shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-white/80 bg-white/70 px-5 py-4 backdrop-blur md:px-7">
        <button type="button" aria-label="Open demo menu" className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-purple-100">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <BrandLogo variant="compact" />
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-600 text-white shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="relative px-5 py-6 md:px-7 lg:px-8">
        <div className="pointer-events-none absolute right-8 top-7 hidden text-yellow-300 md:block">
          <Stars className="h-12 w-12" />
        </div>
        <div className="pointer-events-none absolute bottom-10 right-24 hidden rotate-12 rounded-2xl bg-teal-100 px-4 py-3 text-teal-700 shadow-sm lg:block">
          <BookOpen className="h-7 w-7" />
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
          <div className="space-y-6">
            <div>
              <PreviewBadge>{previewLabel}</PreviewBadge>
              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Create a Learning Demo</h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                Preview interactive visual lessons crafted from trusted textbooks.
              </p>
            </div>

            <StepIndicator activeStep={subject && chapterInput ? 3 : grade ? 2 : 1} />

            <div className="grid gap-3 sm:grid-cols-3">
              <TrustCard icon={<BookOpen className="h-5 w-5" />} title="Textbook aligned" text="Covers your syllabus" tone="purple" />
              <TrustCard icon={<ShieldCheck className="h-5 w-5" />} title="Child-safe AI" text="Safe & age-appropriate" tone="teal" />
              <TrustCard icon={<Sparkles className="h-5 w-5" />} title="Visual learning" text="Engaging & interactive" tone="yellow" />
            </div>
          </div>

          <form onSubmit={generatePreview} className="rounded-[1.75rem] border border-white bg-white/95 p-4 shadow-xl shadow-purple-100/60 md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField icon={<GraduationCap className="h-5 w-5" />} label="Class / Grade" value={grade} onChange={clearFromClass} placeholder="Select class / grade" options={grades} />
              <SelectField icon={<School className="h-5 w-5" />} label="Board" value={board} onChange={clearFromBoard} placeholder="Select board" options={boards} />
              <SearchableCombobox
                icon={<MapPin className="h-5 w-5" />}
                label="State"
                helper="Required only for State Board"
                value={state}
                onChange={clearFromState}
                placeholder="Select state"
                options={indiaStateOptions}
                disabled={!isStateBoard}
              />
              <SearchableCombobox
                icon={<Search className="h-5 w-5" />}
                label="Subject"
                value={subject}
                onChange={clearFromSubject}
                placeholder="Type to search subject"
                options={subjectOptions}
                disabled={!canLoadSubjects}
              />
              <SearchableCombobox
                icon={<LayoutList className="h-5 w-5" />}
                label="Chapter number/name"
                value={chapterInput}
                onChange={clearFromChapter}
                placeholder="Search chapter, e.g., Chapter 3"
                options={chapterOptions.map((item) => formatChapterLabel(item))}
                disabled={!subject.trim()}
              />
              <SearchableCombobox
                icon={<BookOpen className="h-5 w-5" />}
                label="Topic name"
                helper="Optional"
                value={topicInput}
                onChange={(value) => {
                  setTopicInput(value);
                  setLesson(null);
                  setMessage("");
                }}
                placeholder="Search topic, e.g., Fractions"
                options={topicOptions}
                disabled={!chapterInput.trim()}
              />
              <SelectField
                icon={<Languages className="h-5 w-5" />}
                label="Narration language"
                value={language}
                onChange={setLanguage}
                placeholder="Select narration language"
                options={narrationLanguages}
                className="md:col-span-2"
              />
            </div>

            {message && <div className="mt-5 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold leading-6 text-purple-800">{message}</div>}

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-purple-200 transition hover:from-purple-700 hover:to-blue-700">
              <WandSparkles className="h-5 w-5" />
              Generate Visual Demo
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-600">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
              Demo content is a limited preview. Full textbook-based learning unlocks after registration and authorized textbook setup.
            </div>
          </form>
        </div>
      </div>

      {lesson && (
        <div className="border-t border-purple-100 bg-white/80 p-5 md:p-7">
          <DemoVisualPreview lesson={lesson} />
        </div>
      )}
    </section>
  );
}

function SelectField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  options,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  className?: string;
}) {
  return (
    <FieldShell icon={icon} label={label} className={className}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function SearchableCombobox({
  icon,
  label,
  helper,
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
}) {
  const listId = `demo-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-options`;

  return (
    <FieldShell icon={icon} label={label} helper={helper}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
        <input
          list={listId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${fieldClassName} pl-9 pr-10`}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <datalist id={listId}>
          {options.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>
    </FieldShell>
  );
}

function FieldShell({ icon, label, helper, className = "", children }: { icon: ReactNode; label: string; helper?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 ${className}`}>
      <span className="flex items-center gap-2 text-sm font-black text-slate-800">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-purple-700 shadow-sm ring-1 ring-purple-100">{icon}</span>
        <span>
          {label}
          {helper && <span className="block text-xs font-bold text-slate-500">{helper}</span>}
        </span>
      </span>
      {children}
    </label>
  );
}

function StepIndicator({ activeStep }: { activeStep: number }) {
  const steps = ["Choose class", "Pick chapter", "Generate demo"];
  return (
    <div className="grid gap-3 rounded-3xl bg-white/70 p-3 shadow-sm ring-1 ring-white sm:grid-cols-3">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === activeStep;
        const complete = stepNumber < activeStep;
        return (
          <div key={step} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${active ? "bg-purple-600 text-white" : complete ? "bg-purple-50 text-purple-800" : "bg-white text-slate-500"}`}>
            <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${active ? "bg-white text-purple-700" : "bg-slate-100 text-slate-600"}`}>{stepNumber}</span>
            <span className="text-sm font-black">{step}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrustCard({ icon, title, text, tone }: { icon: ReactNode; title: string; text: string; tone: "purple" | "teal" | "yellow" }) {
  const toneClass = {
    purple: "bg-purple-50 text-purple-700",
    teal: "bg-teal-50 text-teal-700",
    yellow: "bg-yellow-50 text-yellow-700",
  }[tone];

  return (
    <div className="rounded-3xl border border-white bg-white/80 p-4 shadow-sm">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${toneClass}`}>{icon}</div>
      <h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-xs font-bold text-slate-500">{text}</p>
    </div>
  );
}

function PreviewBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-purple-700 shadow-sm ring-1 ring-purple-100">
      <Sparkles className="h-4 w-4 text-yellow-500" />
      {children}
    </span>
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

const fieldClassName =
  "w-full rounded-xl border border-purple-100 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100";
