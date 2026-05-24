"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Target } from "lucide-react";

type ChildOption = { id: string; name: string; grade: string };
type ExamPlan = {
  id: string;
  examName: string;
  examDate?: string;
  subjects: string[];
  chapters: string[];
  readinessScore?: number;
  dailyPlan: { day: number; focus: string; task: string }[];
  status: string;
};

export function ExamPlannerClient({ childOptions }: { childOptions: ChildOption[] }) {
  const [selectedChildId, setSelectedChildId] = useState(childOptions[0]?.id || "");
  const [plans, setPlans] = useState<ExamPlan[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    fetch(`/api/exams?childId=${encodeURIComponent(selectedChildId)}`)
      .then((response) => response.json())
      .then((data: { plans?: ExamPlan[] }) => {
        if (!cancelled) setPlans(data.plans || []);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: selectedChildId,
        examName: form.get("examName"),
        examDate: form.get("examDate"),
        subjects: form.get("subjects"),
        chapters: form.get("chapters"),
        weightage: form.get("weightage"),
      }),
    });
    const data = (await response.json()) as { plan?: ExamPlan; error?: string };
    if (!response.ok || !data.plan) {
      setMessage(data.error || "Could not create exam plan.");
      return;
    }
    setPlans((current) => [data.plan!, ...current]);
    setMessage("Exam plan created. Use this as the daily preparation track.");
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-purple-700">Exam planner</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Turn teacher portions into a focused 95% plan</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Add exam chapters, topics, date, and marks weightage. ConceptKid prioritizes weak areas, mock tests, and daily revision without stress.
            </p>
          </div>
          {childOptions.length > 1 && (
            <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">
              {childOptions.map((child) => (
                <option key={child.id} value={child.id}>{child.name} · {child.grade}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <CalendarDays className="h-7 w-7 text-purple-600" />
          <h2 className="mt-3 text-xl font-black text-slate-950">Create exam preparation plan</h2>
          <div className="mt-5 grid gap-4">
            <Input name="examName" label="Exam name" placeholder="Half-yearly / Unit Test 2" required />
            <Input name="examDate" label="Exam date" type="date" placeholder="" />
            <TextArea name="subjects" label="Subject(s)" placeholder="Maths, Science" />
            <TextArea name="chapters" label="Chapters/topics from teacher" placeholder="Polynomials, Motion, Grammar: Nouns" />
            <TextArea name="weightage" label="Marks / weightage if known" placeholder="Polynomials 20 marks, Motion 10 marks" />
          </div>
          {message && <p className="mt-4 rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-800">{message}</p>}
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white">
            <Target className="h-4 w-4" /> Build study plan
          </button>
        </form>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <h2 className="text-xl font-black text-slate-950">Exam plans</h2>
          {plans.length === 0 ? (
            <div className="mt-4 rounded-3xl bg-slate-50 p-6 text-sm font-semibold leading-6 text-slate-600">
              No exam plans yet. Add the chapters your teacher gave and ConceptKid will create a daily preparation path.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {plans.map((plan) => (
                <article key={plan.id} className="rounded-3xl bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{plan.examName}</h3>
                      <p className="text-xs font-semibold text-slate-500">{plan.examDate ? new Date(plan.examDate).toLocaleDateString() : "Date not set"}</p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                      Readiness {Math.round(plan.readinessScore || 0)}%
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    {plan.chapters.map((chapter) => (
                      <span key={chapter} className="rounded-full bg-white px-3 py-1 text-slate-700">{chapter}</span>
                    ))}
                  </div>
                  <ol className="mt-4 space-y-2">
                    {plan.dailyPlan.slice(0, 5).map((day) => (
                      <li key={day.day} className="rounded-2xl bg-white p-3 text-sm leading-6">
                        <div className="font-black text-slate-950">Day {day.day}: {day.focus}</div>
                        <p className="font-semibold text-slate-600">{day.task}</p>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Input({ name, label, placeholder, type = "text", required = false }: { name: string; label: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <input name={name} type={type} required={required} placeholder={placeholder} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
    </label>
  );
}

function TextArea({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <textarea name={name} placeholder={placeholder} className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
    </label>
  );
}
