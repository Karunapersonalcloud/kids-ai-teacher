import OpenAI from "openai";
import { getChild, mockQuiz } from "@/lib/mock-data";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId, QuizResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: ChildId; subject?: string; difficulty?: string; quizType?: string };
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
  const subject = body.subject || "Maths";
  const difficulty = body.difficulty || "easy";
  const quizType = body.quizType || "basic concept";

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ...mockQuiz, title: `${subject} ${quizType} Quiz` });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return only valid JSON with title and questions array. Each question has question, options, answer, explanation. Make it kind and concept-oriented.",
      },
      {
        role: "user",
        content: `Generate 5 ${difficulty} ${quizType} quiz questions for ${child.name}, ${child.grade}, subject ${subject}.`,
      },
    ],
  });

  try {
    return Response.json(JSON.parse(completion.choices[0]?.message.content || "{}") as QuizResult);
  } catch {
    return Response.json({ ...mockQuiz, title: `${subject} ${quizType} Quiz` });
  }
}

function getSessionFromCookie(cookie: string) {
  const values = Object.fromEntries(cookie.split(";").map((part) => part.trim().split("=")).filter((part) => part.length === 2).map(([key, value]) => [key, decodeURIComponent(value)]));
  return { userId: values.kids_user_id || "demo-user", plan: ((values.kids_access_plan as PlanName | undefined) || "demo") };
}
