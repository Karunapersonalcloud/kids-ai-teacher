import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Gauge,
  LineChart,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

const heroBadges = ["Pilot access by approval", "Parent-supervised", "Textbook-based learning"];

const trustPoints = [
  { title: "Diagnostic-based learning", icon: Gauge },
  { title: "Visual teacher mode", icon: Sparkles },
  { title: "Parent progress view", icon: LineChart },
  { title: "Practice until mastery", icon: CheckCircle2 },
] as const;

const helpFeatures = [
  {
    title: "Checks actual level",
    description: "Finds what your child already knows and what is missing.",
    icon: Gauge,
  },
  {
    title: "Teaches visually",
    description: "Explains concepts with moving visuals, examples, and teacher voice.",
    icon: Sparkles,
  },
  {
    title: "Gives practice",
    description: "Asks small questions after each concept to build understanding.",
    icon: ClipboardCheck,
  },
  {
    title: "Shows weak areas",
    description: "Parents can see what needs revision and what to practice next.",
    icon: Target,
  },
] as const;

const howItWorks = [
  "Select class, board, and subject",
  "Take a quick diagnostic",
  "Learn with Visual Teacher Mode",
  "Practice until mastery",
] as const;

const visualMoments = [
  { title: "Fractions", detail: "Equal parts appear step by step" },
  { title: "Science", detail: "Processes become moving examples" },
  { title: "Maths", detail: "Problem solving is shown visually" },
] as const;

const parentProgress = [
  { label: "Readiness", value: "68%", tone: "bg-amber-500" },
  { label: "Practice completed", value: "12/18", tone: "bg-emerald-500" },
  { label: "Weak topics", value: "3", tone: "bg-rose-500" },
] as const;

function HeaderBrand() {
  return (
    <span className="inline-flex items-center gap-3">
      <BrandLogo variant="icon" showText={false} />
      <span className="leading-tight">
        <span className="block text-lg font-black text-slate-950">ConceptKid</span>
        <span className="block text-xs font-bold text-slate-500">Personal AI Teacher</span>
      </span>
    </span>
  );
}

export function PublicLanding() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" aria-label="ConceptKid home" className="inline-flex items-center">
            <HeaderBrand />
          </Link>

          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <Link href="/demo" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Demo
            </Link>
            <Link href="/register" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Register
            </Link>
            <Link href="/login" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Parent Login
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800"
            >
              <Eye className="h-4 w-4" />
              Try Visual Demo
            </Link>
          </div>
        </nav>
      </header>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_62%,#ffffff_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Learning made Visual. Simple. Personal.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              ConceptKid checks your child&apos;s actual level, teaches school chapters with visual examples, gives practice, finds weak areas, and shows progress to parents.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
              >
                <Eye className="h-5 w-5" />
                Try Visual Demo
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Register for Early Access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {heroBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Demo Student &middot; Class 5</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Today&apos;s Learning Snapshot</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                <Brain className="h-6 w-6" />
              </div>
            </div>

            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-4 py-3">
                <dt className="font-bold text-slate-600">Readiness</dt>
                <dd className="text-2xl font-black text-amber-600">68%</dd>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-4 py-3">
                <dt className="font-bold text-slate-600">Target</dt>
                <dd className="text-2xl font-black text-emerald-600">95%</dd>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-4 py-3">
                <dt className="font-bold text-slate-600">Today&apos;s Lesson</dt>
                <dd className="font-black text-slate-950">Fractions</dd>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-4 py-3">
                <dt className="font-bold text-slate-600">Weak Area</dt>
                <dd className="font-black text-slate-950">Word Problems</dd>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-4 py-3">
                <dt className="font-bold text-slate-600">Study Plan</dt>
                <dd className="font-black text-slate-950">8 topics today</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustPoints.map(({ title, icon: Icon }) => (
            <div key={title} className="flex items-center gap-3 rounded-[8px] border border-slate-100 bg-white px-4 py-3 shadow-sm shadow-slate-950/5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-black text-slate-800">{title}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">How ConceptKid helps</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">One clear learning path for every child.</h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {helpFeatures.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-cyan-50 text-cyan-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Four simple steps from setup to practice.</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-black text-slate-800 hover:text-slate-950">
              Register for Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative mt-10 grid gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block" />
            {howItWorks.map((step, index) => (
              <div key={step} className="relative rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 lg:pt-16">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white shadow-sm shadow-indigo-200 lg:absolute lg:left-5 lg:top-3">
                  {index + 1}
                </span>
                <p className="mt-5 text-base font-black leading-6 text-slate-950 lg:mt-0">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">Cinematic Visual Teacher preview</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">School chapters become visual lessons.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Children see the idea, hear the explanation, answer a quick check, and move ahead with confidence.
          </p>
          <Link
            href="/demo"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <PlayCircle className="h-5 w-5" />
            Try Visual Demo
          </Link>
        </div>

        <div className="rounded-[8px] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/15">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Visual Teacher Mode</p>
              <h3 className="mt-2 text-xl font-black">Fractions: Equal parts</h3>
            </div>
            <Eye className="h-6 w-6 text-cyan-200" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {visualMoments.map(({ title, detail }) => (
              <div key={title} className="rounded-[8px] bg-white/10 p-4">
                <p className="text-sm font-black">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[8px] bg-white p-4 text-slate-950">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Teacher prompt</p>
            <p className="mt-2 text-sm font-bold leading-6">If one pizza is split into 4 equal parts, each part is one fourth.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
          <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Parent progress preview</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Progress at a glance</h3>
              </div>
              <LineChart className="h-8 w-8 text-emerald-700" />
            </div>

            <div className="mt-7 space-y-5">
              {parentProgress.map(({ label, value, tone }) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-600">{label}</span>
                    <span className="text-slate-950">{value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className={`h-2.5 rounded-full ${tone}`} style={{ width: label === "Weak topics" ? "32%" : label === "Practice completed" ? "66%" : "68%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">Parent progress preview</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Parents see what matters.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              See the actual level, weak topics, today&apos;s study plan, and progress without reading long daily reports.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[8px] bg-slate-950 px-6 py-12 text-center text-white sm:px-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-200">Final CTA</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Start with a simple visual demo.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            Preview how ConceptKid teaches before requesting pilot access for your family.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              <Eye className="h-5 w-5" />
              Try Visual Demo
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Register for Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <HeaderBrand />
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
            <a href="mailto:support@conceptkid.in" className="hover:text-slate-950">
              support@conceptkid.in
            </a>
            <Link href="/demo" className="hover:text-slate-950">
              Demo
            </Link>
            <Link href="/register" className="hover:text-slate-950">
              Register
            </Link>
            <Link href="/login" className="hover:text-slate-950">
              Parent Login
            </Link>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Pilot access by approval</span>
        </div>
      </footer>
    </main>
  );
}
