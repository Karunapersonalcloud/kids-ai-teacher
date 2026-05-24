"use client";

import Link from "next/link";
import { BookOpen, Bot, Eye, LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { billingPlans } from "@/lib/billing-types";

const features = [
  { title: "Learn from basics", text: "Concepts are rebuilt gently instead of rushing into memorisation.", icon: BookOpen },
  { title: "Visual lessons", text: "Topics become step cards, examples, vocabulary, and mini quizzes.", icon: Sparkles },
  { title: "Doubt solving", text: "Children can ask questions in a warm, patient AI teacher style.", icon: Bot },
  { title: "Parent progress tracking", text: "Parents can review weak areas, study plans, and next actions.", icon: TrendingUp },
];

export function PublicLanding() {
  return (
    <main className="min-h-screen bg-[#f7f5ff] text-slate-900">
      <section className="mx-auto grid min-h-[88vh] max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-purple-700 shadow-sm">
            <LockKeyhole className="h-4 w-4" /> Controlled access MVP
          </div>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight text-purple-900 md:text-7xl">AI Concept Teacher for Every Child</h1>
          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            A warm, visual AI learning app for textbook-based teaching, doubt solving, quizzes, and parent-guided progress.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm">
              <Eye className="h-5 w-5" /> View Demo
            </Link>
            <Link href="/register" className="rounded-2xl bg-white px-5 py-3 font-black text-purple-700 shadow-sm">Register for Access</Link>
            <Link href="/login" className="rounded-2xl bg-amber-100 px-5 py-3 font-black text-amber-800 shadow-sm">Parent Login</Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">
            <div className="mb-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-black">Demo Mode</div>
            <h2 className="text-3xl font-black">Dashboard Preview</h2>
            <p className="mt-2 font-semibold text-white/85">Sample learning cards, visual lesson blocks, and AI teacher preview.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/15 p-4">
                <div className="text-3xl">🤖</div>
                <div className="mt-2 font-black">AI Teacher</div>
                <div className="text-sm text-white/80">3 demo questions</div>
              </div>
              <div className="rounded-2xl bg-white/15 p-4">
                <div className="text-3xl">🎨</div>
                <div className="mt-2 font-black">Visual Lessons</div>
                <div className="text-sm text-white/80">2 sample lessons</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-3xl bg-white p-5 shadow-sm">
                <Icon className="h-7 w-7 text-purple-600" />
                <h3 className="mt-4 font-black text-purple-900">{feature.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{feature.text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-purple-800">Pricing / Coming Soon</h2>
          <p className="mt-2 text-sm font-bold text-slate-500">Payments coming soon. Access currently granted by admin approval.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {billingPlans.map((plan) => (
              <div key={plan.planName} className="rounded-2xl bg-purple-50 p-4">
                <div className="font-black text-purple-900">{plan.label}</div>
                <div className="mt-2 text-2xl font-black">₹{plan.priceMonthly}</div>
                <div className="text-xs font-bold text-slate-500">{plan.aiLimitDaily} AI/day</div>
                <div className="mt-3 rounded-full bg-white px-3 py-1 text-center text-xs font-black text-purple-700">{plan.status}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-8 rounded-3xl bg-white p-5 text-center text-sm font-bold text-slate-600 shadow-sm">
          Need help? Contact us at <a href="mailto:support@conceptkid.in" className="text-purple-700 hover:underline">support@conceptkid.in</a>
        </footer>
      </section>
    </main>
  );
}
