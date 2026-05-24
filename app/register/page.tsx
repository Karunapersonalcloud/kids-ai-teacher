"use client";

import { useState } from "react";
import Link from "next/link";
import { getClassNumberFromGrade, getSubjectsForGrade, getSubjectsForStudent, gradeOptions } from "@/lib/grade-catalog";
import { buildSelectedLanguageMetadata, cbseLanguages, cbseLanguageNames, validateCbseLanguageSelection } from "@/lib/cbse-language-catalog";
import { getIndiaStateSuggestion, indiaStateOptions } from "@/lib/india-state-catalog";
import {
  createSubjectDraft,
  getSuggestedSubmittedSubjects,
  languageRoleOptions,
  mediumOptions,
  ncertBookTitleSuggestions,
  normalizeSubmittedSubjects,
  publisherOptions,
  subjectNameOptions,
  subjectStatusForPublisher,
  subjectTypeOptions,
  type SubmittedSubject,
} from "@/lib/student-subjects";

export default function RegisterPage() {
  const [grade, setGrade] = useState("Class 9");
  const [state, setState] = useState("Karnataka");
  const [board, setBoard] = useState("CBSE");
  const [r1Language, setR1Language] = useState("");
  const [r2Language, setR2Language] = useState("");
  const [r3Language, setR3Language] = useState("");
  const [subjects, setSubjects] = useState<SubmittedSubject[]>([createSubjectDraft({ subjectName: "English", subjectType: "Language", languageRole: "R1", language: "English" })]);
  const [status, setStatus] = useState("");
  const classNumber = getClassNumberFromGrade(grade);
  const suggestion = getIndiaStateSuggestion(state);
  const cbseValidation = validateCbseLanguageSelection({ board, grade, r1Language, r2Language, r3Language });
  const studentSubjects = getSubjectsForStudent(grade, { r1Language, r2Language, r3Language });
  const selectedLanguages = buildSelectedLanguageMetadata({ r1Language, r2Language, r3Language });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const selectedSubjects = normalizeSubmittedSubjects(subjects);
    form.set("selectedLanguages", JSON.stringify(selectedLanguages));
    form.set("cbseLanguageRuleWarning", cbseValidation.status === "Valid" ? "" : cbseValidation.message);
    form.set("submittedSubjects", JSON.stringify(selectedSubjects));
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/access/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setStatus(response.ok ? data.message || "Registration submitted. Access will be enabled after admin approval." : data.error || "Registration failed.");
  }

  function useSuggestedSubjects() {
    setSubjects(getSuggestedSubmittedSubjects({ grade, r1Language, r2Language, r3Language }));
  }

  function updateSubject(index: number, patch: Partial<SubmittedSubject>) {
    setSubjects((current) =>
      current.map((subject, subjectIndex) => {
        if (subjectIndex !== index) return subject;
        const publisher = patch.publisher || subject.publisher;
        return {
          ...subject,
          ...patch,
          autoDownloadAllowed: patch.autoDownloadAllowed ?? (patch.publisher ? publisher === "NCERT" : subject.autoDownloadAllowed),
          sourceStatus: patch.publisher ? subjectStatusForPublisher(publisher, patch.publisher === "NCERT") : subject.sourceStatus,
        };
      })
    );
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
          <label className="grid gap-2 text-sm font-black text-slate-700">
            State
            <input name="state" list="state-options" value={state} onChange={(event) => setState(event.target.value)} className="rounded-xl border border-purple-100 px-4 py-3 font-bold" />
            <datalist id="state-options">
              {indiaStateOptions.map((option) => <option key={option} value={option} />)}
            </datalist>
          </label>
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
            <select name="board" value={board} onChange={(event) => setBoard(event.target.value)} className="rounded-xl border border-purple-100 px-4 py-3 font-bold">
              {["CBSE", "State", "ICSE", "Other"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {suggestion && (
            <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700 md:col-span-2">
              {suggestion.suggestionText}
            </div>
          )}
          <div className="rounded-2xl bg-purple-50 p-4 text-sm font-bold leading-6 text-purple-700 md:col-span-2">
            CBSE requires three languages for Class IX, with at least two Indian languages. Please select the exact school-approved R1/R2/R3.
          </div>
          <div className={`rounded-2xl p-4 text-sm font-bold leading-6 md:col-span-2 ${cbseValidation.status === "Valid" ? "bg-green-50 text-green-700" : cbseValidation.status === "Invalid combination" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>
            CBSE language validation: {cbseValidation.status}. {cbseValidation.message}
          </div>

          {classNumber >= 9 && classNumber <= 10 && (
            <>
              <LanguageSelect name="r1Language" label="R1 - First Language" value={r1Language} onChange={setR1Language} required />
              <LanguageSelect name="r2Language" label="R2 - Second Language" value={r2Language} onChange={setR2Language} required />
              <LanguageSelect name="r3Language" label="R3 - Third Language" value={r3Language} onChange={setR3Language} required />
              <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
                Please select the languages exactly as per your school&apos;s academic policy.
              </div>
            </>
          )}

          {classNumber >= 6 && classNumber <= 8 && (
            <>
              <LanguageSelect name="r1Language" label="R1 - First Language" value={r1Language} onChange={setR1Language} required />
              <LanguageSelect name="r2Language" label="R2 - Second Language" value={r2Language} onChange={setR2Language} required />
              <LanguageSelect name="r3Language" label="R3 - Third Language (optional)" value={r3Language} onChange={setR3Language} />
            </>
          )}

          {classNumber >= 1 && classNumber <= 5 && (
            <>
              <LanguageSelect name="r1Language" label="School Language 1 (optional)" value={r1Language} onChange={setR1Language} />
              <LanguageSelect name="r2Language" label="School Language 2 (optional)" value={r2Language} onChange={setR2Language} />
              <input type="hidden" name="r3Language" value={r3Language} />
            </>
          )}

          <LanguageSelect name="explanationLanguage" label="Preferred explanation language" defaultValue="English" />
          <Input name="weakSubjects" label="Weak subjects" defaultValue={getSubjectsForGrade(grade).slice(0, 3).join(", ")} />
          <input type="hidden" name="regionalLanguage" value={suggestion?.suggestedLanguages[0] || ""} />
          <input type="hidden" name="selectedLanguages" value={JSON.stringify(selectedLanguages)} />
          <input type="hidden" name="cbseLanguageRuleWarning" value={cbseValidation.status === "Valid" ? "" : cbseValidation.message} />
          <input type="hidden" name="submittedSubjects" value={JSON.stringify(subjects)} />
          <label className="grid gap-2 text-sm font-black text-slate-700 md:col-span-2">
            Learning goal
            <textarea name="learningGoal" required className="min-h-28 rounded-xl border border-purple-100 px-4 py-3 font-bold" placeholder="Example: rebuild basics, prepare for exams, improve reading..." />
          </label>
        </div>

        <div className="mt-5 rounded-3xl bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-purple-800">Subjects Your Child Is Studying</h2>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                Use the suggested list as a starting point, then edit publisher/source and book title exactly as your school uses.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={useSuggestedSubjects} className="rounded-full bg-purple-600 px-4 py-2 text-xs font-black text-white">
                Use Suggested Subjects for Grade
              </button>
              <button type="button" onClick={() => setSubjects((current) => [...current, createSubjectDraft()])} className="rounded-full bg-white px-4 py-2 text-xs font-black text-purple-700 ring-1 ring-purple-100">
                Add Subject
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            Automatic download is attempted only for official NCERT materials. For school-provided or private publisher textbooks, please upload only materials you are authorized to use.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {studentSubjects.map((subject) => (
              <span key={subject} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                Suggested: {subject}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-4">
            {subjects.map((subject, index) => (
              <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">Subject {index + 1}</span>
                  <button type="button" onClick={() => setSubjects((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                    Remove Subject
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Subject name
                    <input list="subject-name-options" value={subject.subjectName} onChange={(event) => updateSubject(index, { subjectName: event.target.value })} required className="rounded-xl border border-purple-100 px-4 py-3 font-bold" />
                  </label>
                  <Select label="Subject type" value={subject.subjectType} options={subjectTypeOptions} onChange={(value) => updateSubject(index, { subjectType: value as SubmittedSubject["subjectType"] })} />
                  <Select label="Language role" value={subject.languageRole} options={languageRoleOptions} onChange={(value) => updateSubject(index, { languageRole: value as SubmittedSubject["languageRole"] })} />
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Language
                    <input list="language-options" value={subject.language} onChange={(event) => updateSubject(index, { language: event.target.value })} placeholder="Optional" className="rounded-xl border border-purple-100 px-4 py-3 font-bold" />
                  </label>
                  <Select label="Publisher / source" value={subject.publisher} options={publisherOptions} onChange={(value) => updateSubject(index, { publisher: value as SubmittedSubject["publisher"] })} />
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Book title
                    <input list={subject.publisher === "NCERT" ? "ncert-book-options" : undefined} value={subject.bookTitle} onChange={(event) => updateSubject(index, { bookTitle: event.target.value })} placeholder="Recommended" className="rounded-xl border border-purple-100 px-4 py-3 font-bold" />
                  </label>
                  <Select label="Medium" value={subject.medium} options={mediumOptions} onChange={(value) => updateSubject(index, { medium: value as SubmittedSubject["medium"] })} />
                  <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 xl:col-span-2">
                    <input
                      type="checkbox"
                      checked={subject.autoDownloadAllowed}
                      onChange={(event) => updateSubject(index, { autoDownloadAllowed: event.target.checked, sourceStatus: subjectStatusForPublisher(subject.publisher, event.target.checked) })}
                    />
                    Allow official NCERT auto-download when this source is NCERT
                  </label>
                </div>
              </div>
            ))}
          </div>
          <datalist id="subject-name-options">
            {subjectNameOptions.map((option) => <option key={option} value={option} />)}
          </datalist>
          <datalist id="language-options">
            {cbseLanguageNames.map((option) => <option key={option} value={option} />)}
          </datalist>
          <datalist id="ncert-book-options">
            {ncertBookTitleSuggestions.map((option) => <option key={option} value={option} />)}
          </datalist>
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

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-purple-100 px-4 py-3 font-bold">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function LanguageSelect({
  name,
  label,
  value,
  onChange,
  required = false,
  defaultValue = "",
}: {
  name: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <input
        name={name}
        list={`${name}-options`}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        placeholder="Search/select language"
        className="rounded-xl border border-purple-100 px-4 py-3 font-bold"
      />
      <datalist id={`${name}-options`}>
        {cbseLanguageNames.map((option) => {
          const language = cbseLanguages.find((item) => item.name === option);
          return (
            <option key={option} value={option}>
              {option}{language ? ` - ${language.type}` : ""}
            </option>
          );
        })}
      </datalist>
    </label>
  );
}
