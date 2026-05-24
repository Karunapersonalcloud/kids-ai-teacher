import OpenAI from "openai";
import { getChild, mockVisualLesson } from "@/lib/mock-data";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId, VisualLesson } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { childId?: ChildId; subject?: string; topic?: string };
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
  const topic = body.topic || "Fractions";

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ ...mockVisualLesson, title: topic });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return only valid JSON matching: title, gradeLevel, simpleExplanation, visualSteps[{title,icon,description}], realLifeExample, vocabulary[{word,meaning}], memoryTrick, quiz[{question,options,answer}]. Keep it child-friendly and visual.",
      },
      {
        role: "user",
        content: `Create a visual lesson for ${child.name}, ${child.grade}. Subject: ${subject}. Topic: ${topic}. Jayadeep needs prerequisites when needed. Harini needs short playful explanations.`,
      },
    ],
  });

  const text = completion.choices[0]?.message.content;
  try {
    return Response.json(JSON.parse(text || "{}") as VisualLesson);
  } catch {
    return Response.json({ ...mockVisualLesson, title: topic });
  }
}

function getSessionFromCookie(cookie: string) {
  const values = Object.fromEntries(cookie.split(";").map((part) => part.trim().split("=")).filter((part) => part.length === 2).map(([key, value]) => [key, decodeURIComponent(value)]));
  return { userId: values.kids_user_id || "demo-user", plan: ((values.kids_access_plan as PlanName | undefined) || "demo") };
}
