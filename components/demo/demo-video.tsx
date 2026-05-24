"use client";

import { useState } from "react";
import { BookOpenCheck, ChevronDown, ChevronUp, ClipboardList, GraduationCap, LineChart, Play, SearchCheck, Sparkles, UserRoundPlus } from "lucide-react";

const walkthroughSteps = [
  { title: "Parent registers child", detail: "Create a parent request and wait for approval.", icon: UserRoundPlus },
  { title: "Parent adds grade, subjects, publisher/book names", detail: "Enter the actual school books, including NCERT or private publisher titles.", icon: BookOpenCheck },
  { title: "App checks student level", detail: "A diagnostic check finds what the student already knows.", icon: SearchCheck },
  { title: "Student learns visually", detail: "Concepts are explained with examples, images, and simple steps.", icon: Sparkles },
  { title: "Student practices", detail: "Short practice questions confirm the idea is becoming clear.", icon: ClipboardList },
  { title: "Chapter exam checks 95% mastery", detail: "CBSE-style questions test understanding before moving ahead.", icon: GraduationCap },
  { title: "Parent tracks progress", detail: "Reports show mastery, weak areas, and the next action.", icon: LineChart },
];

export function DemoVideo({ hasVideo, hasPoster }: { hasVideo: boolean; hasPoster: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="overflow-hidden rounded-3xl bg-slate-950">
          {hasVideo ? (
            <div>
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-xl font-black text-white">Watch how ConceptKid works</h2>
              </div>
              <video
                className="aspect-video w-full bg-black"
                controls
                preload="metadata"
                poster={hasPoster ? "/images/conceptkid-demo-poster.png" : undefined}
              >
                <source src="/videos/conceptkid-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="relative grid min-h-80 place-items-center p-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.22),transparent_34%),radial-gradient(circle_at_75%_80%,rgba(216,180,254,0.18),transparent_30%)]" />
              <div className="relative max-w-sm text-center">
                <button
                  onClick={() => setExpanded((current) => !current)}
                  className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-purple-700 shadow-lg"
                  aria-label="Preview walkthrough"
                >
                  <Play className="ml-1 h-9 w-9 fill-purple-700" />
                </button>
                <h2 className="mt-5 text-3xl font-black">Watch how ConceptKid works</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-purple-100">Actual walkthrough video coming soon.</p>
                <button onClick={() => setExpanded((current) => !current)} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-700">
                  Preview walkthrough
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Parent walkthrough</span>
          <h3 className="mt-4 text-2xl font-black text-slate-950">A real product flow, not just a sample answer</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            This shows what parents and students experience after approval: setup, diagnosis, teaching, practice, chapter exams, and reporting.
          </p>
          <div className={`mt-5 grid gap-3 ${expanded || hasVideo ? "" : "max-h-72 overflow-hidden"}`}>
            {walkthroughSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-purple-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400">Step {index + 1}</div>
                    <div className="text-sm font-black leading-5 text-slate-800">{step.title}</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {!hasVideo && !expanded && (
            <button onClick={() => setExpanded(true)} className="mt-4 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-black text-purple-700">
              Show all 7 steps
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
