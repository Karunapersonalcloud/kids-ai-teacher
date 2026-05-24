"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, ClipboardCheck, Eye, GraduationCap, Lightbulb, MessageCircleQuestion, PenLine, RefreshCcw } from "lucide-react";

type PracticeQuestion = { question: string; answer: string };
type QuizQuestion = { question: string; options: string[]; answer: string };
type ExamPreview = { type: string; question: string };
type DemoTopic = {
  subject: string;
  topic: string;
  explanation: string;
  realLife: string[];
  visual: string;
  memoryTrick: string;
  commonMistake: string;
  practice: PracticeQuestion[];
  quiz: QuizQuestion[];
  exam: ExamPreview[];
  weakArea: string;
  recommendedAction: string;
};

const grades = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const tabs = ["Visual Lesson", "Practice", "Quick Quiz", "Chapter Exam Preview", "Weak Area Feedback", "Parent Report Preview"];

const topicByGrade: Record<string, DemoTopic> = {
  "Class 2": {
    subject: "EVS",
    topic: "Animals Around Us",
    explanation: "Animals live in different places. Some live on farms, some live in water, and some live in nests.",
    realLife: ["Cow - farm", "Fish - water", "Bird - nest"],
    visual: "Picture cards connect each animal to its home so the child can remember by seeing.",
    memoryTrick: "Animal + Home = Easy to remember",
    commonMistake: "Children may say all animals live in houses. We compare farm, water, nest, forest, and home.",
    practice: [
      { question: "Where does a fish live?", answer: "A fish lives in water." },
      { question: "Which animal gives us milk?", answer: "A cow gives us milk." },
      { question: "Where does a bird live?", answer: "A bird lives in a nest." },
    ],
    quiz: [
      { question: "Where does a fish live?", options: ["Water", "Nest", "Farm"], answer: "Water" },
      { question: "Which animal gives us milk?", options: ["Cow", "Fish", "Crow"], answer: "Cow" },
      { question: "Where does a bird live?", options: ["Nest", "Water", "Cupboard"], answer: "Nest" },
    ],
    exam: [
      { type: "MCQ", question: "Which animal lives in water? a) Cow b) Fish c) Dog" },
      { type: "Short answer", question: "Write two animal homes." },
      { type: "Competency-based", question: "Riya saw a nest on a tree. Which animal might live there and why?" },
    ],
    weakArea: "Animal homes",
    recommendedAction: "Watch visual explanation again, practice 5 more questions, then retake quiz.",
  },
  "Class 5": {
    subject: "Maths",
    topic: "Fractions",
    explanation: "A fraction shows part of a whole.",
    realLife: ["1 roti cut into 4 equal parts", "Eating 1 part means 1/4", "Two equal halves make one whole"],
    visual: "A roti or pizza circle is split into equal parts before writing the fraction.",
    memoryTrick: "Top number = parts taken, bottom number = total equal parts",
    commonMistake: "Students often compare fractions by denominator only. We show the actual size visually.",
    practice: [
      { question: "What is 1 part out of 4 equal parts called?", answer: "It is called one-fourth or 1/4." },
      { question: "Which is bigger: 1/2 or 1/4?", answer: "1/2 is bigger." },
      { question: "Write 2/4 in simplest form.", answer: "2/4 = 1/2." },
    ],
    quiz: [
      { question: "1 part out of 4 equal parts is", options: ["1/4", "4/1", "2/4"], answer: "1/4" },
      { question: "Which is bigger?", options: ["1/2", "1/4", "They are equal"], answer: "1/2" },
      { question: "2/4 in simplest form is", options: ["1/2", "2/2", "4/2"], answer: "1/2" },
    ],
    exam: [
      { type: "MCQ", question: "Which fraction is equal to 1/2? a) 2/4 b) 1/4 c) 3/4" },
      { type: "Short answer", question: "Draw a circle and shade 1/4." },
      { type: "Competency-based", question: "A cake is cut into 8 equal pieces. Anu eats 2 pieces. What fraction did she eat?" },
    ],
    weakArea: "Comparing fractions",
    recommendedAction: "Review roti visual, practice 5 comparison questions, then retake quiz.",
  },
  "Class 9": {
    subject: "Science",
    topic: "Motion",
    explanation: "Motion means change in position with time.",
    realLife: ["A bus moving from one stop to another", "A runner changing position on a track", "A car travelling 100 km in 2 hours"],
    visual: "A line path shows starting point, ending point, distance, and time taken.",
    memoryTrick: "Motion = Position changes as time passes",
    commonMistake: "Students mix distance and displacement. We first make position-change clear.",
    practice: [
      { question: "Define motion.", answer: "Motion is change in position of an object with time." },
      { question: "What is speed?", answer: "Speed is distance travelled per unit time." },
      { question: "A car travels 100 km in 2 hours. Find speed.", answer: "Speed = 100/2 = 50 km/h." },
    ],
    quiz: [
      { question: "Motion means", options: ["Change in position with time", "Only running", "No change"], answer: "Change in position with time" },
      { question: "Speed equals", options: ["Distance/time", "Time/distance", "Distance x time"], answer: "Distance/time" },
      { question: "100 km in 2 hours means speed is", options: ["50 km/h", "100 km/h", "200 km/h"], answer: "50 km/h" },
    ],
    exam: [
      { type: "MCQ", question: "An object is in motion if its position changes with respect to time. True or false?" },
      { type: "Short answer", question: "Define speed and write its formula." },
      { type: "Case-based/competency", question: "A bus starts from stop A at 8:00 AM and reaches stop B at 8:30 AM, 15 km away. Find its average speed and explain whether the bus was in motion." },
    ],
    weakArea: "Speed formula and units",
    recommendedAction: "Revise formula triangle, solve 5 speed questions, then attempt chapter exam again.",
  },
};

function getTopic(grade: string) {
  return topicByGrade[grade] || (Number(grade.replace(/\D/g, "")) <= 5 ? topicByGrade["Class 2"] : topicByGrade["Class 9"]);
}

export function GradeDemoClass() {
  const [grade, setGrade] = useState("Class 2");
  const [activeTab, setActiveTab] = useState("Visual Lesson");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const topic = useMemo(() => getTopic(grade), [grade]);

  function switchGrade(nextGrade: string) {
    setGrade(nextGrade);
    setActiveTab("Visual Lesson");
    setRevealed({});
    setAnswers({});
    setScore(null);
  }

  function checkQuiz() {
    setScore(topic.quiz.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0));
  }

  return (
    <section id="sample-demo-class" className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Sample product walkthrough</span>
          <h2 className="mt-4 text-3xl font-black text-slate-950">Experience a mini learning path</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Choose a grade to preview how ConceptKid teaches, practices, tests, finds weak areas, and reports progress.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-black text-slate-700">
          Choose Grade
          <select value={grade} onChange={(event) => switchGrade(event.target.value)} className="rounded-2xl border border-purple-100 bg-white px-4 py-3 shadow-sm">
            {grades.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${activeTab === tab ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-[#f7f5ff] p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-purple-700">{grade}</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">{topic.subject}</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{topic.topic}</span>
        </div>

        {activeTab === "Visual Lesson" && <VisualLesson topic={topic} />}
        {activeTab === "Practice" && (
          <PracticeSection
            questions={topic.practice}
            revealed={revealed}
            onToggle={(index) => setRevealed((current) => ({ ...current, [index]: !current[index] }))}
          />
        )}
        {activeTab === "Quick Quiz" && <QuizSection topic={topic} answers={answers} score={score} onAnswer={(index, value) => setAnswers((current) => ({ ...current, [index]: value }))} onCheck={checkQuiz} />}
        {activeTab === "Chapter Exam Preview" && <ExamSection exams={topic.exam} />}
        {activeTab === "Weak Area Feedback" && <WeakAreaSection topic={topic} />}
        {activeTab === "Parent Report Preview" && <ReportSection grade={grade} topic={topic} score={score} />}
      </div>
    </section>
  );
}

function VisualLesson({ topic }: { topic: DemoTopic }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-3xl bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-black text-purple-700">
          <BookOpen className="h-5 w-5" />
          Visual Lesson
        </div>
        <h3 className="mt-4 text-3xl font-black text-slate-950">{topic.topic}</h3>
        <p className="mt-3 text-base font-semibold leading-8 text-slate-700">{topic.explanation}</p>
        <div className="mt-5 rounded-2xl bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-blue-800">
            <Eye className="h-5 w-5" />
            Visual learning card
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-blue-950">{topic.visual}</p>
        </div>
      </div>
      <div className="grid gap-4">
        <InfoCard title="Real-life example" icon={<Lightbulb className="h-5 w-5" />}>
          <ul className="grid gap-2">
            {topic.realLife.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="Memory trick" icon={<CheckCircle2 className="h-5 w-5" />}>{topic.memoryTrick}</InfoCard>
        <InfoCard title="Common mistake" icon={<AlertTriangle className="h-5 w-5" />}>{topic.commonMistake}</InfoCard>
      </div>
    </div>
  );
}

function PracticeSection({ questions, revealed, onToggle }: { questions: PracticeQuestion[]; revealed: Record<number, boolean>; onToggle: (index: number) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-black text-purple-700">
        <PenLine className="h-5 w-5" />
        Practice cards
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {questions.map((item, index) => (
          <div key={item.question} className="rounded-3xl bg-white p-5">
            <div className="text-xs font-black text-slate-400">Question {index + 1}</div>
            <p className="mt-3 min-h-16 text-sm font-black leading-6 text-slate-800">{item.question}</p>
            <button onClick={() => onToggle(index)} className="mt-4 rounded-2xl bg-purple-50 px-4 py-2 text-xs font-black text-purple-700">
              {revealed[index] ? "Hide Answer" : "Show Answer"}
            </button>
            {revealed[index] && <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold leading-6 text-green-800">{item.answer}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizSection({ topic, answers, score, onAnswer, onCheck }: { topic: DemoTopic; answers: Record<number, string>; score: number | null; onAnswer: (index: number, value: string) => void; onCheck: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-black text-purple-700">
        <MessageCircleQuestion className="h-5 w-5" />
        Quick Quiz
      </div>
      <div className="mt-4 grid gap-4">
        {topic.quiz.map((question, index) => (
          <div key={question.question} className="rounded-3xl bg-white p-5">
            <p className="text-sm font-black text-slate-900">{index + 1}. {question.question}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {question.options.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  <input type="radio" name={`quiz-${index}`} checked={answers[index] === option} onChange={() => onAnswer(index, option)} />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={onCheck} className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white">Check Answer</button>
        {score !== null && <span className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-black text-green-800">Score: {score} / 3</span>}
        <span className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">Registered users get full chapter quizzes and progress tracking.</span>
      </div>
    </div>
  );
}

function ExamSection({ exams }: { exams: ExamPreview[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-black text-purple-700">
        <GraduationCap className="h-5 w-5" />
        CBSE-style chapter exam preview
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {exams.map((exam) => (
          <div key={exam.type} className="rounded-3xl bg-white p-5">
            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">{exam.type}</span>
            <p className="mt-4 text-sm font-bold leading-6 text-slate-800">{exam.question}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-black leading-6 text-amber-800">
        Full chapter exam unlocks after registration and textbook setup. Target mastery: 95% before moving to next chapter.
      </div>
    </div>
  );
}

function WeakAreaSection({ topic }: { topic: DemoTopic }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <InfoCard title="Weak area" icon={<AlertTriangle className="h-5 w-5" />}>{topic.weakArea}</InfoCard>
      <InfoCard title="Why it happens" icon={<RefreshCcw className="h-5 w-5" />}>Concept not clear yet and needs more practice.</InfoCard>
      <InfoCard title="Recommended action" icon={<ClipboardCheck className="h-5 w-5" />}>{topic.recommendedAction}</InfoCard>
    </div>
  );
}

function ReportSection({ grade, topic, score }: { grade: string; topic: DemoTopic; score: number | null }) {
  const currentScore = score ?? 2;
  const mastery = Math.round((currentScore / 3) * 100);
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-3xl bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-black text-purple-700">
          <BarChart3 className="h-5 w-5" />
          Parent Report Preview
        </div>
        <h3 className="mt-4 text-2xl font-black text-slate-950">Demo Student - {grade}</h3>
        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
          <span>Subject: {topic.subject}</span>
          <span>Topic: {topic.topic}</span>
          <span>Quiz: {currentScore}/3</span>
          <span>Weak Area: {topic.weakArea}</span>
          <span>Next Action: Practice 5 questions</span>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-5">
        <div className="mb-2 flex justify-between text-sm font-black text-slate-700">
          <span>Mastery</span>
          <span>{mastery}% / Target 95%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-purple-600" style={{ width: `${mastery}%` }} />
        </div>
        <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
          Actual parent reports are generated from your child&apos;s real learning activity.
        </p>
      </div>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-black text-purple-700">
        {icon}
        {title}
      </div>
      <div className="mt-3 text-sm font-bold leading-6 text-slate-700">{children}</div>
    </div>
  );
}
