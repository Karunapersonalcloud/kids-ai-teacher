import { findAccessByIdentifier, updateAccessRequest } from "@/lib/access-store";
import { buildSessionCookie, isLocalRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { identifier?: string; pin?: string; email?: string; adminDemo?: boolean };
  const identifier = body.identifier || body.email || "";
  if (body.adminDemo && !isLocalRequest(request)) {
    return Response.json({ error: "Local family admin quick login is disabled in production." }, { status: 403 });
  }

  const user = body.adminDemo ? await findAccessByIdentifier(process.env.ADMIN_EMAIL || "admin@kids-ai-teacher.local") : identifier ? await findAccessByIdentifier(identifier) : undefined;
  if (!user) {
    return Response.json({ error: "No registration found for this email. Please register first." }, { status: 404 });
  }

  if (user.role === "admin" && (user.userType !== "internalFamily" || user.status !== "active")) {
    return Response.json({ error: "Admin account is not active." }, { status: 403 });
  }

  if (!body.adminDemo && user.credentialHash !== body.pin) {
    return Response.json({ error: "Incorrect PIN/password. Please check the login instructions from admin." }, { status: 401 });
  }

  await updateAccessRequest(user.id, { lastLoginAt: new Date().toISOString() });

  const headers = new Headers({ "Content-Type": "application/json" });
  const cookieBase = "Path=/; SameSite=Lax";
  headers.append("Set-Cookie", buildSessionCookie(user.id, request));
  headers.append("Set-Cookie", `kids_user_id=${encodeURIComponent(user.id)}; ${cookieBase}`);
  headers.append("Set-Cookie", `kids_user_email=${encodeURIComponent(user.email)}; ${cookieBase}`);
  headers.append("Set-Cookie", `kids_access_role=${encodeURIComponent(user.role)}; ${cookieBase}`);
  headers.append("Set-Cookie", `kids_access_status=${encodeURIComponent(user.status)}; ${cookieBase}`);
  headers.append("Set-Cookie", `kids_access_plan=${encodeURIComponent(user.plan)}; ${cookieBase}`);
  headers.append("Set-Cookie", `kids_user_type=${encodeURIComponent(user.userType)}; ${cookieBase}`);
  headers.append("Set-Cookie", `kids_must_change_credentials=${String(user.mustChangeCredentials)}; ${cookieBase}`);

  return new Response(JSON.stringify({ user }), { headers });
}
