"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { children } from "@/lib/mock-data";

const review = {
  missingUploads: ["Jayadeep textbook not uploaded", "Academic diary missing for this week", "Harini homework not uploaded"],
  pendingStudyAreas: ["Jayadeep: fractions foundations", "Jayadeep: science vocabulary", "Harini: phonics and reading fluency"],
  weakSubjectAlerts: ["Maths foundation gaps", "Science concept gaps", "Reading fluency needs daily practice"],
  todayFocus: "20 minutes Maths foundation + 15 minutes reading aloud + upload academic diary.",
  jayadeepRiskAreas: ["Reading gaps", "Maths foundation gaps", "Science concept gaps", "Internal assessment caution"],
  hariniRiskAreas: ["Phonics", "Reading fluency", "Basic number sense"],
  parentActions: ["Upload diary", "Complete 20-minute reading practice", "Conduct quiz", "Revise worksheet"],
};

export function AIReviewClient() {
  const [aiNote, setAiNote] = useState("Mock health check is ready. AI review can run when OPENAI_API_KEY is configured.");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    setLoading(true);
    const response = await fetch("/api/parent/ai-review", { method: "POST" });
    const data = (await response.json()) as { summary: string };
    setAiNote(data.summary);
    setLoading(false);
  }

  return (
    <AppShell activeChildAvatar={children[0].avatar}>
      <section className="rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-black">AI Learning Health Check</h1>
        <p className="mt-2 max-w-3xl font-semibold text-white/85">A parent-friendly review of missing materials, weak areas, risk alerts, and today’s best learning focus.</p>
        <button onClick={askAI} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-purple-700 shadow-sm">
          <Sparkles className="h-5 w-5" /> {loading ? "Reviewing..." : "Ask AI to review progress"}
        </button>
      </section>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-black text-purple-700">AI / Mock Summary</h2>
        <p className="font-semibold leading-7 text-slate-700">{aiNote}</p>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ReviewCard title="Missing Uploads" items={review.missingUploads} tone="red" />
        <ReviewCard title="Pending Study Areas" items={review.pendingStudyAreas} tone="amber" />
        <ReviewCard title="Weak Subject Alerts" items={review.weakSubjectAlerts} tone="purple" />
      </div>

      <section className="mt-5 rounded-2xl bg-green-50 p-5 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 font-black text-green-700">
          <CheckCircle2 className="h-5 w-5" /> Suggested Today’s Focus
        </h2>
        <p className="font-semibold text-slate-700">{review.todayFocus}</p>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <ReviewCard title="Jayadeep Risk Areas" items={review.jayadeepRiskAreas} tone="blue" />
        <ReviewCard title="Harini Risk Areas" items={review.hariniRiskAreas} tone="pink" />
        <ReviewCard title="Recommended Parent Actions" items={review.parentActions} tone="green" />
      </div>
    </AppShell>
  );
}

function ReviewCard({ title, items, tone }: { title: string; items: string[]; tone: "red" | "amber" | "purple" | "blue" | "pink" | "green" }) {
  const toneClass = {
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
    blue: "bg-blue-50 text-blue-700",
    pink: "bg-pink-50 text-pink-700",
    green: "bg-green-50 text-green-700",
  }[tone];

  return (
    <section className={`rounded-2xl p-5 shadow-sm ${toneClass}`}>
      <h2 className="mb-3 flex items-center gap-2 font-black">
        <AlertTriangle className="h-5 w-5" /> {title}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-white/75 p-3 text-sm font-bold text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
