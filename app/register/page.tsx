"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { getClassNumberFromGrade, getSubjectsForGrade, gradeOptions } from "@/lib/grade-catalog";
import { cbseLanguageNames, validateCbseLanguageSelection } from "@/lib/cbse-language-catalog";
import { getIndiaStateSuggestion, indiaStateOptions } from "@/lib/india-state-catalog";
import {
  createSubjectDraft,
  getSuggestedSubmittedSubjects,
  languageRoleOptions,
  mediumOptions,
  ncertBookTitleSuggestions,
  publisherOptions,
  subjectNameOptions,
  subjectStatusForPublisher,
  subjectTypeOptions,
  type SubmittedSubject,
} from "@/lib/student-subjects";
import { createChildDraft, type ChildRegistrationDraft } from "@/lib/multi-child";

type SubmitStatus = { tone: "ok" | "err"; message: string } | null;

export default function RegisterPage() {
  const [state, setState] = useState("Karnataka");
  const [children, setChildren] = useState<ChildRegistrationDraft[]>([
    createChildDraft({
      grade: "Class 9",
      board: "CBSE",
      submittedSubjects: [
        createSubjectDraft({ subjectName: "English", subjectType: "Language", languageRole: "R1", language: "English" }),
      ],
    }),
  ]);
  const [status, setStatus] = useState<SubmitStatus>(null);
  const [submitting, setSubmitting] = useState(false);

  const suggestion = useMemo(() => getIndiaStateSuggestion(state), [state]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const payload: Record<string, unknown> = {
        parentName: form.get("parentName"),
        email: form.get("email"),
        mobile: form.get("mobile"),
        state: form.get("state"),
        city: form.get("city"),
        preferredLanguage: form.get("preferredLanguage"),
        regionalLanguage: suggestion?.suggestedLanguages[0] || "",
        submittedChildren: children,
      };
      const response = await fetch("/api/access/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (response.ok) {
        setStatus({ tone: "ok", message: data.message || "Registration submitted." });
      } else {
        setStatus({ tone: "err", message: data.error || "Registration failed." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function updateChild(index: number, patch: Partial<ChildRegistrationDraft>) {
    setChildren((current) => current.map((child, idx) => (idx === index ? { ...child, ...patch } : child)));
  }

  function addChild() {
    setChildren((current) => [
      ...current,
      createChildDraft({
        grade: "Class 5",
        board: "CBSE",
        submittedSubjects: [createSubjectDraft({ subjectName: "Mathematics", subjectType: "Core Subject", publisher: "NCERT" })],
      }),
    ]);
  }

  function removeChild(index: number) {
    setChildren((current) => (current.length <= 1 ? current : current.filter((_, idx) => idx !== index)));
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" aria-label="Back to ConceptKid home">
              <BrandLogo />
            </Link>
            <Link href="/" className="text-sm font-semibold text-purple-700 hover:underline">Back to home</Link>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Register for ConceptKid</h1>
          <p className="mt-2 text-slate-600">
            Add your details and one or more children. Access is enabled after admin approval. You can register multiple children in one go — each can have their own grade, board, subjects, and books.
          </p>
          <p className="mt-3 rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold leading-6 text-purple-800">
            After registration, your access will be reviewed by the ConceptKid team. Once approved, login instructions will be shared. For help, contact support@conceptkid.in.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Parent details</h2>
          <p className="mt-1 text-sm text-slate-500">These details apply to all children registered below.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input name="parentName" label="Parent name" />
            <Input name="email" label="Email" type="email" />
            <Input name="mobile" label="Mobile number" />
            <Input name="city" label="City" />
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              State
              <input
                name="state"
                list="state-options"
                value={state}
                onChange={(event) => setState(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
              <datalist id="state-options">
                {indiaStateOptions.map((option) => <option key={option} value={option} />)}
              </datalist>
            </label>
            <Input name="preferredLanguage" label="Preferred communication language" defaultValue="English" />
          </div>
          {suggestion && (
            <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">{suggestion.suggestionText}</div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Children</h2>
              <p className="mt-1 text-sm text-slate-500">Add one block per child. You can edit grade, board, subjects, and books per child.</p>
            </div>
            <button
              type="button"
              onClick={addChild}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4" /> Add Another Child
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {children.map((child, index) => (
              <ChildBlock
                key={index}
                index={index}
                child={child}
                onChange={(patch) => updateChild(index, patch)}
                onRemove={() => removeChild(index)}
                canRemove={children.length > 1}
              />
            ))}
          </div>
        </section>

        {status && (
          <div
            className={`rounded-2xl p-4 text-sm font-semibold ${
              status.tone === "ok" ? "bg-green-50 text-green-700 ring-1 ring-green-100" : "bg-red-50 text-red-700 ring-1 ring-red-100"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="max-w-xl text-sm text-slate-600">
            We try to import textbooks only from official or authorized sources (NCERT, State Board portals, or publisher-provided official links). If a textbook is not available officially, please upload the textbook PDF, scanned pages, or chapter photos after approval.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Registration"}
          </button>
        </div>
      </form>
    </main>
  );
}

function ChildBlock({
  index,
  child,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  child: ChildRegistrationDraft;
  onChange: (patch: Partial<ChildRegistrationDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const classNumber = getClassNumberFromGrade(child.grade) || 0;
  const cbseValidation = validateCbseLanguageSelection({
    board: child.board,
    grade: child.grade,
    r1Language: child.r1Language,
    r2Language: child.r2Language,
    r3Language: child.r3Language,
  });

  function setSubjects(updater: (current: SubmittedSubject[]) => SubmittedSubject[]) {
    onChange({ submittedSubjects: updater(child.submittedSubjects) });
  }

  function useSuggestedSubjects() {
    onChange({
      submittedSubjects: getSuggestedSubmittedSubjects({
        grade: child.grade,
        r1Language: child.r1Language,
        r2Language: child.r2Language,
        r3Language: child.r3Language,
      }),
    });
  }

  function updateSubject(subjectIndex: number, patch: Partial<SubmittedSubject>) {
    setSubjects((current) =>
      current.map((subject, idx) => {
        if (idx !== subjectIndex) return subject;
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
    <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">Child {index + 1}</span>
          {child.childName && <span className="text-sm font-semibold text-slate-700">{child.childName}</span>}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Child name">
          <input
            value={child.childName}
            onChange={(event) => onChange({ childName: event.target.value })}
            required
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </Field>
        <Field label="Grade / class">
          <select
            value={child.grade}
            onChange={(event) => onChange({ grade: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {gradeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Board">
          <select
            value={child.board}
            onChange={(event) => onChange({ board: event.target.value as ChildRegistrationDraft["board"] })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {(["CBSE", "State", "ICSE", "Other"] as const).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="School name (optional)">
          <input
            value={child.schoolName || ""}
            onChange={(event) => onChange({ schoolName: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </Field>
        {classNumber >= 6 && classNumber <= 10 && (
          <>
            <LanguageInput label="R1 — First Language" value={child.r1Language} onChange={(value) => onChange({ r1Language: value })} required />
            <LanguageInput label="R2 — Second Language" value={child.r2Language} onChange={(value) => onChange({ r2Language: value })} required />
            <LanguageInput
              label={`R3 — Third Language${classNumber <= 8 ? " (optional)" : ""}`}
              value={child.r3Language}
              onChange={(value) => onChange({ r3Language: value })}
              required={classNumber >= 9}
            />
          </>
        )}
        {classNumber >= 1 && classNumber <= 5 && (
          <>
            <LanguageInput label="School Language 1 (optional)" value={child.r1Language} onChange={(value) => onChange({ r1Language: value })} />
            <LanguageInput label="School Language 2 (optional)" value={child.r2Language} onChange={(value) => onChange({ r2Language: value })} />
          </>
        )}
        <Field label="Preferred explanation language">
          <input
            list="language-options"
            value={child.explanationLanguage}
            onChange={(event) => onChange({ explanationLanguage: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </Field>
        <Field label="Weak subjects (comma separated)">
          <input
            value={child.weakSubjects}
            onChange={(event) => onChange({ weakSubjects: event.target.value })}
            placeholder={getSubjectsForGrade(child.grade).slice(0, 3).join(", ")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </Field>
        <label className="md:col-span-2 grid gap-2 text-sm font-semibold text-slate-700">
          Learning goal
          <textarea
            required
            value={child.learningGoal}
            onChange={(event) => onChange({ learningGoal: event.target.value })}
            className="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-normal text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            placeholder="Example: rebuild basics, prepare for half-yearly, improve reading…"
          />
        </label>
      </div>

      {classNumber >= 6 && classNumber <= 10 && (
        <div
          className={`mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold ${
            cbseValidation.status === "Valid"
              ? "bg-green-50 text-green-700"
              : cbseValidation.status === "Invalid combination"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-800"
          }`}
        >
          CBSE languages: {cbseValidation.status}. {cbseValidation.message}
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Subjects this child is studying</h3>
            <p className="text-xs text-slate-500">Edit publisher/book to match the school exactly.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useSuggestedSubjects}
              className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100"
            >
              Use suggested for grade
            </button>
            <button
              type="button"
              onClick={() => setSubjects((current) => [...current, createSubjectDraft()])}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add subject
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          {child.submittedSubjects.map((subject, subjectIndex) => (
            <div key={subjectIndex} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Subject name">
                <input
                  list="subject-name-options"
                  value={subject.subjectName}
                  onChange={(event) => updateSubject(subjectIndex, { subjectName: event.target.value })}
                  required
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                />
              </Field>
              <SelectField label="Type" value={subject.subjectType} options={subjectTypeOptions} onChange={(value) => updateSubject(subjectIndex, { subjectType: value as SubmittedSubject["subjectType"] })} />
              <SelectField label="Language role" value={subject.languageRole} options={languageRoleOptions} onChange={(value) => updateSubject(subjectIndex, { languageRole: value as SubmittedSubject["languageRole"] })} />
              <Field label="Language">
                <input
                  list="language-options"
                  value={subject.language}
                  onChange={(event) => updateSubject(subjectIndex, { language: event.target.value })}
                  placeholder="Optional"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                />
              </Field>
              <SelectField label="Publisher / source" value={subject.publisher} options={publisherOptions} onChange={(value) => updateSubject(subjectIndex, { publisher: value as SubmittedSubject["publisher"] })} />
              <Field label="Book title">
                <input
                  list={subject.publisher === "NCERT" ? "ncert-book-options" : undefined}
                  value={subject.bookTitle}
                  onChange={(event) => updateSubject(subjectIndex, { bookTitle: event.target.value })}
                  placeholder="Recommended"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                />
              </Field>
              <SelectField label="Medium" value={subject.medium} options={mediumOptions} onChange={(value) => updateSubject(subjectIndex, { medium: value as SubmittedSubject["medium"] })} />
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-100 xl:col-span-2">
                <input
                  id={`auto-${index}-${subjectIndex}`}
                  type="checkbox"
                  checked={subject.autoDownloadAllowed}
                  onChange={(event) => updateSubject(subjectIndex, { autoDownloadAllowed: event.target.checked, sourceStatus: subjectStatusForPublisher(subject.publisher, event.target.checked) })}
                />
                <label htmlFor={`auto-${index}-${subjectIndex}`}>Allow official NCERT auto-download when this source is NCERT</label>
              </div>
              <div className="md:col-span-2 xl:col-span-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSubjects((current) => current.filter((_, idx) => idx !== subjectIndex))}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove subject
                </button>
              </div>
            </div>
          ))}
        </div>
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
    </article>
  );
}

function Input({ name, label, type = "text", defaultValue = "" }: { name: string; label: string; type?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-normal text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
      />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-normal text-slate-900"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function LanguageInput({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input
        list="language-options"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder="Search/select language"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-normal text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
      />
    </label>
  );
}
