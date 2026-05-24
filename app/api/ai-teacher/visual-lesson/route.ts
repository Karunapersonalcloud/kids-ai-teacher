import OpenAI from "openai";
import { getChild, mockVisualLesson } from "@/lib/mock-data";
import { getChapterByNumber } from "@/lib/learning/chapter-catalog";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId, VisualLesson } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    childId?: ChildId;
    childName?: string;
    grade?: string;
    board?: string;
    subject?: string;
    topic?: string;
    chapterNumber?: number;
    chapterName?: string;
    conceptName?: string;
  };
  const access = await getRequestAccess(request);
  if (access.mustChangeCredentials || access.status === "pending" || access.status === "blocked" || access.status === "rejected" || access.status === "expired") {
    return Response.json({ error: "Your account is not ready for AI access yet." }, { status: 403 });
  }
  if (!access.policy.canUseAI && access.status !== "guest") {
    return Response.json({ error: "AI access is not enabled for this account." }, { status: 403 });
  }
  const session = getSessionFromCookie(request.headers.get("cookie") || "");
  const usage = await checkAndIncrementAiUsage(access.userId || session.userId, access.plan || session.plan, access.dailyAiLimit);
  if (!usage.allowed) {
    return Response.json({ error: "Daily AI limit reached. Please try tomorrow or upgrade access.", usage }, { status: 429 });
  }
  const child = getChild(body.childId || "jayadeep");
  const grade = body.grade || child.grade;
  const board = body.board || "CBSE";
  const subject = body.subject || "Maths";
  const catalogChapter = getChapterByNumber(grade, subject, Number(body.chapterNumber) || 1);
  const chapterNumber = Number(body.chapterNumber) || catalogChapter.number;
  const chapterName = body.chapterName || catalogChapter.name;
  const conceptName = body.conceptName || body.topic || catalogChapter.concepts[0] || chapterName;

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(createFallbackVisualLesson({ grade, board, subject, chapterNumber, chapterName, conceptName }));
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return only valid JSON matching: title, gradeLevel, simpleExplanation, visualSteps[{title,icon,description}], realLifeExample, vocabulary[{word,meaning}], memoryTrick, quiz[{question,options,answer}]. Keep it child-friendly, visual, and grade-appropriate.",
      },
      {
        role: "user",
        content: `Create a visual lesson for ${body.childName || child.name}, ${grade}, ${board}. Subject: ${subject}. Chapter ${chapterNumber}: ${chapterName}. Concept: ${conceptName}. For Class 1 to 3, use very simple words, short sentences, playful visuals, and gentle examples. For Class 4 to 5, use concept explanation, real-life examples, and simple practice. For Class 6 to 8, use structured definitions, examples, practice, and common mistakes. For Class 9 to 10, use CBSE-style explanation, formulas where needed, exam-focused examples, and competency-based questions. Jayadeep needs prerequisites when needed. Harini needs short playful explanations.`,
      },
    ],
  });

  const text = completion.choices[0]?.message.content;
  try {
    return Response.json(JSON.parse(text || "{}") as VisualLesson);
  } catch {
    return Response.json(createFallbackVisualLesson({ grade, board, subject, chapterNumber, chapterName, conceptName }));
  }
}

function getSessionFromCookie(cookie: string) {
  const values = Object.fromEntries(cookie.split(";").map((part) => part.trim().split("=")).filter((part) => part.length === 2).map(([key, value]) => [key, decodeURIComponent(value)]));
  return { userId: values.kids_user_id || "demo-user", plan: ((values.kids_access_plan as PlanName | undefined) || "demo") };
}

function createFallbackVisualLesson({
  grade,
  board,
  subject,
  chapterNumber,
  chapterName,
  conceptName,
}: {
  grade: string;
  board: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  conceptName: string;
}): VisualLesson {
  const classNumber = Number(grade.match(/\d+/)?.[0] || 1);
  const isEarly = classNumber <= 3;
  const isMiddle = classNumber >= 6 && classNumber <= 8;
  const isHigh = classNumber >= 9;
  const title = `Chapter ${chapterNumber}: ${chapterName} - ${conceptName}`;
  const gradeLevel = `${grade} · ${subject} · ${board}`;

  if (isEarly) {
    return {
      title,
      gradeLevel,
      simpleExplanation: `${conceptName} means we look at one small idea in ${chapterName}. We learn it with pictures, daily examples, and tiny steps.`,
      visualSteps: [
        { title: "Look", icon: "👀", description: `See ${conceptName} in a picture or object around you.` },
        { title: "Name", icon: "🏷️", description: `Say the main word clearly: ${conceptName}.` },
        { title: "Connect", icon: "🏠", description: "Connect it with home, school, food, games, plants, or animals." },
        { title: "Try", icon: "⭐", description: "Answer one small question and celebrate the effort." },
      ],
      realLifeExample: `Think of something you see every day. That daily object can help us understand ${conceptName}.`,
      vocabulary: [
        { word: conceptName, meaning: `The main idea we are learning in ${chapterName}.` },
        { word: "Example", meaning: "Something real that helps us understand." },
      ],
      memoryTrick: `See it, say it, and connect it. That makes ${conceptName} easy.`,
      quiz: [{ question: `What are we learning now?`, options: [conceptName, chapterName, subject], answer: conceptName }],
    };
  }

  return {
    title,
    gradeLevel,
    simpleExplanation: `${conceptName} is an important part of ${chapterName}. Start with the meaning, connect it to a real example, then practice one step at a time.`,
    visualSteps: [
      { title: "Meaning", icon: "💡", description: `Understand what ${conceptName} means in simple words.` },
      { title: "Example", icon: "🧩", description: `Use a daily-life example to make ${conceptName} clear.` },
      { title: "Steps", icon: "🪜", description: isMiddle ? "Write the definition, example, and key steps neatly." : "Break the answer into exam-friendly steps." },
      { title: "Check", icon: isHigh ? "📝" : "✅", description: isHigh ? "Try one CBSE-style check question and map the weak point." : "Try one practice question and correct mistakes." },
    ],
    realLifeExample: `A real-life situation can show how ${conceptName} works before we move to textbook questions.`,
    vocabulary: [
      { word: conceptName, meaning: `The selected concept from Chapter ${chapterNumber}: ${chapterName}.` },
      { word: "Application", meaning: "Using the idea in a question or real situation." },
    ],
    memoryTrick: `Meaning first, example next, steps last. This keeps ${conceptName} clear.`,
    quiz: [
      {
        question: `Which chapter does ${conceptName} belong to?`,
        options: [`Chapter ${chapterNumber}: ${chapterName}`, mockVisualLesson.title, "Exam Preparation"],
        answer: `Chapter ${chapterNumber}: ${chapterName}`,
      },
    ],
  };
}
