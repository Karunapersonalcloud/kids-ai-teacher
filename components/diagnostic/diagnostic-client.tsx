"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { DiagnosticRecord } from "@/lib/diagnostic-store";

type QuestionView = {
  id: string;
  area: string;
  subject: string;
  prompt: string;
  choices: { id: string; label: string }[];
};

type PackResponse = {
  child: { id: string; name: string; grade: string };
  pack: { title: string; grade: string; questions: QuestionView[] };
  latestResult: DiagnosticRecord | null;
};

export function DiagnosticClient({
  childId,
  childName,
  grade,
  existingResult,
}: {
  childId: string;
  childName: string;
  grade: string;
  existingResult: DiagnosticRecord | null;
}) {
  const [pack, setPack] = useState<PackResponse["pack"] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DiagnosticRecord | null>(existingResult);
  const [error, setError] = useState<string | null>(null);
  const [retake, setRetake] = useState(false);

  useEffect(() => {
    if (result && !retake) return;
    let cancelled = false;
    fetch(`/api/diagnostic?childId=${encodeURIComponent(childId)}`)
      .then((response) => response.json())
      .then((data: PackResponse | { error: string }) => {
        if (cancelled) return;
        if ("error" in data) {
          setError(data.error);
          return;
        }
        setError(null);
        setPack(data.pack);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the diagnostic. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [childId, result, retake]);

  async function submit() {
    if (!pack) return;
    const missing = pack.questions.find((q) => !answers[q.id]);
    if (missing) {
      setError("Please answer every question — the baseline check must be honest.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          answers: pack.questions.map((q) => ({ questionId: q.id, choiceId: answers[q.id] })),
        }),
      });
      const data = (await response.json()) as { result?: DiagnosticRecord; error?: string };
      if (!response.ok || !data.result) {
        setError(data.error || "Could not save the result.");
        return;
      }
      setResult(data.result);
      setRetake(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (result && !retake) {
    return (
      <ResultView
        result={result}
        childName={childName}
        onRetake={() => {
          setRetake(true);
          setResult(null);
          setAnswers({});
        }}
      />
    );
  }

  if (!pack) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : <p className="text-sm text-slate-500">Loading diagnostic…</p>}
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{pack.title}</h2>
        <p className="text-sm text-slate-500">{childName} · {grade} · {pack.questions.length} questions</p>
      </div>

      <ol className="space-y-5">
        {pack.questions.map((question, index) => (
          <li key={question.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-semibold text-purple-700">Q{index + 1}</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{question.area}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{question.prompt}</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {question.choices.map((choice) => {
                const checked = answers[question.id] === choice.id;
                return (
                  <label
                    key={choice.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      checked ? "border-purple-400 bg-purple-50 text-purple-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={choice.id}
                      checked={checked}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: choice.id }))}
                      className="accent-purple-600"
                    />
                    {choice.label}
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">{error}</p>}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
        >
          {submitting ? "Scoring…" : "Submit diagnostic"}
        </button>
      </div>
    </section>
  );
}

function ResultView({ result, childName, onRetake }: { result: DiagnosticRecord; childName: string; onRetake: () => void }) {
  const completedAt = new Date(result.completedAt).toLocaleString();
  const riskTone =
    result.riskLevel === "Low" ? "bg-green-50 text-green-700" : result.riskLevel === "Medium" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700";

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Diagnostic complete
            </span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{childName}&rsquo;s baseline result</h2>
            <p className="text-sm text-slate-500">Completed {completedAt}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-purple-700">{Math.round(result.percentage)}%</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{result.score}/{result.total} correct</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Stat label="Risk level" value={result.riskLevel} className={riskTone} />
          <Stat label="Recommended start" value={result.recommendedStartLevel || "—"} className="bg-slate-50 text-slate-700" />
          <Stat label="Subject" value={result.subject} className="bg-slate-50 text-slate-700" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Strong areas" empty="No strong areas detected yet." items={result.strongAreas} tone="green" />
        <Panel title="Weak areas (focus here)" empty="No weak areas — great baseline!" items={result.weakAreas} tone="red" />
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Daily learning plan</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {result.learningPlan.map((step, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-purple-600">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/parent" className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">
          Back to Parent Dashboard
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" /> Retake diagnostic
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${className}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone: "green" | "red" }) {
  const toneClass = tone === "green" ? "text-green-700" : "text-red-700";
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h3 className={`text-sm font-semibold ${toneClass}`}>{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
