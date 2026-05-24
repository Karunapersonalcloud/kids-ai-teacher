"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { children, getSubjectsForChild } from "@/lib/mock-data";
import type { ProgressRecord } from "@/lib/types";

export function ProgressClient() {
  const [records, setRecords] = useState<ProgressRecord[]>([]);

  useEffect(() => {
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data: { progress?: ProgressRecord[] }) => setRecords(data.progress || []))
      .catch(() => setRecords([]));
  }, []);

  return (
    <AppShell activeChildAvatar={children[0].avatar}>
      <div className="grid gap-5 lg:grid-cols-2">
        {children.map((child) => {
          const progress = records.find((record) => record.childId === child.id);
          return (
            <section key={child.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-4xl">{child.avatar}</div>
                <div>
                  <h1 className="text-2xl font-black">{child.name}</h1>
                  <p className="font-semibold text-slate-500">{child.grade} • {child.focus}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Stars earned" value={progress?.starsEarned || 0} tone="bg-yellow-50" />
                <Metric label="Day streak" value={progress?.streakCount || 0} tone="bg-orange-50" />
                <Metric label="Lessons completed" value={progress?.lessonsCompleted.length || 0} tone="bg-green-50" />
                <Metric label="Quizzes attempted" value={progress?.quizzesAttempted || 0} tone="bg-purple-50" />
              </div>
              <h2 className="mb-3 mt-6 font-black text-purple-700">Subject Progress</h2>
              <div className="space-y-4">
                {getSubjectsForChild(child.id).slice(0, 5).map((subject) => {
                  const completed = progress?.lessonsCompleted.filter((lesson) => lesson.startsWith(subject.name)).length || 0;
                  const revised = progress?.topicsRevised.filter((topic) => topic.startsWith(subject.name)).length || 0;
                  const value = Math.min(100, (completed + revised) * 15);
                  return (
                    <div key={subject.slug}>
                      <div className="mb-1 flex justify-between text-sm font-black"><span>{subject.name}</span><span>{value || "New"}</span></div>
                      <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-purple-500" style={{ width: `${value}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                Weak concepts: {progress?.weakConcepts.length ? progress.weakConcepts.slice(-3).join(", ") : "No saved weak concepts yet"}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-xl p-4 ${tone}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm font-bold text-slate-500">{label}</div>
    </div>
  );
}
