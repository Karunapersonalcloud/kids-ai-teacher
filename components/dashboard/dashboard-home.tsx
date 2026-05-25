"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Target,
  UploadCloud,
} from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { children, getSubjectsForChild } from "@/lib/mock-data";
import type { ChildId } from "@/lib/types";

const tabs = ["Learn", "Homework", "Exams", "Progress", "Materials"] as const;

const childPlans: Record<ChildId, { chapter: string; subject: string; mastery: number; weak: string[]; action: string; risk: string }> = {
  jayadeep: {
    subject: "Mathematics",
    chapter: "Polynomials",
    mastery: 58,
    weak: ["Fractions", "Algebra basics", "Word problems"],
    action: "Complete chapter pre-check before lesson",
    risk: "Medium",
  },
  harini: {
    subject: "EVS",
    chapter: "Animals Around Us",
    mastery: 64,
    weak: ["Reading fluency", "Animal homes"],
    action: "Upload homework photo and take a 5-question practice",
    risk: "Low",
  },
};

export function DashboardHome() {
  const [selectedChildId, setSelectedChildId] = useState<ChildId>("jayadeep");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Learn");
  const selectedChild = children.find((child) => child.id === selectedChildId) || children[0];
  const subjects = useMemo(() => getSubjectsForChild(selectedChildId), [selectedChildId]);
  const plan = childPlans[selectedChildId];

  return (
    <AppShell activeChildAvatar={selectedChild.avatar}>
      <div className="w-full space-y-5">
        <PageHeader
          badge="ConceptKid parent workspace"
          title="Today, focus on one clear next step."
          subtitle="Visual learning stays friendly, but diagnostics and chapter exams are strict. Target mastery is 95% before moving to the next chapter."
          actions={
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Target" value="95%" />
              <Metric label="Current" value={`${plan.mastery}%`} />
              <Metric label="Risk" value={plan.risk} />
            </div>
          }
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          {children.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const active = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      active ? "bg-purple-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-2xl">{child.avatar}</span>
                    <span>
                      <span className="block text-sm font-black">{child.name}</span>
                      <span className={`block text-xs font-semibold ${active ? "text-purple-100" : "text-slate-500"}`}>{child.grade}</span>
                    </span>
                  </button>
                );
              })}
              <Link href="/register" className="ml-auto rounded-2xl border border-dashed border-purple-200 px-4 py-3 text-sm font-black text-purple-700 hover:bg-purple-50">
                + Add Another Child
              </Link>
            </div>
          ) : (
            <ChildSummary child={selectedChild} />
          )}
        </section>

        <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-12">
          <main className="space-y-5 xl:col-span-8 2xl:col-span-9">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black ${
                      activeTab === tab ? "bg-purple-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-5 md:p-6">
                {activeTab === "Learn" && <LearnTab childId={selectedChildId} plan={plan} subjects={subjects.slice(0, 4)} />}
                {activeTab === "Homework" && <HomeworkTab />}
                {activeTab === "Exams" && <ExamsTab />}
                {activeTab === "Progress" && <ProgressTab plan={plan} />}
                {activeTab === "Materials" && <MaterialsTab />}
              </div>
            </section>
          </main>

          <aside className="space-y-5 xl:col-span-4 2xl:col-span-3">
            <ActionCard
              href="/diagnostic"
              icon={Target}
              title="Baseline diagnostic"
              text="Check the current level honestly before learning starts."
              tone="purple"
            />
            <ActionCard
              href="/homework"
              icon={UploadCloud}
              title="Upload homework"
              text="Check notebook pages, worksheets, and answer photos."
              tone="blue"
            />
            <ActionCard
              href="/exams"
              icon={ClipboardCheck}
              title="Exam preparation"
              text="Enter teacher-given portions and create a focused plan."
              tone="green"
            />
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-purple-100">
              <h3 className="text-sm font-black text-slate-950">Weak areas</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.weak.map((item) => (
                  <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                Below 95% means revision first. The app creates a backlog plan and retest path.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function ChildSummary({ child }: { child: (typeof children)[number] }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1">
      <span className="text-3xl">{child.avatar}</span>
      <div>
        <div className="text-sm font-black text-slate-950">{child.name}</div>
        <div className="text-xs font-semibold text-slate-500">{child.grade} · {child.focus}</div>
      </div>
    </div>
  );
}

function LearnTab({ childId, plan, subjects }: { childId: ChildId; plan: (typeof childPlans)[ChildId]; subjects: ReturnType<typeof getSubjectsForChild> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2 text-sm font-black text-purple-700">
          <BookOpen className="h-4 w-4" /> Today&apos;s learning target
        </div>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{plan.subject}: {plan.chapter}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{plan.action}. Start with a pre-check, learn visually, practice, then take the chapter exam.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/chapters?childId=${childId}`} className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white">Open chapter flow</Link>
          <Link href="/ai-teacher" className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">Ask AI Teacher</Link>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-black text-slate-950">Subjects</div>
        <div className="mt-3 space-y-2">
          {subjects.map((subject) => (
            <Link key={subject.slug} href={`/subjects/${subject.slug}?child=${childId}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
              {subject.name}
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeworkTab() {
  return <SimpleFlow icon={UploadCloud} title="Homework verification" text="Upload notebook pages, worksheets, or answer photos. OCR and review status will show correct, needs correction, incomplete, or unclear." href="/homework" action="Open homework" />;
}

function ExamsTab() {
  return <SimpleFlow icon={FileText} title="Exam preparation from school portions" text="Enter exam date, chapters, marks/weightage, or upload a portion photo. ConceptKid creates a daily plan toward 95% readiness." href="/exams" action="Create exam plan" />;
}

function ProgressTab({ plan }: { plan: (typeof childPlans)[ChildId] }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-black">
        <span>Current chapter mastery</span>
        <span>{plan.mastery}% / 95%</span>
      </div>
      <div className="mt-3 h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-purple-600" style={{ width: `${Math.min(plan.mastery, 100)}%` }} />
      </div>
      <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
        You are close. Strengthen the weak concepts, then retake the chapter exam. Next chapter unlocks after 95%.
      </p>
    </div>
  );
}

function MaterialsTab() {
  return <SimpleFlow icon={UploadCloud} title="Materials and textbooks" text="Upload authorized textbooks, chapter photos, worksheets, PPTs, and notes. AI uses indexed material first for textbook-grounded teaching." href="/uploads" action="Open materials" />;
}

function SimpleFlow({ icon: Icon, title, text, href, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; href: string; action: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <Icon className="h-6 w-6 text-purple-600" />
      <h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{text}</p>
      <Link href={href} className="mt-4 inline-flex rounded-2xl bg-purple-600 px-4 py-2 text-sm font-black text-white">{action}</Link>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, text, tone }: { href: string; icon: React.ComponentType<{ className?: string }>; title: string; text: string; tone: "purple" | "blue" | "green" }) {
  const tones = {
    purple: "bg-purple-50 text-purple-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <Link href={href} className={`block rounded-3xl p-5 shadow-sm ring-1 ring-white/70 ${tones[tone]}`}>
      <Icon className="h-6 w-6" />
      <h3 className="mt-3 text-sm font-black">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{text}</p>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const isRisk = label === "Risk";
  return (
    <div className={`min-w-[86px] rounded-2xl px-3 py-2 ${isRisk ? "bg-amber-50 text-amber-800" : "bg-purple-50 text-purple-700"}`}>
      <div className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}
