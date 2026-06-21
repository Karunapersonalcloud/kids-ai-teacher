"use client";

import Link from "next/link";
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Sparkles,
  Target,
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

const trustBadges = ["Pilot access by approval", "Parent-supervised", "Textbook-based"];

const previewStats = [
  { label: "Readiness", value: "68%", text: "Current level" },
  { label: "Target", value: "95%", text: "Chapter goal" },
  { label: "Today", value: "Fractions", text: "Today's lesson" },
];

const helpFeatures = [
  ["Checks actual level", "Finds what your child already knows and what is missing.", Brain],
  ["Teaches visually", "Uses cinematic visuals, examples, and voice explanation.", Sparkles],
  ["Gives practice", "Asks small questions after each concept.", ClipboardCheck],
  ["Shows weak areas", "Parents can see what needs revision.", Target],
] as const;

const howItWorks = [
  "Select class, board, subject",
  "Take a quick diagnostic",
  "Learn with Visual Teacher Mode",
  "Practice until mastery",
];

const parentFeatures = [
  { title: "Actual level vs enrolled class", icon: "📊" },
  { title: "Weak topics at a glance", icon: "⚠️" },
  { title: "Today's learning plan", icon: "📋" },
  { title: "Progress toward mastery", icon: "✓" },
] as const;

export function PublicLanding() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <nav className="mx-auto flex min-h-[64px] w-full max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo className="items-center" />
          </Link>
          <div className="flex gap-3">
            <Link href="/demo" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Demo
            </Link>
            <Link href="/register" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Register
            </Link>
            <Link href="/login" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
              Parent Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Personal AI Teacher for Every Child
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              ConceptKid checks your child's actual level, teaches school chapters visually, gives practice, finds weak areas, and helps prepare for exams step by step.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700">
                <Eye className="h-5 w-5" /> Try Visual Demo
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                Register for Early Access
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span key={badge} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Hero Preview Card */}
          <div className="rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
              <p className="text-xs font-semibold text-slate-300">DEMO STUDENT</p>
              <h2 className="mt-2 text-2xl font-bold">Class 5</h2>
              <div className="mt-6 grid grid-cols-3 gap-4">
                {previewStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-white/10 p-3">
                    <p className="text-xs font-semibold text-slate-300">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{stat.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg bg-white p-4 text-slate-900">
                <p className="text-xs font-semibold text-purple-600">WEAK AREA</p>
                <p className="mt-2 font-semibold">Word problems need practice</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How ConceptKid Helps - 4 Cards */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16 lg:px-10">
        <h2 className="text-3xl font-bold text-slate-900">How ConceptKid helps</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {helpFeatures.map(([title, description, Icon]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-6">
              <Icon className="h-8 w-8 text-purple-600" />
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - 4 Steps */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16 lg:px-10">
        <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step, index) => (
            <div key={step} className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 font-bold text-white">
                {index + 1}
              </div>
              <p className="mt-4 font-semibold text-slate-900">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Teacher Preview */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Cinematic Visual Teacher Mode</h2>
            <p className="mt-4 text-lg text-slate-600">
              Concepts are explained with moving visuals, real-life examples, and teacher voice.
            </p>
            <div className="mt-8 space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Fractions</p>
                <p className="mt-1 text-sm text-slate-600">Pizza splits into equal parts</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Matter</p>
                <p className="mt-1 text-sm text-slate-600">Particles move and spread</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Number line</p>
                <p className="mt-1 text-sm text-slate-600">Values appear step by step</p>
              </div>
            </div>
            <Link href="/demo" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700">
              <Eye className="h-5 w-5" /> Try Visual Demo
            </Link>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 p-8 text-white">
            <div className="text-center">
              <p className="text-sm font-semibold opacity-90">Visual Lesson Preview</p>
              <p className="mt-4 text-4xl font-bold">✨</p>
              <p className="mt-6 text-lg font-semibold">Moving visuals & voice explanations</p>
              <p className="mt-2 text-sm opacity-90">See how concepts come alive for your child</p>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Progress Preview */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <p className="text-xs font-semibold text-purple-600">PARENT DASHBOARD</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">Progress at a glance</h3>
            <div className="mt-6 space-y-4">
              {parentFeatures.map(({ title, icon }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-semibold text-slate-600">{title}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Parents see what matters</h2>
            <p className="mt-4 text-lg text-slate-600">
              Parents do not need to guess. ConceptKid shows what the child studied, where they are weak, and what to practice next.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              No daily long reports. No unnecessary details. Just the essentials.
            </p>
          </div>
        </div>
      </section>

      {/* Early Access CTA */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16 lg:px-10">
        <div className="rounded-2xl bg-purple-600 px-6 py-12 text-white sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Join the pilot families list</h2>
            <p className="mt-4 text-lg text-purple-100">
              We are onboarding families carefully during pilot testing. Family profiles for up to 2 children included during pilot.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-purple-600 hover:bg-slate-100">
                Register for Early Access
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-purple-300 px-6 py-3 font-semibold text-white hover:bg-purple-700">
                Parent Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo />
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <a href="mailto:support@conceptkid.in" className="hover:text-slate-900">support@conceptkid.in</a>
              <Link href="/demo" className="hover:text-slate-900">Demo</Link>
              <Link href="/register" className="hover:text-slate-900">Register</Link>
              <Link href="/login" className="hover:text-slate-900">Login</Link>
            </div>
            <span className="text-xs font-semibold text-slate-500">Pilot access by approval</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
