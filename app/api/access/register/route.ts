import { createAccessRequest } from "@/lib/access-store";
import { buildSelectedLanguageMetadata, validateCbseLanguageSelection } from "@/lib/cbse-language-catalog";
import { normalizeSubmittedSubjects } from "@/lib/student-subjects";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const grade = String(body.grade || "");
  const classNumber = Number(grade.match(/\d+/)?.[0] || 0);
  const required = ["parentName", "email", "mobile", "state", "city", "preferredLanguage", "childName", "grade", "board", "explanationLanguage", "weakSubjects", "learningGoal"];
  if (classNumber >= 9 && classNumber <= 10) required.push("r1Language", "r2Language", "r3Language");
  if (classNumber >= 6 && classNumber <= 8) required.push("r1Language", "r2Language");
  const missing = required.find((field) => !String(body[field] || "").trim());
  if (missing) {
    return Response.json({ error: `${missing} is required.` }, { status: 400 });
  }
  const validation = validateCbseLanguageSelection({
    board: String(body.board || ""),
    grade,
    r1Language: String(body.r1Language || ""),
    r2Language: String(body.r2Language || ""),
    r3Language: String(body.r3Language || ""),
  });
  const selectedLanguages = buildSelectedLanguageMetadata({
    r1Language: String(body.r1Language || ""),
    r2Language: String(body.r2Language || ""),
    r3Language: String(body.r3Language || ""),
  });
  const submittedSubjects = normalizeSubmittedSubjects(body.submittedSubjects);
  if (!submittedSubjects.length) {
    return Response.json({ error: "Please add at least one subject your child is studying." }, { status: 400 });
  }

  const record = await createAccessRequest({
    parentName: String(body.parentName),
    email: String(body.email),
    mobile: String(body.mobile),
    state: String(body.state),
    city: String(body.city),
    preferredLanguage: String(body.preferredLanguage),
    childName: String(body.childName),
    grade: String(body.grade),
    board: body.board,
    explanationLanguage: String(body.explanationLanguage),
    r1Language: String(body.r1Language || ""),
    r2Language: String(body.r2Language || ""),
    r3Language: String(body.r3Language || ""),
    regionalLanguage: String(body.regionalLanguage || ""),
    selectedLanguages: JSON.stringify(selectedLanguages),
    submittedSubjects: JSON.stringify(submittedSubjects),
    cbseLanguageRuleWarning: validation.status === "Valid" ? "" : validation.message,
    cbseLanguageValidationStatus: validation.status,
    weakSubjects: String(body.weakSubjects),
    learningGoal: String(body.learningGoal),
  });

  return Response.json({ request: record, message: "Registration submitted. Access will be enabled after admin approval." });
}
