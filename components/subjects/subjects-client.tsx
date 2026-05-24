"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect } from "@/components/shared/controls";
import { children, getSubjectsForChild } from "@/lib/mock-data";
import type { ChildId } from "@/lib/types";

export function SubjectsClient() {
  const [childId, setChildId] = useState<ChildId>("jayadeep");
  const child = children.find((item) => item.id === childId) || children[0];
  const childSubjects = getSubjectsForChild(childId);

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-purple-700">My Subjects</h1>
            <p className="mt-1 font-semibold text-slate-500">Choose a subject to open lessons, uploads, quizzes, and AI teaching tools.</p>
          </div>
          <ChildSelect value={childId} onChange={setChildId} />
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {childSubjects.map((subject) => {
          const Icon = subject.icon;
          return (
            <Link key={subject.slug} href={`/subjects/${subject.slug}?child=${childId}`} className={`rounded-2xl border p-5 shadow-sm transition hover:scale-[1.01] ${subject.bg} ${subject.border}`}>
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white ${subject.color}`}>
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-black">{subject.name}</h2>
              <p className="mt-2 min-h-14 text-sm font-semibold leading-6 text-slate-600">{subject.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {subject.chapters.slice(0, 3).map((chapter) => (
                  <span key={chapter} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                    {chapter}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
