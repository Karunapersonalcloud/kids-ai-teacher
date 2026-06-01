"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, Lightbulb, PlusCircle, RefreshCw } from "lucide-react";
import { AudioNarrationControls } from "./audio-narration-controls";
import type { LearningChapter } from "@/lib/learning/chapter-catalog";
import type { VisualLesson, VisualLessonSlide } from "@/lib/types";

type CoachMode = "again" | "example" | "question";

export function VisualLessonPlayer({
  lesson,
  grade,
  board,
  subject,
  chapter,
  selectedConcept,
  source,
}: {
  lesson: VisualLesson;
  grade: string;
  board: string;
  subject: string;
  chapter: LearningChapter;
  selectedConcept: string;
  source: string;
}) {
  const hasStructuredSlides = Boolean(lesson.slides?.length);
  const concepts = useMemo(
    () => (selectedConcept === "All Concepts" && !hasStructuredSlides ? chapter.concepts : [selectedConcept === "All Concepts" ? "All Concepts" : selectedConcept]),
    [chapter.concepts, hasStructuredSlides, selectedConcept]
  );
  const [conceptIndex, setConceptIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [autoRead, setAutoRead] = useState(false);
  const [coachMode, setCoachMode] = useState<CoachMode | null>(null);
  const concept = concepts[conceptIndex] || chapter.name;
  const slides = useMemo(() => buildSlides(concept, lesson), [concept, lesson]);
  const safeSlideIndex = Math.min(slideIndex, Math.max(0, slides.length - 1));
  const slide = slides[safeSlideIndex] || slides[0];
  const progress = Math.round(((conceptIndex * slides.length + safeSlideIndex + 1) / Math.max(1, concepts.length * slides.length)) * 100);
  const narrationText = `${slide.title}. ${slide.teacherScript}`;

  function goNext() {
    setCoachMode(null);
    if (safeSlideIndex < slides.length - 1) {
      setSlideIndex(safeSlideIndex + 1);
      return;
    }
    if (conceptIndex < concepts.length - 1) {
      setConceptIndex(conceptIndex + 1);
      setSlideIndex(0);
    }
  }

  function goBack() {
    setCoachMode(null);
    if (safeSlideIndex > 0) {
      setSlideIndex(safeSlideIndex - 1);
      return;
    }
    if (conceptIndex > 0) {
      setConceptIndex(conceptIndex - 1);
      setSlideIndex(slides.length - 1);
    }
  }

  return (
    <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-purple-700">Chapter {chapter.number}: {chapter.name}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedConcept === "All Concepts" ? "Teacher slide deck" : concept}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{grade} · {subject} · {board} · Source: {source}</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-2 text-sm font-black text-purple-700">
          <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} />
          Auto-read slides
        </label>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid w-full gap-6 2xl:grid-cols-12">
        <aside className="rounded-2xl bg-slate-50 p-4 2xl:col-span-3">
          <h3 className="text-sm font-black text-slate-700">Lesson path</h3>
          <div className="mt-3 space-y-2">
            {concepts.map((item, index) => (
              <button
                key={item}
                onClick={() => {
                  setConceptIndex(index);
                  setSlideIndex(0);
                  setCoachMode(null);
                }}
                className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-black ${index === conceptIndex ? "bg-purple-600 text-white" : "bg-white text-slate-600"}`}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {slides.map((item, index) => (
              <button
                key={`${item.slideType}-${index}`}
                onClick={() => {
                  setSlideIndex(index);
                  setCoachMode(null);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black ${index === safeSlideIndex ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10">{index + 1}</span>
                <span className="min-w-0 truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4 2xl:col-span-9">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-700">{slide.slideType}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Slide {safeSlideIndex + 1} of {slides.length}</span>
              </div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Mini classroom board</span>
            </div>

            <div className="grid gap-0 xl:grid-cols-12">
              <section className="bg-white p-5 xl:col-span-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  <BookOpen className="h-4 w-4" /> Teacher narration
                </div>
                <h3 className="mt-4 text-2xl font-black text-slate-950">{slide.title}</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-slate-700">{slide.teacherScript}</p>

                {slide.keyPoints.length > 0 && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">Key points</div>
                    <ul className="mt-3 space-y-2">
                      {slide.keyPoints.map((point) => (
                        <li key={point} className="flex gap-2 text-sm font-bold leading-6 text-slate-700">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(slide.studentQuestion || slide.answer) && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    {slide.studentQuestion && <p className="text-sm font-black text-blue-900">{slide.studentQuestion}</p>}
                    {slide.answer && <p className="mt-2 text-sm font-semibold leading-6 text-blue-800">Answer: {slide.answer}</p>}
                  </div>
                )}
              </section>

              <section className="min-h-[420px] bg-gradient-to-br from-emerald-50 via-blue-50 to-amber-50 p-5 xl:col-span-8">
                <VisualBoard slide={slide} />
              </section>
            </div>
          </article>

          <AudioNarrationControls text={narrationText} language="en-IN" autoPlay={autoRead} />

          <div className="flex flex-wrap gap-2">
            <CoachButton mode="again" activeMode={coachMode} onClick={setCoachMode} icon={<RefreshCw className="h-4 w-4" />}>
              Explain again
            </CoachButton>
            <CoachButton mode="example" activeMode={coachMode} onClick={setCoachMode} icon={<PlusCircle className="h-4 w-4" />}>
              Give another example
            </CoachButton>
            <CoachButton mode="question" activeMode={coachMode} onClick={setCoachMode} icon={<CircleHelp className="h-4 w-4" />}>
              Ask me a question
            </CoachButton>
          </div>

          {coachMode && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm font-semibold leading-6 text-purple-900">
              {coachText(coachMode, slide, concept)}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={goBack} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex flex-wrap gap-2">
              {slides.map((item, index) => (
                <button
                  key={`${item.slideType}-${item.title}-${index}`}
                  onClick={() => {
                    setSlideIndex(index);
                    setCoachMode(null);
                  }}
                  className={`h-3 w-8 rounded-full ${index === safeSlideIndex ? "bg-purple-600" : "bg-slate-200"}`}
                  aria-label={`Go to slide ${index + 1}: ${item.title}`}
                />
              ))}
            </div>
            <button onClick={goNext} className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoachButton({
  mode,
  activeMode,
  onClick,
  icon,
  children,
}: {
  mode: CoachMode;
  activeMode: CoachMode | null;
  onClick: (mode: CoachMode) => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(mode)}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ${activeMode === mode ? "bg-purple-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function VisualBoard({ slide }: { slide: VisualLessonSlide }) {
  return (
    <div className="h-full rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">{slide.visualType}</span>
      </div>
      {slide.visualType === "two-column-card" && <TwoColumnVisual data={slide.visualData} />}
      {slide.visualType === "formula-card" && <FormulaVisual data={slide.visualData} />}
      {slide.visualType === "comparison-table" && <ComparisonTableVisual data={slide.visualData} />}
      {slide.visualType === "number-line" && <NumberLineVisual data={slide.visualData} />}
      {slide.visualType === "quiz-card" && <QuizVisual key={slide.title} data={slide.visualData} answer={slide.answer} />}
      {slide.visualType === "example-card" && <ExampleVisual data={slide.visualData} />}
      {slide.visualType === "mistake-card" && <MistakeVisual data={slide.visualData} />}
      {slide.visualType === "summary-card" && <SummaryVisual data={slide.visualData} fallbackPoints={slide.keyPoints} />}
    </div>
  );
}

function TwoColumnVisual({ data }: { data: Record<string, unknown> }) {
  const leftExamples = getStringArray(data, "leftExamples");
  const rightExamples = getStringArray(data, "rightExamples");
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
      <ColumnCard title={getString(data, "leftTitle", "Can be written this way")} items={leftExamples} tone="green" />
      <div className="hidden items-center justify-center md:flex">
        <ArrowRight className="h-8 w-8 text-slate-400" />
      </div>
      <ColumnCard title={getString(data, "rightTitle", "Cannot be written this way")} items={rightExamples} tone="amber" />
    </div>
  );
}

function ColumnCard({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  const toneClass = tone === "green" ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950";
  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <h4 className="text-lg font-black">{title}</h4>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-white px-4 py-3 text-center text-xl font-black shadow-sm">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaVisual({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
        <div className="text-xs font-black uppercase tracking-wide text-white/60">Formula or rule</div>
        <div className="mt-4 break-words text-3xl font-black leading-tight">{getString(data, "formula", "rule")}</div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-green-700">Works for</div>
          <p className="mt-2 text-sm font-bold leading-6 text-green-900">{getString(data, "validFor", "Examples that match the rule.")}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-red-700">Does not work for</div>
          <p className="mt-2 text-sm font-bold leading-6 text-red-900">{getString(data, "notValidFor", "Examples that break the rule.")}</p>
        </div>
      </div>
    </div>
  );
}

function ComparisonTableVisual({ data }: { data: Record<string, unknown> }) {
  const headers = getStringArray(data, "headers");
  const rows = getRows(data, "rows");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead className="bg-slate-950 text-white">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.join("-")}-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="border-t border-slate-100 px-4 py-3 text-sm font-bold leading-6 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumberLineVisual({ data }: { data: Record<string, unknown> }) {
  const min = getNumber(data, "min", 0);
  const max = getNumber(data, "max", 3);
  const markers = getMarkers(data);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="relative h-44">
        <div className="absolute left-4 right-4 top-20 h-1 rounded-full bg-slate-300" />
        <div className="absolute left-4 top-[72px] h-5 w-1 rounded-full bg-slate-500" />
        <div className="absolute right-4 top-[72px] h-5 w-1 rounded-full bg-slate-500" />
        <div className="absolute left-4 top-28 text-sm font-black text-slate-600">{min}</div>
        <div className="absolute right-4 top-28 text-sm font-black text-slate-600">{max}</div>
        {markers.map((marker) => {
          const percent = clamp(((marker.value - min) / Math.max(0.001, max - min)) * 100, 2, 98);
          return (
            <div key={`${marker.label}-${marker.value}`} className="absolute top-8 -translate-x-1/2" style={{ left: `${percent}%` }}>
              <div className="mx-auto h-16 w-1 rounded-full bg-purple-600" />
              <div className="mt-2 max-w-28 rounded-xl bg-purple-600 px-2 py-1 text-center text-xs font-black leading-4 text-white shadow-sm">{marker.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizVisual({ data, answer }: { data: Record<string, unknown>; answer?: string }) {
  const [selected, setSelected] = useState("");
  const options = getStringArray(data, "options");
  const correctAnswer = getString(data, "correctAnswer", answer || options[0] || "");
  const explanation = getString(data, "explanation", answer || "");
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <h4 className="text-xl font-black text-blue-950">{getString(data, "question", "Quick check")}</h4>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isPicked = selected === option;
          const isCorrect = option === correctAnswer;
          const showState = Boolean(selected);
          const stateClass = showState && isCorrect ? "border-green-400 bg-green-100 text-green-900" : showState && isPicked ? "border-red-300 bg-red-50 text-red-900" : "border-white bg-white text-slate-800";
          return (
            <button key={option} onClick={() => setSelected(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-black shadow-sm ${stateClass}`}>
              {option}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-blue-950">
          {selected === correctAnswer ? "Correct. " : `Good try. Correct answer: ${correctAnswer}. `}
          {explanation}
        </div>
      )}
    </div>
  );
}

function ExampleVisual({ data }: { data: Record<string, unknown> }) {
  const examples = getStringArray(data, "examples");
  const nonExamples = getStringArray(data, "nonExamples");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <h4 className="text-lg font-black text-green-900">{getString(data, "examplesTitle", "Examples")}</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((example) => (
            <span key={example} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-green-900 shadow-sm">
              {example}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h4 className="text-lg font-black text-amber-950">{getString(data, "nonExamplesTitle", "Non-examples")}</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {nonExamples.map((example) => (
            <span key={example} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-amber-950 shadow-sm">
              {example}
            </span>
          ))}
        </div>
      </div>
      {getString(data, "reason") && <p className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700 shadow-sm lg:col-span-2">{getString(data, "reason")}</p>}
    </div>
  );
}

function MistakeVisual({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="text-xs font-black uppercase tracking-wide text-red-700">Mistake</div>
        <p className="mt-2 text-lg font-black leading-7 text-red-950">{getString(data, "mistake", "Common wrong idea")}</p>
      </div>
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="text-xs font-black uppercase tracking-wide text-green-700">Correction</div>
        <p className="mt-2 text-lg font-black leading-7 text-green-950">{getString(data, "correction", "Correct the idea using the definition.")}</p>
      </div>
      {getString(data, "example") && <p className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700 shadow-sm lg:col-span-2">{getString(data, "example")}</p>}
    </div>
  );
}

function SummaryVisual({ data, fallbackPoints }: { data: Record<string, unknown>; fallbackPoints: string[] }) {
  const points = getStringArray(data, "keyTakeaways");
  const takeaways = points.length ? points : fallbackPoints;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xl font-black text-slate-950">Teacher board summary</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {takeaways.map((point) => (
          <div key={point} className="rounded-2xl bg-slate-50 p-4 text-sm font-black leading-6 text-slate-700">
            {point}
          </div>
        ))}
      </div>
      {getString(data, "memoryLine") && <p className="mt-4 rounded-2xl bg-purple-50 p-4 text-sm font-black leading-6 text-purple-900">{getString(data, "memoryLine")}</p>}
    </div>
  );
}

function buildSlides(concept: string, lesson: VisualLesson): VisualLessonSlide[] {
  if (lesson.slides?.length) return lesson.slides;
  const quiz = lesson.quiz?.[0];
  return [
    {
      slideType: "definition",
      title: `Meaning of ${concept}`,
      teacherScript: lesson.simpleExplanation || `Let us define ${concept}, see an example, and test one non-example.`,
      visualType: "formula-card",
      visualData: {
        formula: concept,
        validFor: lesson.realLifeExample || `A clear example of ${concept}`,
        notValidFor: `A similar idea that is not ${concept}`,
      },
      keyPoints: lesson.visualSteps?.map((step) => `${step.title}: ${step.description}`) || ["Understand the meaning.", "See one example.", "Try one question."],
    },
    {
      slideType: "example",
      title: `Example of ${concept}`,
      teacherScript: lesson.realLifeExample || `Use a daily-life example to understand ${concept} before textbook questions.`,
      visualType: "example-card",
      visualData: {
        examplesTitle: "Example",
        examples: [lesson.realLifeExample || concept],
        nonExamplesTitle: "Non-example",
        nonExamples: [`Not ${concept}`],
        reason: "Comparing both helps the idea become clear.",
      },
      keyPoints: ["Example first.", "Then compare with a non-example."],
    },
    {
      slideType: "quick-check",
      title: quiz?.question || `Quick check for ${concept}`,
      teacherScript: quiz ? "Think about the options, choose one answer, and then check the explanation." : `Can you explain ${concept} in your own words?`,
      visualType: "quiz-card",
      visualData: {
        question: quiz?.question || `Which statement best matches ${concept}?`,
        options: quiz?.options || ["Definition", "Example", "Non-example"],
        correctAnswer: quiz?.answer || "Definition",
        explanation: quiz?.explanation || lesson.memoryTrick || `Use the definition of ${concept}.`,
      },
      keyPoints: [lesson.memoryTrick || "Meaning first, example next, practice last."],
    },
  ];
}

function coachText(mode: CoachMode, slide: VisualLessonSlide, concept: string) {
  if (mode === "again") {
    return `In simpler words: ${slide.teacherScript} The main thing to remember is ${slide.keyPoints[0] || slide.title}.`;
  }
  if (mode === "example") {
    const data = slide.visualData;
    const example = getStringArray(data, "examples")[1] || getStringArray(data, "rightExamples")[0] || getStringArray(data, "leftExamples")[0] || getString(data, "example");
    return example ? `Another example: ${example}. Now explain why it matches or does not match ${concept}.` : `Another example: pick one number, object, or case from your textbook and test whether it follows the rule for ${concept}.`;
  }
  const data = slide.visualData;
  const question = slide.studentQuestion || getString(data, "question", `Can you explain ${concept} in one sentence?`);
  const answer = slide.answer || getString(data, "correctAnswer");
  return answer ? `${question} Answer after thinking: ${answer}` : question;
}

function getString(data: Record<string, unknown>, key: string, fallback = "") {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
}

function getStringArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function getRows(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell)) : [String(row)]));
}

function getNumber(data: Record<string, unknown>, key: string, fallback: number) {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getMarkers(data: Record<string, unknown>) {
  const value = data.markers;
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        label: typeof record.label === "string" ? record.label : "",
        value: typeof record.value === "number" ? record.value : NaN,
      };
    })
    .filter((marker) => marker.label && Number.isFinite(marker.value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
