"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect, SubjectSelect } from "@/components/shared/controls";
import { children, getSubjectsForChild, mockVisualLesson } from "@/lib/mock-data";
import type { ChildId, VisualLesson } from "@/lib/types";

export function VisualLearningClient() {
  const [childId, setChildId] = useState<ChildId>("jayadeep");
  const [subject, setSubject] = useState(getSubjectsForChild("jayadeep")[0].name);
  const [topic, setTopic] = useState("Explain fractions");
  const [lesson, setLesson] = useState<VisualLesson>(mockVisualLesson);
  const [loading, setLoading] = useState(false);
  const child = children.find((item) => item.id === childId) || children[0];

  async function createLesson() {
    setLoading(true);
    const response = await fetch("/api/ai-teacher/visual-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, subject, topic }),
    });
    const data = (await response.json()) as VisualLesson;
    setLesson(data);
    setLoading(false);
  }

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[220px_220px_1fr_auto]">
          <ChildSelect
            value={childId}
            onChange={(nextChild) => {
              setChildId(nextChild);
              setSubject(getSubjectsForChild(nextChild)[0].name);
            }}
          />
          <SubjectSelect childId={childId} value={subject} onChange={setSubject} />
          <input className="rounded-xl border border-purple-100 px-4 py-3 font-bold shadow-sm" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic, chapter, or doubt" />
          <button onClick={createLesson} className="rounded-xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm hover:bg-purple-700">
            {loading ? "Creating..." : "Create Visual Lesson"}
          </button>
        </div>
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
