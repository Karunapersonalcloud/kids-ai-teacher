"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PrecheckPack = {
  chapterId: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
  prerequisites: string[];
  questions: { id: string; prompt: string; concept: string; choices: { id: string; text: string }[] }[];
};

type ReadinessResult = {
  readinessStatus: "ready" | "needs-prerequisites";
  score: number;
  total: number;
  percentage: number;
  weakPrerequisites: string[];
  recommendedPrerequisiteLessons: { concept: string; summary: string }[];
};

type GetResponse = {
  child: { id: string; name: string; grade: string };
  pack: PrecheckPack;
  latestResult: ReadinessResult | undefined;
};

export function PrecheckClient({ childId, chapterId }: { childId: string; chapterId: string }) {
  const [data, setData] = useState<GetResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReadinessResult | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [retake, setRetake] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/chapter/precheck?childId=${encodeURIComponent(childId)}&chapterId=${encodeURIComponent(chapterId)}`)
      .then((r) => r.json())
      .then((res: GetResponse | { error: string }) => {
        if (cancelled) return;
        if ("error" in res) {
          setError(res.error);
          return;
        }
        setError(null);
        setData(res);
        setResult(res.latestResult);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the pre-check. Please try again.");
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
      const response = await fetch("/api/chapter/precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          chapterId,
          answers: data.pack.questions.map((q) => ({ questionId: q.id, choiceId: answers[q.id] })),
        }),
      });
      const json = (await response.json()) as { result?: ReadinessResult; error?: string };
      if (!response.ok || !json.result) {
        setError(json.error || "Could not submit answers.");
        return;
      }
      setResult(json.result);
      setRetake(false);
    } finally {
      setSubmitting(false);
    }
  }, [answers, childId, chapterId, data]);

  if (error && !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <Link href="/chapters" className="mt-3 inline-block text-sm font-semibold text-purple-700">Back to chapters</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl animate-pulse rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          Loading pre-check…
        </div>
      </main>
    );
  }

  if (result && !retake) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <Header pack={data.pack} childName={data.child.name} />
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pre-check result</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {result.score} / {result.total} ({Math.round(result.percentage)}%)
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  result.readinessStatus === "ready" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
                }`}
              >
                {result.readinessStatus === "ready" ? "Ready for chapter" : "Strengthen prerequisites first"}
              </span>
            </div>

            {result.readinessStatus === "ready" ? (
              <div className="mt-5 rounded-2xl bg-purple-50 p-4 text-sm text-purple-800">
                Great! You can start the chapter now. The chapter exam unlocks after the lessons.
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/chapters/exam?childId=${childId}&chapterId=${chapterId}`}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Go to chapter exam
                  </Link>
                  <Link href="/chapters" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    Back to chapters
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-700">
                  Let&rsquo;s strengthen these prerequisites before opening the chapter:
                </p>
                <ul className="space-y-2">
                  {result.recommendedPrerequisiteLessons.map((lesson) => (
                    <li key={lesson.concept} className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-sm font-semibold text-slate-900">{lesson.concept}</div>
                      <div className="mt-1 text-sm text-slate-700">{lesson.summary}</div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setRetake(true);
                  }}
                  className="mt-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Re-take pre-check
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <Header pack={data.pack} childName={data.child.name} />
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-600">
            Answer all {data.pack.questions.length} questions. The pre-check checks prerequisites only — no penalty.
          </p>
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
              {submitting ? "Scoring…" : "Submit pre-check"}
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

function Header({ pack, childName }: { pack: PrecheckPack; childName: string }) {
  return (
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">{pack.subject} · {pack.grade}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Pre-check: {pack.chapter}</h1>
      <p className="mt-1 text-sm text-slate-600">For {childName}. Prerequisites: {pack.prerequisites.join(", ")}.</p>
    </header>
  );
}
