"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ExamPack = {
  chapterId: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
  questions: { id: string; prompt: string; concept: string; choices: { id: string; text: string }[] }[];
};

type ExamResult = {
  score: { score: number; total: number; percentage: number; mastered: boolean; weakConcepts: string[] };
  mastery: { status: string; masteryScore: number; attempts: number };
  backlogPlan?: { dailyPlan: { day: number; focus: string; tasks: string[] }[] };
  passMark: number;
};

type GetResponse = {
  child: { id: string; name: string; grade: string };
  pack: ExamPack;
  mastery?: { status: string; masteryScore: number; attempts: number };
  passMark: number;
};

export function ExamClient({ childId, chapterId }: { childId: string; chapterId: string }) {
  const [data, setData] = useState<GetResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retake, setRetake] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chapter/exam?childId=${encodeURIComponent(childId)}&chapterId=${encodeURIComponent(chapterId)}`)
      .then((r) => r.json())
      .then((res: GetResponse | { error: string }) => {
        if (cancelled) return;
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setError(null);
        setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the chapter exam.");
      });
    return () => {
      cancelled = true;
    };
  }, [childId, chapterId]);

  const submit = useCallback(async () => {
    if (!data) return;
    const missing = data.pack.questions.find((q) => !answers[q.id]);
    if (missing) {
      setError("Please answer every question.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/chapter/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          chapterId,
          answers: data.pack.questions.map((q) => ({ questionId: q.id, choiceId: answers[q.id] })),
        }),
      });
      const json = (await response.json()) as ExamResult & { error?: string };
      if (!response.ok || !json.score) {
        setError(json.error || "Could not submit answers.");
        return;
      }
      setResult(json);
      setRetake(false);
    } finally {
      setSubmitting(false);
    }
  }, [answers, childId, chapterId, data]);

  if (error && !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="w-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <Link href="/chapters" className="mt-3 inline-block text-sm font-semibold text-purple-700">Back to chapters</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="w-full animate-pulse rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Loading chapter exam…
        </div>
      </main>
    );
  }

  if (result && !retake) {
    const passMark = result.passMark ?? data.passMark;
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="w-full max-w-none space-y-5">
          <Header pack={data.pack} childName={data.child.name} />
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chapter exam result</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{Math.round(result.score.percentage)}%</p>
                <p className="text-sm text-slate-500">{result.score.score} / {result.score.total} correct · pass mark {passMark}%</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  result.score.mastered
                    ? "bg-green-50 text-green-700"
                    : result.score.percentage >= 60
                    ? "bg-amber-50 text-amber-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.score.mastered ? "Mastered" : result.score.percentage >= 60 ? "Revision" : "Needs more learning"}
              </span>
            </div>

            {result.score.mastered ? (
              <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
                Congratulations — chapter mastered! The next chapter is now open.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-700">
                  Below the 95% mastery bar. We&rsquo;ve created a short backlog plan for the weak concepts:
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {result.score.weakConcepts.map((c) => (
                    <li key={c} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                      {c}
                    </li>
                  ))}
                </ul>
                {result.backlogPlan && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Backlog plan</p>
                    <ol className="mt-2 space-y-2 text-sm text-slate-700">
                      {result.backlogPlan.dailyPlan.map((d) => (
                        <li key={d.day}>
                          <span className="font-semibold text-slate-900">Day {d.day} — {d.focus}:</span>
                          <ul className="mt-1 list-inside list-disc text-slate-600">
                            {d.tasks.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setResult(null);
                    setRetake(true);
                  }}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Re-take chapter exam
                </button>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/chapters" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                Back to chapters
              </Link>
              <Link href="/parent" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                Parent dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="w-full max-w-none space-y-5">
        <Header pack={data.pack} childName={data.child.name} />
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {data.pack.questions.length} questions · Need {data.passMark}% to mark mastered.
            </p>
            {data.mastery && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Best so far: {Math.round(data.mastery.masteryScore)}% · {data.mastery.attempts} attempts
              </span>
            )}
          </div>
          <ol className="mt-5 space-y-5">
            {data.pack.questions.map((q, idx) => (
              <li key={q.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Q{idx + 1} · {q.concept}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{q.prompt}</div>
                <div className="mt-3 grid gap-2">
                  {q.choices.map((c) => {
                    const selected = answers[q.id] === c.id;
                    return (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                          selected ? "border-purple-500 bg-purple-50 text-purple-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="accent-purple-600"
                          checked={selected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                        />
                        <span>{c.text}</span>
                      </label>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Scoring…" : "Submit chapter exam"}
            </button>
            <Link href="/chapters" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              Cancel
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Header({ pack, childName }: { pack: ExamPack; childName: string }) {
  return (
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">{pack.subject} · {pack.grade}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Chapter exam: {pack.chapter}</h1>
      <p className="mt-1 text-sm text-slate-600">For {childName}. 95% required to unlock the next chapter.</p>
    </header>
  );
}
