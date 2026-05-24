import { createSubjectDraft, normalizeSubmittedSubjects, type SubmittedSubject } from "./student-subjects";

/**
 * Per-child draft submitted by a parent during multi-child registration.
 * The first child entry is mirrored back into the legacy single-child fields on AccessRequest
 * (childName, grade, board, r1Language, r2Language, r3Language, submittedSubjects, ...)
 * for backward compatibility with existing screens.
 */
export type ChildRegistrationDraft = {
  childName: string;
  grade: string;
  board: "CBSE" | "State" | "ICSE" | "Other";
  schoolName?: string;
  state?: string;
  city?: string;
  r1Language: string;
  r2Language: string;
  r3Language: string;
  explanationLanguage: string;
  weakSubjects: string;
  learningGoal: string;
  submittedSubjects: SubmittedSubject[];
};

export function createChildDraft(overrides: Partial<ChildRegistrationDraft> = {}): ChildRegistrationDraft {
  return {
    childName: overrides.childName || "",
    grade: overrides.grade || "Class 5",
    board: overrides.board || "CBSE",
    schoolName: overrides.schoolName || "",
    state: overrides.state || "",
    city: overrides.city || "",
    r1Language: overrides.r1Language || "",
    r2Language: overrides.r2Language || "",
    r3Language: overrides.r3Language || "",
    explanationLanguage: overrides.explanationLanguage || "English",
    weakSubjects: overrides.weakSubjects || "",
    learningGoal: overrides.learningGoal || "",
    submittedSubjects: overrides.submittedSubjects?.length
      ? overrides.submittedSubjects.map((s) => createSubjectDraft(s))
      : [createSubjectDraft({ subjectName: "English", subjectType: "Language", languageRole: "R1", language: "English" })],
  };
}

export function normalizeChildDrafts(value: unknown): ChildRegistrationDraft[] {
  const parsed = typeof value === "string" ? safeParse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const raw = item as Record<string, unknown>;
      const childName = String(raw.childName || "").trim();
      if (!childName) return undefined;
      return createChildDraft({
        childName,
        grade: String(raw.grade || ""),
        board: (String(raw.board || "CBSE") as ChildRegistrationDraft["board"]),
        schoolName: String(raw.schoolName || ""),
        state: String(raw.state || ""),
        city: String(raw.city || ""),
        r1Language: String(raw.r1Language || ""),
        r2Language: String(raw.r2Language || ""),
        r3Language: String(raw.r3Language || ""),
        explanationLanguage: String(raw.explanationLanguage || "English"),
        weakSubjects: String(raw.weakSubjects || ""),
        learningGoal: String(raw.learningGoal || ""),
        submittedSubjects: normalizeSubmittedSubjects(raw.submittedSubjects),
      });
    })
    .filter((item): item is ChildRegistrationDraft => Boolean(item));
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
