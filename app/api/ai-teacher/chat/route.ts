import OpenAI from "openai";
import { getChild } from "@/lib/mock-data";
import { searchChunks } from "@/lib/rag-store";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: ChildId; subject?: string; mode?: string; message?: string; materialFilter?: string; fileId?: string };
  const access = await getRequestAccess(request);
  if (access.mustChangeCredentials) {
    return Response.json({ answer: "Please change your temporary PIN before using AI Teacher." }, { status: 403 });
  }
  if (access.status === "pending" || access.status === "blocked" || access.status === "rejected" || access.status === "expired") {
    return Response.json({ answer: "Your account is not approved for AI access yet." }, { status: 403 });
  }
  if (!access.policy.canUseAI && access.status !== "guest") {
    return Response.json({ answer: "AI access is not enabled for this account." }, { status: 403 });
  }
  const session = getSessionFromCookie(request.headers.get("cookie") || "");
  const usage = await checkAndIncrementAiUsage(access.userId || session.userId, access.plan || session.plan, access.dailyAiLimit);
  if (!usage.allowed) {
    return Response.json({
      answer: "Daily AI limit reached. Please try tomorrow or upgrade access.",
      usage,
      grounded: false,
    }, { status: 429 });
  }
  const child = getChild(body.childId || "jayadeep");
  const subject = body.subject || "Maths";
  const mode = body.mode || "Teach from basics";
  const message = body.message || "Explain this topic";
  const healthSafetyNote =
    subject.toLowerCase() === "physical education and well-being"
      ? "For Physical Education and Well-being, teach with practical child-friendly health and fitness examples. Avoid medical diagnosis. For health problems, recommend asking a parent, teacher, or doctor. Keep the focus on school subject learning."
      : "";
  const skillEducationNote =
    subject.toLowerCase() === "skill education"
      ? "For Skill Education, explain practically with real-life examples, give activity-based tasks, and connect ideas to school projects and future career skills."
      : "";
  const artsNote =
    subject.toLowerCase() === "arts"
      ? "For Arts, make learning creative and visual, give step-by-step activity ideas, encourage creativity over perfection, and never judge the child's drawing harshly."
      : "";
  const retrievedChunks = await searchChunks(message, {
    childId: child.id,
    subject: body.materialFilter === "all" ? undefined : subject,
    fileId: body.fileId,
    limit: 5,
  });
  const context = retrievedChunks.map((chunk, index) => `Source ${index + 1}: ${chunk.fileName}, ${chunk.chapter || chunk.subject}\n${chunk.text}`).join("\n\n");

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      mode: "mock",
      grounded: retrievedChunks.length > 0,
      groundedLabel: getGroundedLabel(retrievedChunks),
      sources: retrievedChunks.map((chunk) => ({ fileId: chunk.fileId, fileName: chunk.fileName, chapter: chunk.chapter, source: chunk.source || chunk.materialType })),
      answer: mockTeacherAnswer(child.name, child.grade, subject, mode, message, context),
    });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a patient, kind, concept-oriented private teacher for children.
Never shame the child. Explain according to grade: ${child.grade}.
For Jayadeep, rebuild missing prerequisites from lower classes where needed and support CBSE 2026 competency-based learning.
For Harini, keep sentences short, playful, visual, and encouraging.
Use Telugu support only when the selected mode asks for it.
Prefer concept clarity over rote memorization.
${healthSafetyNote}
${skillEducationNote}
${artsNote}
When provided uploaded material context, prioritize it. If context is not enough, say that clearly, then provide general help separately.
Answer with sections: Simple explanation, From your textbook/material, Easy example, Visual understanding, Step-by-step, Check your understanding question, Encouragement.`,
      },
      {
        role: "user",
        content: `Child: ${child.name}. Subject: ${subject}. Learning mode: ${mode}. Doubt: ${message}

Uploaded material context:
${context || "No matching indexed material was found."}`,
      },
    ],
  });

  return Response.json({
    mode: "openai",
    grounded: retrievedChunks.length > 0,
    groundedLabel: getGroundedLabel(retrievedChunks),
    sources: retrievedChunks.map((chunk) => ({ fileId: chunk.fileId, fileName: chunk.fileName, chapter: chunk.chapter, source: chunk.source || chunk.materialType })),
    answer: completion.choices[0]?.message.content || mockTeacherAnswer(child.name, child.grade, subject, mode, message, context),
  });
}

function getSessionFromCookie(cookie: string) {
  const values = Object.fromEntries(
    cookie
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((part) => part.length === 2)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
  return {
    userId: values.kids_user_id || "demo-user",
    plan: ((values.kids_access_plan as PlanName | undefined) || "demo"),
  };
}

function getGroundedLabel(chunks: Awaited<ReturnType<typeof searchChunks>>) {
  if (chunks.some((chunk) => chunk.source === "NCERT Official Download")) return "Grounded in NCERT textbook materials";
  if (chunks.some((chunk) => chunk.source === "Local Textbook Folder" || chunk.materialType === "Textbook")) return "Grounded in textbook materials";
  return "Grounded in uploaded study materials";
}

function mockTeacherAnswer(childName: string, grade: string, subject: string, mode: string, message: string, context: string) {
  return `Hi ${childName}! Let's learn this gently.

Simple explanation:
You asked about "${message}" in ${subject}. We will start from the basic idea first.

From your textbook/material:
${context ? "I found matching indexed material and will use it as the main learning context." : "I could not find matching indexed material yet. I will give general help now; upload and index the textbook for grounded answers."}

Easy example:
Think of the topic as a small building block. Once one block is strong, the next block sits properly.

Visual understanding:
Picture the idea as boxes connected with arrows: old knowledge -> new concept -> practice question.

Step-by-step:
1. First understand the meaning.
2. Then see one simple example.
3. Then solve a tiny question.
4. Then try a school-style question.

Check your understanding question:
Can you explain the idea in your own words in one sentence?

Encouragement:
Mode used: ${mode}. Grade focus: ${grade}. You are doing fine. We will go one small step at a time.`;
}
