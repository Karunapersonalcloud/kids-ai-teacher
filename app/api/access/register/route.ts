import { createAccessRequest } from "@/lib/access-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const required = ["parentName", "email", "mobile", "city", "preferredLanguage", "childName", "grade", "board", "explanationLanguage", "weakSubjects", "learningGoal"];
  const missing = required.find((field) => !String(body[field] || "").trim());
  if (missing) {
    return Response.json({ error: `${missing} is required.` }, { status: 400 });
  }

  const record = await createAccessRequest({
    parentName: String(body.parentName),
    email: String(body.email),
    mobile: String(body.mobile),
    city: String(body.city),
    preferredLanguage: String(body.preferredLanguage),
    childName: String(body.childName),
    grade: String(body.grade),
    board: body.board,
    explanationLanguage: String(body.explanationLanguage),
    weakSubjects: String(body.weakSubjects),
    learningGoal: String(body.learningGoal),
  });

  return Response.json({ request: record, message: "Registration submitted. Access will be enabled after admin approval." });
}
