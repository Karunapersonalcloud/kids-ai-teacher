"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { AudioNarrationControls } from "./audio-narration-controls";
import type { LearningChapter } from "@/lib/learning/chapter-catalog";
import type { VisualLesson } from "@/lib/types";

type SlideKind = "Learn" | "Example" | "Practice" | "Quiz" | "Summary";

type LessonSlide = {
  kind: SlideKind;
  title: string;
  text: string;
  visual: string;
};

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
  const concepts = selectedConcept === "All Concepts" ? chapter.concepts : [selectedConcept];
  const [conceptIndex, setConceptIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [autoRead, setAutoRead] = useState(false);
  const concept = concepts[conceptIndex] || chapter.name;
  const slides = useMemo(() => buildSlides(concept, lesson), [concept, lesson]);
  const slide = slides[slideIndex] || slides[0];
  const progress = Math.round(((conceptIndex * slides.length + slideIndex + 1) / Math.max(1, concepts.length * slides.length)) * 100);

  function goNext() {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
      return;
    }
    if (conceptIndex < concepts.length - 1) {
      setConceptIndex(conceptIndex + 1);
      setSlideIndex(0);
    }
  }

  function goBack() {
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
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
          <h2 className="mt-1 text-2xl font-black text-slate-950">Concept {conceptIndex + 1} of {concepts.length}: {concept}</h2>
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

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl bg-slate-50 p-4">
          <h3 className="text-sm font-black text-slate-700">Concept list</h3>
          <div className="mt-3 space-y-2">
            {concepts.map((item, index) => (
              <button
                key={item}
                onClick={() => {
                  setConceptIndex(index);
                  setSlideIndex(0);
                }}
                className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-black ${index === conceptIndex ? "bg-purple-600 text-white" : "bg-white text-slate-600"}`}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <article className="rounded-3xl bg-gradient-to-br from-slate-950 to-purple-950 p-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">{slide.kind}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">Slide {slideIndex + 1} of {slides.length}</span>
            </div>
            <div className="mt-5 text-6xl">{slide.visual}</div>
            <h3 className="mt-4 text-3xl font-black">{slide.title}</h3>
            <p className="mt-3 max-w-3xl text-lg font-semibold leading-8 text-white/85">{slide.text}</p>
          </article>

          <AudioNarrationControls text={`Let's learn ${concept}. ${slide.title}. ${slide.text}`} language="en-IN" autoPlay={autoRead} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={goBack} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex flex-wrap gap-2">
              {slides.map((item, index) => (
                <button
                  key={item.kind}
                  onClick={() => setSlideIndex(index)}
                  className={`rounded-full px-3 py-1 text-xs font-black ${index === slideIndex ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {item.kind}
                </button>
              ))}
            </div>
            <button onClick={goNext} className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-800">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Viewed status is tracked locally in this lesson player. Full saved mastery tracking happens through chapter exams and progress APIs.
          </div>
        </div>
      </div>
    </section>
  );
}

function buildSlides(concept: string, lesson: VisualLesson): LessonSlide[] {
  const quiz = lesson.quiz[0];
  return [
    {
      kind: "Learn",
      title: `What ${concept} means`,
      text: concept === lesson.title ? lesson.simpleExplanation : `${concept} is one part of this chapter. ${lesson.simpleExplanation}`,
      visual: "💡",
    },
    {
      kind: "Example",
      title: `Why ${concept} matters`,
      text: lesson.realLifeExample || `Use a daily-life example to understand ${concept} before textbook questions.`,
      visual: "🧩",
    },
    {
      kind: "Practice",
      title: "Try one step",
      text: `Write the meaning of ${concept}, then solve one small example. Common mistake: memorizing words without understanding the idea.`,
      visual: "✍️",
    },
    {
      kind: "Quiz",
      title: quiz?.question || `Quick check for ${concept}`,
      text: quiz ? `Options: ${quiz.options.join(", ")}. Think first, then reveal the answer during practice.` : `Can you explain ${concept} in your own words?`,
      visual: "📝",
    },
    {
      kind: "Summary",
      title: `Remember ${concept}`,
      text: lesson.memoryTrick || `Meaning first, example next, practice last. That makes ${concept} clear.`,
      visual: "⭐",
    },
  ];
}
