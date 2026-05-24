"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LockKeyhole, Sparkles, Volume2 } from "lucide-react";
import type { DemoVisualLesson } from "@/lib/demo/demo-lesson-generator";
import { AudioNarrationControls } from "./audio-narration-controls";

export function DemoVisualPreview({ lesson }: { lesson: DemoVisualLesson }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoRead, setAutoRead] = useState(false);
  const slide = lesson.slides[activeSlide] || lesson.slides[0];
  const practice = lesson.practiceQuestions[Math.min(activeSlide, Math.max(0, lesson.practiceQuestions.length - 1))];
  const narrationText = useMemo(() => {
    const parts = [
      slide?.title,
      slide?.description,
      practice ? `Practice question. ${practice.question}. Sample answer. ${practice.answer}` : "",
      lesson.safetyNote,
    ];
    return parts.filter(Boolean).join(". ");
  }, [lesson.safetyNote, practice, slide]);

  function goToSlide(nextIndex: number) {
    setActiveSlide(Math.max(0, Math.min(nextIndex, lesson.slides.length - 1)));
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">{lesson.previewLabel}</span>
          <h3 className="mt-4 text-2xl font-black text-slate-950">{lesson.title}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            {lesson.grade} • {lesson.board} • {lesson.subject} • {lesson.chapter}
            {lesson.topic ? ` • ${lesson.topic}` : ""}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
          {lesson.previewPercent}% preview
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
        {lesson.previewMode === "chapter_25_percent"
          ? "For a full chapter request, we show a 25% preview so you can understand the teaching style."
          : "For a specific topic request, we show up to 50% of that topic so you can see how visual learning works."}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <article className="rounded-3xl bg-[#f7f5ff] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{slide.icon}</div>
              <div>
                <div className="text-xs font-black text-purple-700">Slide {activeSlide + 1} of {lesson.slides.length}</div>
                <h4 className="text-xl font-black text-slate-950">{slide.title}</h4>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700">
              <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} className="accent-purple-600" />
              Auto-read slides
            </label>
          </div>
          <p className="mt-5 text-base font-semibold leading-7 text-slate-700">{slide.description}</p>

          {practice && (
            <div className="mt-5 rounded-3xl bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-black text-purple-700">
                <Sparkles className="h-5 w-5" />
                Practice preview
              </div>
              <p className="mt-3 text-sm font-black leading-6 text-slate-800">{practice.question}</p>
              <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold leading-6 text-green-700">Sample answer: {practice.answer}</p>
            </div>
          )}

          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700">
              <Volume2 className="h-4 w-4 text-purple-600" />
              Audio narration
            </div>
            <AudioNarrationControls key={`${lesson.title}-${activeSlide}`} text={narrationText} language={lesson.language || "English"} autoPlay={autoRead} />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button type="button" onClick={() => goToSlide(activeSlide - 1)} disabled={activeSlide === 0} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button type="button" onClick={() => goToSlide(activeSlide + 1)} disabled={activeSlide === lesson.slides.length - 1} className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white disabled:opacity-40">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <aside className="rounded-3xl bg-slate-950 p-5 text-white">
          <h4 className="text-sm font-black text-purple-200">Visual lesson slides</h4>
          <div className="mt-3 grid gap-2">
            {lesson.slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goToSlide(index)}
                className={`rounded-2xl p-3 text-left text-sm font-black transition ${
                  activeSlide === index ? "bg-white text-purple-700" : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.title}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {lesson.lockedSections.map((section) => (
          <div key={section} className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4 text-sm font-black text-slate-600">
            <LockKeyhole className="h-5 w-5 text-slate-400" />
            {section}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
        <h4 className="text-xl font-black">Register to unlock full learning</h4>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
          Registered students get diagnostic testing, full chapter visual lessons, practice, CBSE-style exams, weak-area strengthening, homework upload, and parent progress tracking.
        </p>
        <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm font-semibold leading-6 text-slate-100">{lesson.safetyNote}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-700">Register for Access</Link>
          <Link href="/login" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white">Parent Login</Link>
        </div>
      </div>
    </section>
  );
}
