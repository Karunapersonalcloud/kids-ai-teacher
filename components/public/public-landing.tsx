import Link from "next/link";
import {
  ArrowRight,
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
    description: "Uses soft visuals, examples, and voice explanation.",
    icon: Sparkles,
  },
  {
    title: "Gives practice",
    description: "Asks small questions after each concept.",
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
  { title: "Fractions", detail: "Pizza splits into equal parts" },
  { title: "Matter", detail: "Particles move and spread" },
  { title: "Number line", detail: "Values appear step by step" },
] as const;

const parentDashboardRows = [
  { label: "Actual level vs enrolled class", value: "Class 5 / Level 4", icon: Gauge },
  { label: "Weak topics", value: "Word problems", icon: Target },
  { label: "Today's plan", value: "8 topics", icon: ClipboardCheck },
  { label: "Readiness target", value: "Chapter-ready", icon: CheckCircle2 },
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28%),#f9f7ff] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 sm:gap-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href="/" aria-label="ConceptKid home" className="inline-flex items-center">
            <HeaderBrand />
          </Link>

          <div className="hidden items-center gap-2 text-sm font-semibold sm:flex">
            <Link href="/" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Home
            </Link>
            <Link href="/demo" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Demo
            </Link>
            <Link href="/register" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Register
            </Link>
            <Link href="/login" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Parent Login
            </Link>
            <Link href="/login" className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              Student Login
            </Link>
          </div>

          <div className="flex items-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 sm:px-4 sm:py-2"
            >
              <Eye className="h-4 w-4" />
              Try Visual Demo
            </Link>
          </div>
        </nav>
      </header>

      <section className="bg-[linear-gradient(180deg,#fdfcff_0%,#f4f0ff_55%,#ffffff_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:gap-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-violet-700">Premium learning for every child</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Learning made <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">Visual.</span> <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">Simple.</span> <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">Personal.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
              ConceptKid checks your child’s actual level, teaches school chapters with visual examples, gives practice, finds weak areas, and shows progress to parents.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-950/10 transition hover:bg-slate-800 sm:w-auto sm:py-4"
              >
                <Eye className="h-5 w-5" />
                Try Visual Demo
              </Link>
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto sm:py-4"
              >
                Register for Early Access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {heroBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm shadow-slate-950/5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_40px_120px_-40px_rgba(99,102,241,0.35)] sm:p-8">
            <div className="absolute -right-16 top-12 h-40 w-40 rounded-full bg-violet-100 blur-3xl" />
            <div className="absolute -left-12 bottom-8 h-32 w-32 rounded-full bg-sky-100 blur-3xl" />
            <div className="relative rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-6 shadow-xl shadow-slate-950/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Demo Student · Class 5</p>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">Today’s learning snapshot</h2>
                </div>
                <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                  CBSE
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-[24px] bg-slate-950/5 p-4">
                <div className="flex items-center justify-between gap-4 rounded-[20px] bg-white p-4 shadow-sm shadow-slate-950/5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Readiness</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">68%</p>
                  </div>
                  <div className="min-w-[110px]">
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-sky-500" />
                    </div>
                    <p className="mt-2 text-right text-xs font-semibold text-slate-500">Towards 95% mastery</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] bg-white p-4 shadow-sm shadow-slate-950/5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Target</p>
                    <p className="mt-3 text-xl font-black text-emerald-700">95%</p>
                  </div>
                  <div className="rounded-[20px] bg-white p-4 shadow-sm shadow-slate-950/5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Study plan</p>
                    <p className="mt-3 text-xl font-black text-slate-950">8 topics today</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-white p-4 shadow-sm shadow-slate-950/5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Today’s lesson</p>
                  <p className="mt-2 text-base font-black text-slate-950">Fractions</p>
                </div>
                <div className="rounded-[20px] bg-white p-4 shadow-sm shadow-slate-950/5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Weak area</p>
                  <p className="mt-2 text-base font-black text-slate-950">Word problems</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-slate-100 p-4 shadow-sm shadow-slate-950/5 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-4">
            {trustPoints.map(({ title, icon: Icon }) => (
              <div key={title} className="flex items-center gap-3 rounded-3xl bg-white/90 px-4 py-3 shadow-sm shadow-slate-950/5">
                <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-700">How ConceptKid helps</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">One clear learning path for every child.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {helpFeatures.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_-30px_rgba(99,102,241,0.4)] transition hover:-translate-y-1 hover:shadow-[0_25px_65px_-35px_rgba(99,102,241,0.35)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-violet-50 text-violet-700">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-black text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f2ff_100%)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Four simple steps from setup to practice.</h2>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-black text-slate-900 hover:text-slate-950">
              Register for Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative mt-10 grid gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent lg:block" />
            {howItWorks.map((step, index) => (
              <div key={step} className="relative rounded-[28px] bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.12)] lg:pt-16">
                <span className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-xl shadow-slate-950/20">
                  {index + 1}
                </span>
                <p className="mt-8 text-base font-black leading-7 text-slate-950">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">Visual learning preview</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Cinematic Visual Teacher Mode</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Concepts are explained through real-life examples, moving visuals, and teacher-style voice narration.
          </p>
          <Link
            href="/demo"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
          >
            <PlayCircle className="h-5 w-5" />
            Try Visual Demo
          </Link>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-[0_40px_100px_-40px_rgba(99,102,241,0.35)] sm:p-8">
          <div className="rounded-[28px] bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-inner shadow-slate-950/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Teacher board</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">Fractions come alive</h3>
              </div>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-950/20">
                <PlayCircle className="h-7 w-7" />
              </span>
            </div>

            <div className="mt-6 space-y-4 rounded-[28px] bg-white p-5 shadow-sm shadow-slate-950/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Visualization</p>
                  <p className="mt-2 text-base font-bold text-slate-950">Pizza splits into equal parts</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                  Live example
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {visualMoments.map(({ title, detail }) => (
                <div key={title} className="rounded-[24px] bg-white p-4 shadow-sm shadow-slate-950/5">
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f7f2ff_0%,#ffffff_100%)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Parent progress preview</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Know exactly where your child needs help</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Parents do not need to guess. ConceptKid shows what the child studied, where they are weak, and what to practice next.
            </p>
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-[0_40px_120px_-40px_rgba(99,102,241,0.25)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Parent dashboard</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Progress at a glance</h3>
              </div>
              <LineChart className="h-8 w-8 text-emerald-700" />
            </div>

            <div className="mt-6 grid gap-4">
              {parentDashboardRows.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-[24px] bg-slate-50 px-5 py-4 shadow-sm shadow-slate-950/5">
                  <span className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <Icon className="h-5 w-5 text-indigo-700" />
                    {label}
                  </span>
                  <span className="text-sm font-black text-slate-950">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[32px] bg-gradient-to-r from-violet-700 via-purple-700 to-sky-500 px-6 py-10 text-center text-white shadow-[0_40px_120px_-40px_rgba(99,102,241,0.4)] sm:px-8 sm:py-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Join ConceptKid Early Access</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-100">
            Reserve early access for your family and get prioritized support, clear progress insights, and confidence in every learning step.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
            >
              Register for Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 sm:w-auto"
            >
              Parent Login
            </Link>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">Limited early access spots help us keep onboarding smooth and supportive.</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-7 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <span className="text-base font-black text-slate-950">ConceptKid</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-slate-600">
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
