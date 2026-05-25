"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, UploadCloud } from "lucide-react";

type ChildOption = { id: string; name: string; grade: string };
type HomeworkRecord = {
  id: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  ocrStatus: string;
  status: string;
  score?: number;
  feedback: { label: string; detail: string; action: string }[];
  submittedAt: string;
};

export function HomeworkClient({ childOptions }: { childOptions: ChildOption[] }) {
  const [selectedChildId, setSelectedChildId] = useState(childOptions[0]?.id || "");
  const [items, setItems] = useState<HomeworkRecord[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedChildId) return;
    let cancelled = false;
    fetch(`/api/homework?childId=${encodeURIComponent(selectedChildId)}`)
      .then((response) => response.json())
      .then((data: { submissions?: HomeworkRecord[] }) => {
        if (!cancelled) setItems(data.submissions || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("childId", selectedChildId);
    const response = await fetch("/api/homework", { method: "POST", body: form });
    const data = (await response.json()) as { submission?: HomeworkRecord; error?: string };
    if (!response.ok || !data.submission) {
      setMessage(data.error || "Could not submit homework.");
      return;
    }
    setItems((current) => [data.submission!, ...current]);
    setMessage("Homework uploaded. Review is ready with OCR confidence notes.");
    event.currentTarget.reset();
  }

  return (
    <div className="w-full max-w-none space-y-6">
      <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-purple-700">Homework verification</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Upload homework, notebook pages, or answer photos</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              ConceptKid checks submitted work, flags unclear images, and gives correction-focused feedback. Young students get gentle wording; exam work is scored strictly.
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
          <Camera className="h-7 w-7 text-purple-600" />
          <h2 className="mt-3 text-xl font-black text-slate-950">Upload for checking</h2>
          <div className="mt-5 grid gap-4">
            <Input name="subject" label="Subject" placeholder="Maths / EVS / English" />
            <Input name="chapter" label="Chapter" placeholder="Chapter name or number" />
            <Input name="topic" label="Topic" placeholder="Optional topic" />
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Homework photo / worksheet
              <input name="file" type="file" accept="image/*,.pdf" className="rounded-2xl border border-dashed border-purple-200 bg-purple-50 px-4 py-4 text-sm font-semibold text-purple-800" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Parent note
              <textarea name="note" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Example: please check answers 1-5, photo is clear" />
            </label>
          </div>
          {message && <p className="mt-4 rounded-2xl bg-purple-50 p-3 text-sm font-bold text-purple-800">{message}</p>}
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white">
            <UploadCloud className="h-4 w-4" /> Submit homework
          </button>
        </form>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <h2 className="text-xl font-black text-slate-950">Recent homework checks</h2>
          {items.length === 0 ? (
            <div className="mt-4 rounded-3xl bg-slate-50 p-6 text-sm font-semibold leading-6 text-slate-600">
              No homework submitted yet. Upload one photo or worksheet to see correction feedback here.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-950">{item.subject || "General"} · {item.chapter || "Homework"}</h3>
                      <p className="text-xs font-semibold text-slate-500">{new Date(item.submittedAt).toLocaleString()}</p>
                    </div>
                    <Status status={item.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">OCR: {item.ocrStatus}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700">Score: {item.score ?? 0}%</span>
                  </div>
                  {item.feedback.map((feedback) => (
                    <div key={feedback.label} className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6">
                      <div className="font-black text-slate-950">{feedback.label}</div>
                      <p className="font-semibold text-slate-600">{feedback.detail}</p>
                      <p className="mt-1 font-black text-purple-700">Parent action: {feedback.action}</p>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Input({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <input name={name} placeholder={placeholder} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
    </label>
  );
}

function Status({ status }: { status: string }) {
  const ok = status === "correct";
  const unclear = status.includes("unclear");
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  const tone = ok ? "bg-green-50 text-green-700" : unclear ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${tone}`}>
      <Icon className="h-3.5 w-3.5" /> {status}
    </span>
  );
}
