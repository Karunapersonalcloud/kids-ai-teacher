"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MessageCircleQuestion, PenLine, Shapes } from "lucide-react";

const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

const demos: Record<string, { subject: string; topic: string; style: string[]; content: string; prompts: string[]; quiz: string }> = {
  "Class 2": {
    subject: "EVS",
    topic: "Animals Around Us",
    style: ["Picture-based explanation", "Real-life example", "Simple question", "Tiny quiz"],
    content: "Animals live in different places. A cow lives on a farm, a fish lives in water, and a bird lives in a nest.",
    prompts: ["Explain animals around us", "Give me 3 EVS questions", "Teach with a story"],
    quiz: "Where does a fish live?",
  },
  "Class 5": {
    subject: "Maths",
    topic: "Fractions",
    style: ["Pizza/roti visual example", "Practice question", "Step-by-step explanation"],
    content: "A fraction shows part of a whole. If one roti is cut into four equal parts and you eat one part, you ate one-fourth.",
    prompts: ["Explain fractions with roti", "Give me practice questions", "Make it visual"],
    quiz: "What fraction is 2 pieces out of 4 equal pieces?",
  },
  "Class 9": {
    subject: "Science",
    topic: "Motion",
    style: ["Real-life vehicle example", "Concept explanation", "CBSE-style question"],
    content: "Motion means change in position with time. Example: when a bus moves from one stop to another, its position changes.",
    prompts: ["Explain motion with real-life example", "Give CBSE-style question", "Explain in simple English"],
    quiz: "Define motion and give one example from daily life.",
  },
};

function getDemo(grade: string) {
  return (
    demos[grade] || {
      subject: Number(grade.replace(/\D/g, "")) <= 5 ? "Maths" : "Science",
      topic: Number(grade.replace(/\D/g, "")) <= 5 ? "Number Sense" : "Simple Machines",
      style: ["Visual explanation", "Real-life example", "Practice question"],
      content: "ConceptKid first explains the idea simply, then checks whether the student can use it in a small question.",
      prompts: ["Explain this topic", "Give me 3 questions", "Teach with examples"],
      quiz: "Can you explain the idea in your own words?",
    }
  );
}

export function GradeDemoClass() {
  const [grade, setGrade] = useState("Class 2");
  const [selectedPrompt, setSelectedPrompt] = useState("Explain animals around us");
  const demo = useMemo(() => getDemo(grade), [grade]);

  return (
    <section id="sample-demo-class" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Sample demo class</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950">Choose a grade and preview a lesson</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Demo responses are sample only. Registered users get child-specific learning based on grade, subjects, diagnostic results, and uploaded textbooks.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Choose Grade
          <select value={grade} onChange={(event) => { setGrade(event.target.value); setSelectedPrompt(getDemo(event.target.value).prompts[0]); }} className="rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-sm">
            {grades.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl bg-[#f7f5ff] p-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">{demo.subject}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">{demo.topic}</span>
          </div>
          <h3 className="mt-5 text-2xl font-black text-slate-950">{demo.topic}</h3>
          <p className="mt-3 text-base font-semibold leading-8 text-slate-700">{demo.content}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {demo.style.map((style) => (
              <div key={style} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-black text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {style}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-2 text-sm font-black text-purple-200">
              <MessageCircleQuestion className="h-5 w-5" />
              Demo AI Teacher
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {demo.prompts.map((prompt) => (
                <button key={prompt} onClick={() => setSelectedPrompt(prompt)} className={`rounded-full px-3 py-2 text-xs font-black ${selectedPrompt === prompt ? "bg-white text-purple-700" : "bg-white/10 text-white"}`}>
                  {prompt}
                </button>
              ))}
            </div>
            <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6">
              Sample answer for “{selectedPrompt}”: I will explain slowly, use examples, then ask one small check question.
            </p>
          </div>

          <div className="rounded-3xl bg-blue-50 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-blue-800">
              <PenLine className="h-5 w-5" />
              Tiny quiz
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-blue-950">{demo.quiz}</p>
          </div>

          <div className="rounded-3xl bg-purple-50 p-5">
            <div className="flex items-center gap-2 text-sm font-black text-purple-800">
              <Shapes className="h-5 w-5" />
              Visual learning style
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-purple-950">Real-life examples, clear steps, practice, and calm feedback.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
