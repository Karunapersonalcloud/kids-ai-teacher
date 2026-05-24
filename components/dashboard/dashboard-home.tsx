"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  LineChart,
  MessageCircle,
  MoreVertical,
  Settings,
  Star,
  Trophy,
  UploadCloud,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { children, getSubjectsForChild, mockUploads } from "@/lib/mock-data";
import type { ChildId, ProgressRecord } from "@/lib/types";

const plan = [
  { title: "Maths", sub: "Chapter 3: Fractions", status: "Completed", badge: "bg-green-100 text-green-700" },
  { title: "Science", sub: "Chapter 2: Our Environment", status: "In Progress", badge: "bg-orange-100 text-orange-700" },
  { title: "English", sub: "Grammar: Nouns", status: "Pending", badge: "bg-purple-100 text-purple-700" },
  { title: "Daily Quiz", sub: "10 Questions", status: "Start Now", badge: "bg-blue-100 text-blue-700" },
];

export function DashboardHome() {
  const [selectedChildId, setSelectedChildId] = useState<ChildId>("jayadeep");
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const selectedChild = children.find((child) => child.id === selectedChildId) || children[0];
  const childSubjects = getSubjectsForChild(selectedChildId);
  const selectedProgress = progressRecords.find((record) => record.childId === selectedChildId);

  useEffect(() => {
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data: { progress?: ProgressRecord[] }) => setProgressRecords(data.progress || []))
      .catch(() => undefined);
  }, []);

  return (
    <AppShell activeChildAvatar={selectedChild.avatar}>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-black text-purple-700">♡ My Children</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`relative rounded-2xl p-5 text-center shadow-sm ring-1 transition hover:scale-[1.01] ${
                      child.id === "jayadeep" ? "bg-blue-50 ring-blue-100" : "bg-pink-50 ring-pink-100"
                    } ${selectedChildId === child.id ? "outline outline-2 outline-purple-400" : ""}`}
                  >
                    <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white">
                      <Trophy className="h-4 w-4 fill-white" />
                    </div>
                    <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white text-6xl shadow-sm">{child.avatar}</div>
                    <div className="text-sm font-black uppercase text-purple-600">{child.role}</div>
                    <div className="text-2xl font-black">{child.name}</div>
                    <div className="mx-auto mt-2 inline-flex rounded-full bg-purple-600 px-4 py-1 text-xs font-bold text-white">{child.grade}</div>
                    <div className="mt-3 text-sm font-bold text-purple-700">Level {child.level}</div>
                    <p className="mx-auto mt-2 max-w-[240px] text-xs font-semibold leading-5 text-slate-500">{child.focus}</p>
                  </button>
                ))}
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 py-3 font-semibold text-purple-600 hover:bg-purple-50">
                + Add Another Child
              </button>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-black text-purple-700">
                <CalendarDays className="h-5 w-5" /> Today’s Plan
              </h2>
              <div className="space-y-3">
                {plan.map((item) => (
                  <div key={item.title} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black">{item.title}</div>
                      <div className="truncate text-sm text-slate-500">{item.sub}</div>
                    </div>
                    <span className={`rounded-full px-4 py-2 text-xs font-bold ${item.badge}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-black text-purple-700">
                <BookOpen className="h-5 w-5" /> My Subjects
              </h2>
              <Link href="/subjects" className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600">
                View All ›
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
              {childSubjects.map((subject) => {
                const Icon = subject.icon;
                return (
                  <Link
                    key={subject.slug}
                    href={`/subjects/${subject.slug}?child=${selectedChildId}`}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-4 font-black transition hover:scale-[1.01] ${subject.bg} ${subject.color} ${subject.border}`}
                  >
                    <Icon className="h-5 w-5" /> {subject.name}
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-black text-purple-700">
                  <UploadCloud className="h-5 w-5" /> Upload & Study Materials
                </h2>
                <Link href="/uploads" className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
                  Open Uploads
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-[230px_1fr]">
                <Link href="/uploads" className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-4 text-center hover:bg-blue-100">
                  <UploadCloud className="mb-3 h-14 w-14 text-blue-500" />
                  <div className="font-black text-blue-700">Upload learning files</div>
                  <div className="mt-2 text-sm text-blue-600">PDF, PPTX, DOCX, images, TXT</div>
                </Link>
                <div className="space-y-2">
                  {mockUploads.slice(0, 4).map((file) => (
                    <div key={file.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-xs font-black text-white">{file.fileName.split(".").pop()?.toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black">{file.fileName}</div>
                        <div className="text-xs text-slate-500">{file.materialType} • {file.status}</div>
                      </div>
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-black text-purple-700">
                  <LineChart className="h-5 w-5" /> Progress Overview
                </h2>
                <Link href="/progress" className="rounded-full bg-slate-50 px-4 py-2 text-sm font-bold">
                  This Week
                </Link>
              </div>
              <div className="space-y-5">
              {childSubjects.slice(0, 4).map((subject) => {
                const Icon = subject.icon;
                const completed = selectedProgress?.lessonsCompleted.filter((lesson) => lesson.startsWith(subject.name)).length || 0;
                const revised = selectedProgress?.topicsRevised.filter((topic) => topic.startsWith(subject.name)).length || 0;
                const value = Math.min(100, (completed + revised) * 15);
                return (
                    <div key={subject.slug} className="grid grid-cols-[130px_1fr_42px] items-center gap-3">
                      <div className="flex items-center gap-2 font-black">
                        <Icon className="h-5 w-5 text-purple-500" /> {subject.name}
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100">
                        <div className="h-2.5 rounded-full bg-purple-500" style={{ width: `${value}%` }} />
                      </div>
                      <div className="text-right font-black">{value ? `${value}%` : "New"}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 rounded-xl bg-green-50 py-3 text-center font-black text-green-700">
                🏆 {selectedProgress?.starsEarned ? `${selectedProgress.starsEarned} stars earned. Keep it up!` : "Start a lesson or quiz to earn stars!"} 🎉
              </div>
            </section>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black">Ask AI Teacher</h2>
                <p className="mt-2 text-white/90">Get help, explanations & clear your doubts!</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-400 text-3xl font-black">?</div>
            </div>
            <div className="my-3 flex justify-end text-8xl">🤖</div>
            <Link href="/ai-teacher" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-purple-700 shadow-sm">
              <MessageCircle className="h-5 w-5" /> Start Chat
            </Link>
          </section>

          <section className="rounded-2xl bg-amber-50 p-5 shadow-sm">
            <h2 className="mb-3 font-black text-orange-700">💡 Today’s Quote</h2>
            <div className="flex items-center gap-4">
              <p className="flex-1 font-semibold leading-6">
                The beautiful thing about learning is that no one can take it away from you.
                <br />
                <span className="text-sm text-slate-500">– B.B. King</span>
              </p>
              <div className="text-6xl">⭐</div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-purple-700">
              <Users className="h-5 w-5" /> Parent Dashboard
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/parent/ai-review" className="rounded-xl bg-green-50 p-4">
                <div className="font-black">AI Learning Health Check</div>
                <div className="mt-2 text-xs text-slate-500">Missing uploads and weak area alerts</div>
                <LineChart className="ml-auto mt-2 h-8 w-8 text-green-500" />
              </Link>
              <Link href="/parent" className="rounded-xl bg-purple-50 p-4">
                <div className="font-black">Study Reports</div>
                <div className="mt-2 text-xs text-slate-500">Detailed reports & analytics</div>
              </Link>
              <Link href="/parent" className="rounded-xl bg-blue-50 p-4">
                <div className="font-black">Screen Time</div>
                <div className="mt-2 text-xs text-slate-500">Manage usage & limits</div>
                <Clock3 className="ml-auto mt-2 h-8 w-8 text-blue-500" />
              </Link>
              <Link href="/parent" className="rounded-xl bg-orange-50 p-4">
                <div className="font-black">Settings</div>
                <div className="mt-2 text-xs text-slate-500">Profiles & preferences</div>
                <Settings className="ml-auto mt-2 h-8 w-8 text-orange-500" />
              </Link>
            </div>
            <Link href="/parent" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300 py-3 font-black text-purple-700 hover:bg-purple-50">
              Go to Parent Panel <ChevronRight className="h-5 w-5" />
            </Link>
          </section>
        </aside>
      </div>

      <footer className="mt-5 flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-slate-600">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" /> Keep learning every day and become a super star! 🌟
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-purple-700">🎁 Next Reward in 3 Stars</span>
          <div className="h-2 w-32 rounded-full bg-slate-100">
            <div className="h-2 w-20 rounded-full bg-green-500" />
          </div>
          <span className="rounded-full bg-slate-50 px-4 py-2 font-black">7 / 10</span>
        </div>
      </footer>
    </AppShell>
  );
}
