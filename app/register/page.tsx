"use client";

import { useState } from "react";
import Link from "next/link";
import { gradeOptions, getSubjectsForGrade } from "@/lib/grade-catalog";

export default function RegisterPage() {
  const [grade, setGrade] = useState("Class 9");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/access/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setStatus(response.ok ? data.message || "Registration submitted. Access will be enabled after admin approval." : data.error || "Registration failed.");
  }

  return (
    <main className="min-h-screen bg-[#f7f5ff] p-5">
      <form onSubmit={submit} className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <Link href="/" className="text-sm font-black text-purple-700">← Back</Link>
          <h1 className="mt-3 text-3xl font-black text-purple-800">Register for Access</h1>
          <p className="mt-2 font-semibold text-slate-500">Access is enabled after admin approval. New users start in demo/pending mode.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input name="parentName" label="Parent name" />
          <Input name="email" label="Email" type="email" />
          <Input name="mobile" label="Mobile number" />
          <Input name="city" label="City" />
          <Input name="preferredLanguage" label="Preferred language" defaultValue="English" />
          <Input name="childName" label="Child name" />
          <label className="grid gap-2 text-sm font-black text-slate-700">
            Grade / class
            <select name="grade" value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-xl border border-purple-100 px-4 py-3 font-bold">
              {gradeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-700">
            Board
            <select name="board" className="rounded-xl border border-purple-100 px-4 py-3 font-bold">
              {["CBSE", "State", "ICSE", "Other"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <Input name="explanationLanguage" label="Preferred explanation language" defaultValue="English" />
          <Input name="weakSubjects" label="Weak subjects" defaultValue={getSubjectsForGrade(grade).slice(0, 3).join(", ")} />
          <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
            Learning goal
            <textarea name="learningGoal" required className="min-h-28 rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="Example: rebuild basics, prepare for exams, improve reading..." />
          </label>
        </div>

        {status && <div className="mt-5 rounded-2xl bg-green-50 p-4 font-bold text-green-700">{status}</div>}
        <button className="mt-5 rounded-2xl bg-purple-600 px-6 py-3 font-black text-white">Submit Registration</button>
      </form>
    </main>
  );
}

function Input({ name, label, type = "text", defaultValue = "" }: { name: string; label: string; type?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <input name={name} type={type} required defaultValue={defaultValue} className="rounded-xl border border-purple-100 px-4 py-3 font-bold" />
    </label>
  );
}
