"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

export default function DemoPage() {
  const [questions, setQuestions] = useState(0);
  const [answer, setAnswer] = useState("Ask a sample question to see how the AI teacher explains gently.");
  const remaining = Math.max(0, 3 - questions);

  function askDemo() {
    if (remaining <= 0) {
      setAnswer("Demo AI limit reached. Register to unlock full learning.");
      return;
    }
    setQuestions((current) => current + 1);
    setAnswer("Simple explanation: A fraction is a part of a whole. Example: if a roti is cut into 4 equal pieces and you eat 1 piece, you ate 1/4. Tiny check: what is 2 pieces out of 4 called?");
  }

  return (
    <main className="min-h-screen bg-[#f7f5ff] p-5 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Demo Mode</span>
            <h1 className="mt-3 text-3xl font-black text-purple-800">Kids AI Teacher Demo</h1>
            <p className="mt-1 font-semibold text-slate-500">Limited preview: 3 demo AI questions, 2 sample lessons, no uploads or saved progress.</p>
          </div>
          <Link href="/register" className="rounded-2xl bg-purple-600 px-5 py-3 font-black text-white">Register to unlock full learning</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-purple-700"><Bot className="h-5 w-5" /> Demo AI Teacher</h2>
            <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm font-semibold leading-7">{answer}</div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="font-bold text-slate-500">{remaining} / 3 demo questions left</div>
              <button onClick={askDemo} className="rounded-xl bg-purple-600 px-4 py-3 font-black text-white">Ask Demo Question</button>
            </div>
          </section>

          <section className="rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white shadow-sm">
            <Sparkles className="h-8 w-8" />
            <h2 className="mt-4 text-2xl font-black">Sample Visual Lesson</h2>
            <div className="mt-5 grid gap-3">
              {["Meaning", "Real-life example", "Memory trick"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/15 p-4 font-bold">{item}</div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
