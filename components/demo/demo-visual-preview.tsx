import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import type { DemoVisualLesson } from "@/lib/demo/demo-lesson-generator";

export function DemoVisualPreview({ lesson }: { lesson: DemoVisualLesson }) {
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

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {lesson.slides.map((slide) => (
          <article key={slide.title} className="rounded-3xl bg-[#f7f5ff] p-5">
            <div className="text-3xl">{slide.icon}</div>
            <h4 className="mt-4 text-lg font-black text-slate-950">{slide.title}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{slide.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-black text-purple-700">
          <Sparkles className="h-5 w-5" />
          Limited practice preview
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {lesson.practiceQuestions.map((question, index) => (
            <div key={question.question} className="rounded-3xl bg-slate-50 p-5">
              <div className="text-xs font-black text-slate-400">Practice {index + 1}</div>
              <p className="mt-3 text-sm font-black leading-6 text-slate-800">{question.question}</p>
              <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-green-700">Sample answer: {question.answer}</p>
            </div>
          ))}
        </div>
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
