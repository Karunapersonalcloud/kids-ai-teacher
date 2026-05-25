"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  LockKeyhole,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

const trustBadges = ["Pilot access by approval", "Parent-supervised learning", "Textbook-based setup"];

const previewStats = [
  { label: "Diagnostic", value: "68%", text: "Current level checked" },
  { label: "Target", value: "95%", text: "Chapter mastery path" },
  { label: "Risk", value: "Medium", text: "Weak areas visible" },
];

const teacherFeatures = [
  ["Checks current level first", "Before starting a chapter, the child gets a clear readiness check.", Brain],
  ["Teaches visually", "Concepts use simple explanation, real-life examples, and memory aids.", Sparkles],
  ["Gives practice after learning", "Small questions follow each topic so understanding is checked early.", ClipboardCheck],
  ["Finds weak areas", "Mistakes are mapped to concepts, not just marked right or wrong.", Target],
  ["Re-teaches before next chapter", "Weak areas are strengthened before moving ahead.", Repeat2],
  ["Shows parent progress", "Parents see what improved, what is pending, and what to do next.", BarChart3],
] as const;

const learningFlow = [
  "Select child, class, board, and subject",
  "Choose chapter and concept",
  "Learn visually with narration",
  "Practice small questions",
  "Take chapter test",
  "Strengthen weak areas",
  "Move ahead after mastery",
];

const parentCards = [
  ["Know what your child studied today", "Daily learning actions are visible in one place.", Eye],
  ["See weak areas clearly", "The app names the concepts that need revision.", Target],
  ["Upload textbook or homework", "Parents can add authorized PDFs, scanned pages, or photos.", UploadCloud],
  ["Track exam preparation", "Exam portions can become a structured preparation plan.", GraduationCap],
  ["Support multiple children", "One parent account can manage more than one child.", Users],
] as const;

const earlyAccessPlans = [
  ["Demo Preview", ["Visual sample lessons", "Limited preview", "No saved progress"]],
  ["Pilot Access", ["Approved parent login", "Child diagnostic", "Visual learning", "Parent progress view"]],
  ["Full Learning Plan", ["Textbook-based learning", "Practice and chapter exams", "Weak-area strengthening", "Coming after pilot testing"]],
  ["Family Plan", ["Up to 2 child profiles", "Separate learning path for each child", "Parent dashboard for both children", "Individual progress, weak areas, and exam plans", "Additional child add-on coming later"]],
] as const;

export function PublicLanding() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="w-full border-b border-slate-200 bg-white">
        <nav className="mx-auto flex min-h-[72px] w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10 xl:flex-row xl:items-center xl:justify-between xl:px-16 2xl:px-20">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo className="items-center" />
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">View Demo</Link>
            <Link href="/login" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-purple-700 ring-1 ring-purple-100">Parent Login</Link>
            <Link href="/register" className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white">Register</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-[1600px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10 lg:py-20 xl:px-16 2xl:px-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-purple-700 shadow-sm ring-1 ring-purple-100">
            <ShieldCheck className="h-4 w-4" /> Access is currently by approval while we onboard pilot families.
          </div>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Personal AI Learning Coach for Every Child
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            ConceptKid checks your child&apos;s current level, teaches each chapter visually, strengthens weak areas, and prepares them for exams step by step.
          </p>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-slate-500">
            Our learning path targets 95% chapter mastery before moving ahead. It is built to improve confidence, clarity, and exam readiness without promising overnight results.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm">
              <Eye className="h-5 w-5" /> Try Visual Demo
            </Link>
            <Link href="/register" className="rounded-2xl bg-white px-5 py-3 font-black text-purple-700 shadow-sm ring-1 ring-purple-100">Register for Early Access</Link>
            <Link href="/login" className="rounded-2xl bg-amber-100 px-5 py-3 font-black text-amber-800 shadow-sm">Parent Login</Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span key={badge} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-200">
                {badge}
              </span>
            ))}
          </div>
        </div>

        <ProductPreview />
      </section>

      <LandingSection
        eyebrow="Teacher-first product"
        title="Built like a personal teacher, not just a chatbot"
        subtitle="ConceptKid is designed around a calm learning loop: understand the child first, teach visually, practice, test, revise, and show parents the next action."
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {teacherFeatures.map(([title, text, Icon]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-7 w-7 text-purple-600" />
              <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        eyebrow="Learning flow"
        title="How ConceptKid teaches"
        subtitle="Every chapter can move from readiness check to visual lesson, practice, chapter test, and weak-area strengthening."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {learningFlow.map((step, index) => (
            <article key={step} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-50 text-sm font-black text-purple-700">{index + 1}</div>
              <p className="mt-4 text-sm font-black leading-6 text-slate-800">{step}</p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="For parents" title="Less guessing. More clarity." subtitle="Parents get a practical view of daily learning, weak areas, material setup, and exam preparation.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {parentCards.map(([title, text, Icon]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-7 w-7 text-blue-600" />
              <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </LandingSection>

      <LandingSection eyebrow="Textbook-aware learning" title="Works with your child&apos;s actual school books" subtitle="The parent controls textbook setup because the parent knows the child&apos;s real school books.">
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <p className="mt-4 text-base font-semibold leading-8 text-slate-700">
              ConceptKid can use official NCERT and supported state-board textbook sources where available. For private publisher or school-provided books, parents can upload authorized PDFs, scanned pages, or chapter photos.
            </p>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              Private publisher or school-provided books are not downloaded from random websites. Demo mode does not expose private textbook content.
            </p>
          </article>
          <article className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <h3 className="text-xl font-black">Current pilot focus</h3>
            <ul className="mt-5 space-y-3 text-sm font-semibold text-slate-200">
              {["CBSE students", "Andhra Pradesh State Board support in progress", "Parent-uploaded school textbooks", "Class 1 to Class 10 learning path"].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-300" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </LandingSection>

      <LandingSection eyebrow="Content quality" title="Designed with a teacher-first approach">
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold leading-8 text-slate-700">
              Every lesson should explain the concept simply, connect it with real life, check understanding, and revise weak areas before exams. ConceptKid is built to support calm, structured, mastery-based learning.
            </p>
          </article>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {["Simple explanation first", "Real-life examples", "Visual memory aids", "Step-by-step practice", "Chapter-wise exam readiness", "Parent visibility"].map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </LandingSection>

      <LandingSection eyebrow="Pilot access" title="Early Access Plans" subtitle="Pricing will be announced after pilot testing and parent feedback. For now, access is reviewed and approved carefully.">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {earlyAccessPlans.map(([title, items]) => (
            <article key={title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-xl font-black text-slate-950">{title}</h3>
              <ul className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
          Each child profile has a separate learning path, textbook setup, diagnostic result, homework uploads, and progress tracking. Family access is intended for children from the same household.
        </div>
        <div className="mt-7 rounded-3xl bg-purple-600 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-black">Join the pilot families list</h3>
              <p className="mt-2 text-sm font-semibold text-purple-100">Start with a visual demo, then register for approval when you are ready.</p>
            </div>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-purple-700">
              Join Early Access
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </LandingSection>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-8 sm:px-6 lg:px-10 xl:flex-row xl:items-center xl:justify-between xl:px-16 2xl:px-20">
          <BrandLogo />
          <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-600">
            <a href="mailto:support@conceptkid.in" className="text-purple-700 hover:underline">support@conceptkid.in</a>
            <Link href="/demo" className="hover:text-purple-700">Demo</Link>
            <Link href="/register" className="hover:text-purple-700">Register</Link>
            <Link href="/login" className="hover:text-purple-700">Login</Link>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
            <LockKeyhole className="h-4 w-4" /> Pilot access by approval
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-purple-100/80 ring-1 ring-slate-200">
      <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-950 to-purple-950 p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-purple-200">Parent product preview</p>
            <h2 className="mt-1 text-2xl font-black">Demo Student · Class 5</h2>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">CBSE</span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {previewStats.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs font-bold text-purple-100">{item.label}</div>
              <div className="mt-1 text-3xl font-black">{item.value}</div>
              <div className="mt-1 text-xs font-semibold text-slate-300">{item.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-3xl bg-white p-5 text-slate-900">
            <div className="flex items-center gap-2 text-sm font-black text-purple-700">
              <FileText className="h-4 w-4" /> Today&apos;s lesson
            </div>
            <h3 className="mt-2 text-xl font-black">Fractions: equivalent fractions</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Visual explanation, roti/pizza example, 5 practice questions, then a quick check.</p>
          </div>
          <div className="rounded-3xl bg-amber-50 p-5 text-amber-900">
            <div className="text-sm font-black">Weak area</div>
            <p className="mt-2 text-sm font-bold leading-6">Word problems need revision before the chapter test.</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl bg-green-400/15 p-4 text-sm font-bold leading-6 text-green-100">
          Parent insight: practice 10 fraction word problems before the next chapter exam.
        </div>
      </div>
    </div>
  );
}

function LandingSection({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 lg:px-10 lg:py-12 xl:px-16 2xl:px-20">
      <div className="mb-7">
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-700">{eyebrow}</span>
        <h2 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
        {subtitle && <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
