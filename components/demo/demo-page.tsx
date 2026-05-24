import Link from "next/link";
import { ArrowRight, BookMarked, Brain, CheckCircle2, ClipboardList, FileUp, GraduationCap, LockKeyhole, Repeat2, ShieldCheck, Sparkles } from "lucide-react";
import { GradeDemoClass } from "./grade-demo-class";
import { ParentPreview } from "./parent-preview";
import { DemoRequestPreview } from "./demo-request-preview";

const learningSteps = [
  ["Check Current Level", "Before learning, we check what the student already knows.", Brain],
  ["Teach Visually", "Every topic is explained with real-life examples, visuals, and simple steps.", Sparkles],
  ["Practice", "Student answers small practice questions after learning.", ClipboardList],
  ["Chapter Exam", "CBSE-style test checks real understanding.", GraduationCap],
  ["Strengthen Weak Areas", "If score is below target, the app finds weak areas and teaches again.", Repeat2],
] as const;

const textbookExamples = [
  ["NCERT Official", "Official import can be attempted", "bg-green-50 text-green-700"],
  ["State Board Official", "Official source link required", "bg-blue-50 text-blue-700"],
  ["Private Publisher", "Parent upload required", "bg-amber-50 text-amber-800"],
  ["School Worksheet", "Parent upload required", "bg-purple-50 text-purple-700"],
] as const;

export function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ff] text-slate-950">
      <section className="mx-auto max-w-7xl px-5 py-6 md:py-10">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-sm font-black text-purple-700">ConceptKid</Link>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">Parent Login</Link>
            <Link href="/register" className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white">Register for Access</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-purple-100 md:p-10">
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Demo Mode</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-slate-950 md:text-6xl">Try a Visual Demo Class</h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
              Select your child&apos;s class, subject, chapter, and topic. ConceptKid will show a limited visual learning preview with audio narration.
            </p>
            <p className="mt-4 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-bold leading-6 text-purple-800">
              Want help choosing class, subject, or textbook setup? Contact support@conceptkid.in.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#visual-demo" className="rounded-2xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm">Generate Visual Demo</a>
              <Link href="/register" className="rounded-2xl bg-blue-50 px-5 py-3 font-black text-blue-700">Register for Access</Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-purple-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-black text-purple-200">Parent-safe preview</div>
                <div className="text-2xl font-black">No upload, no saved progress in demo</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              {["Child-specific after registration", "Textbook-grounded after upload", "95% mastery target"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-sm font-black">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-10">
        <div id="visual-demo">
          <DemoRequestPreview />
        </div>
        <GradeDemoClass />

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">How learning works</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950">A calm path from basics to mastery</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {learningSteps.map(([title, text, Icon], index) => (
              <div key={title} className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-purple-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-black leading-6 text-green-800">
            Our target is 95% mastery, but learning remains stress-free and step-by-step.
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Textbook and publisher demo</span>
              <h2 className="mt-4 text-3xl font-black text-slate-950">Works with your child&apos;s actual school books</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                We will try to import textbooks only from official or authorized sources such as NCERT, State Board portals, or publisher-provided official links. If the textbook is not available for official import, the parent must upload the textbook PDF, scanned pages, or chapter photos after approval. Private publisher or school-provided books are not downloaded from random websites.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {textbookExamples.map(([book, status, color]) => (
                <div key={book} className="rounded-3xl bg-slate-50 p-5">
                  <BookMarked className="h-6 w-6 text-purple-700" />
                  <h3 className="mt-4 text-lg font-black text-slate-950">{book}</h3>
                  <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            <LockKeyhole className="h-5 w-5 shrink-0" />
            Upload only textbooks/materials you are authorized to use for personal learning.
          </div>
        </section>

        <ParentPreview />

        <section className="rounded-3xl bg-gradient-to-br from-purple-700 to-blue-700 p-7 text-white shadow-sm">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black">Start with your child&apos;s grade and textbooks</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-purple-100">
                Register, select the real subjects and books, then use ConceptKid to teach, practice, test, and track progress.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-purple-700">
              Register for Access
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-purple-100">
            <FileUp className="h-5 w-5" />
            Private publisher books can be uploaded after approval.
          </div>
        </section>
      </div>
    </main>
  );
}
