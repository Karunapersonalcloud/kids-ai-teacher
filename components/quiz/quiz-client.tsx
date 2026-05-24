"use client";

import { useState } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { ChildSelect, SubjectSelect } from "@/components/shared/controls";
import { children, getSubjectsForChild, mockQuiz } from "@/lib/mock-data";
import type { ChildId, QuizResult } from "@/lib/types";

const difficulties = ["easy", "medium", "challenge"];
const quizTypes = ["basic concept", "competency-based", "visual reasoning", "reading comprehension", "oral practice prompt"];

export function QuizClient() {
  const [childId, setChildId] = useState<ChildId>("jayadeep");
  const [subject, setSubject] = useState(getSubjectsForChild("jayadeep")[0].name);
  const [difficulty, setDifficulty] = useState("easy");
  const [quizType, setQuizType] = useState(quizTypes[0]);
  const [quiz, setQuiz] = useState<QuizResult>(mockQuiz);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const child = children.find((item) => item.id === childId) || children[0];

  async function generateQuiz() {
    setLoading(true);
    const response = await fetch("/api/ai-teacher/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, subject, difficulty, quizType }),
    });
    const data = (await response.json()) as QuizResult;
    setQuiz(data);
    setSelected({});
    setShowAnswers({});
    setSubmitted(false);
    setSaveMessage("");
    setLoading(false);
  }

  const score = quiz.questions.reduce((total, question, index) => total + (selected[index] === question.answer ? 1 : 0), 0);
  const weakConcepts = quiz.questions
    .map((question, index) => (selected[index] && selected[index] !== question.answer ? question.question : ""))
    .filter(Boolean);

  async function submitQuiz() {
    setSubmitted(true);
    setShowAnswers(Object.fromEntries(quiz.questions.map((_, index) => [index, true])));
    const response = await fetch("/api/progress/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, subject, score, total: quiz.questions.length, weakConcepts }),
    });
    setSaveMessage(response.ok ? "Quiz result saved to progress." : "Could not save quiz result.");
  }

  return (
    <AppShell activeChildAvatar={child.avatar}>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-5">
          <ChildSelect
            value={childId}
            onChange={(nextChild) => {
              setChildId(nextChild);
              setSubject(getSubjectsForChild(nextChild)[0].name);
            }}
          />
          <SubjectSelect childId={childId} value={subject} onChange={setSubject} />
          <select className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            {difficulties.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={quizType} onChange={(event) => setQuizType(event.target.value)}>
            {quizTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button onClick={generateQuiz} className="rounded-xl bg-purple-600 px-5 py-3 font-black text-white shadow-sm hover:bg-purple-700">
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-black text-purple-700">{quiz.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-green-50 px-4 py-2 font-black text-green-700">Score: {score} / {quiz.questions.length}</div>
            <button onClick={submitQuiz} className="rounded-full bg-purple-600 px-4 py-2 font-black text-white">Submit Quiz</button>
          </div>
        </div>
        {saveMessage && <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{saveMessage}</div>}
        <div className="grid gap-4">
          {quiz.questions.map((question, index) => (
            <article key={question.question} className="rounded-2xl bg-slate-50 p-5">
              <h2 className="flex items-start gap-2 font-black">
                <HelpCircle className="mt-0.5 h-5 w-5 text-purple-600" /> {question.question}
              </h2>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {question.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelected((current) => ({ ...current, [index]: option }))}
                    className={`rounded-xl px-4 py-3 text-left font-bold transition ${
                      selected[index] === option ? "bg-purple-600 text-white" : "bg-white text-slate-700 hover:bg-purple-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setShowAnswers((current) => ({ ...current, [index]: true }))} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                  Show answer
                </button>
                {selected[index] && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {selected[index] === question.answer ? "Correct" : "Try again"}
                  </span>
                )}
              </div>
              {(showAnswers[index] || submitted) && (
                <div className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold leading-6">
                  <div className="font-black text-green-700">Answer: {question.answer}</div>
                  <div className="mt-1 text-slate-600">{question.explanation}</div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
