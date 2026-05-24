import { createAccessRequest } from "@/lib/access-store";
import { buildSelectedLanguageMetadata, validateCbseLanguageSelection } from "@/lib/cbse-language-catalog";
import { normalizeChildDrafts } from "@/lib/multi-child";
import { normalizeSubmittedSubjects } from "@/lib/student-subjects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();

  // Parent-level fields (shared across all children in this registration).
  const parentRequired = ["parentName", "email", "mobile", "state", "city", "preferredLanguage"];
  const missingParent = parentRequired.find((field) => !String(body[field] || "").trim());
  if (missingParent) {
    return Response.json({ error: `${missingParent} is required.` }, { status: 400 });
  }

  // Multi-child path (preferred). Falls back to legacy single-child payload for backward compatibility.
  const children = normalizeChildDrafts(body.submittedChildren);

  if (children.length === 0) {
    const required = ["childName", "grade", "board", "explanationLanguage", "weakSubjects", "learningGoal"];
    const grade = String(body.grade || "");
    const classNumber = Number(grade.match(/\d+/)?.[0] || 0);
    if (classNumber >= 9 && classNumber <= 10) required.push("r1Language", "r2Language", "r3Language");
    if (classNumber >= 6 && classNumber <= 8) required.push("r1Language", "r2Language");
    const missing = required.find((field) => !String(body[field] || "").trim());
    if (missing) {
      return Response.json({ error: `${missing} is required.` }, { status: 400 });
    }
    const submittedSubjects = normalizeSubmittedSubjects(body.submittedSubjects);
    if (!submittedSubjects.length) {
      return Response.json({ error: "Please add at least one subject your child is studying." }, { status: 400 });
    }
  } else {
    for (const [index, child] of children.entries()) {
      if (!child.childName.trim()) {
        return Response.json({ error: `Child ${index + 1}: name is required.` }, { status: 400 });
      }
      if (!child.grade.trim()) {
        return Response.json({ error: `Child ${index + 1} (${child.childName}): grade is required.` }, { status: 400 });
      }
      if (!child.submittedSubjects.length) {
        return Response.json({ error: `Child ${index + 1} (${child.childName}): add at least one subject.` }, { status: 400 });
      }
      if (!child.learningGoal.trim()) {
        return Response.json({ error: `Child ${index + 1} (${child.childName}): learning goal is required.` }, { status: 400 });
      }
      const classNumber = Number(child.grade.match(/\d+/)?.[0] || 0);
      if (classNumber >= 9 && classNumber <= 10 && (!child.r1Language || !child.r2Language || !child.r3Language)) {
        return Response.json({ error: `Child ${index + 1} (${child.childName}): R1, R2, and R3 languages are required for Class 9/10.` }, { status: 400 });
      }
    }
  }

  // Use the first child (or legacy fields) to populate AccessRequest's top-level single-child fields
  // so admin screens and existing dashboards keep rendering during the migration to multi-child.
  const primary = children[0];
  const primaryGrade = primary ? primary.grade : String(body.grade || "");
  const primaryBoard = primary ? primary.board : (String(body.board || "CBSE") as "CBSE" | "State" | "ICSE" | "Other");
  const primaryR1 = primary ? primary.r1Language : String(body.r1Language || "");
  const primaryR2 = primary ? primary.r2Language : String(body.r2Language || "");
  const primaryR3 = primary ? primary.r3Language : String(body.r3Language || "");
  const primarySubjects = primary ? primary.submittedSubjects : normalizeSubmittedSubjects(body.submittedSubjects);

  const validation = validateCbseLanguageSelection({
    board: primaryBoard,
    grade: primaryGrade,
    r1Language: primaryR1,
    r2Language: primaryR2,
    r3Language: primaryR3,
  });

  const selectedLanguages = buildSelectedLanguageMetadata({
    r1Language: primaryR1,
    r2Language: primaryR2,
    r3Language: primaryR3,
  });

  const record = await createAccessRequest({
    parentName: String(body.parentName),
    email: String(body.email),
    mobile: String(body.mobile),
    state: String(body.state),
    city: String(body.city),
    preferredLanguage: String(body.preferredLanguage),
    childName: primary ? primary.childName : String(body.childName || ""),
    grade: primaryGrade,
    board: primaryBoard,
    explanationLanguage: primary ? primary.explanationLanguage : String(body.explanationLanguage || "English"),
    r1Language: primaryR1,
    r2Language: primaryR2,
    r3Language: primaryR3,
    regionalLanguage: String(body.regionalLanguage || ""),
    selectedLanguages: JSON.stringify(selectedLanguages),
    submittedSubjects: JSON.stringify(primarySubjects),
    submittedChildren: JSON.stringify(children),
    cbseLanguageRuleWarning: validation.status === "Valid" ? "" : validation.message,
    cbseLanguageValidationStatus: validation.status,
    weakSubjects: primary ? primary.weakSubjects : String(body.weakSubjects || ""),
    learningGoal: primary ? primary.learningGoal : String(body.learningGoal || ""),
  });

  return Response.json({
    request: record,
    message:
      children.length > 1
        ? `Registration submitted for ${children.length} children. Access will be enabled after admin approval.`
        : "Registration submitted. Access will be enabled after admin approval.",
  });
}
