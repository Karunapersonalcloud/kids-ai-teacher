import { findAccessById, findAccessByIdentifier, updateAccessRequest } from "@/lib/access-store";
import { parseCookieHeader } from "@/lib/request-access";
import { getSessionUserIdFromCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { newPin?: string; confirmPin?: string };
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);
  const sessionUserId = getSessionUserIdFromCookie(cookieHeader);
  const email = cookies.kids_user_email || "";
  const user = sessionUserId ? await findAccessById(sessionUserId) : email ? await findAccessByIdentifier(email) : undefined;

  if (!user) return Response.json({ error: "Login session not found." }, { status: 401 });
  if (!body.newPin || body.newPin.length < 6) return Response.json({ error: "New PIN/password must be at least 6 characters." }, { status: 400 });
  if (body.newPin !== body.confirmPin) return Response.json({ error: "Confirm PIN/password must match." }, { status: 400 });
  if (body.newPin === user.tempPin || body.newPin === user.credentialHash) return Response.json({ error: "New PIN/password cannot be the same as the temporary PIN." }, { status: 400 });

  await updateAccessRequest(user.id, {
    credentialHash: body.newPin,
    tempPin: undefined,
    mustChangeCredentials: false,
    notes: "User changed temporary PIN.",
  });

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", "kids_must_change_credentials=false; Path=/; SameSite=Lax");
  return new Response(JSON.stringify({ ok: true, redirectTo: user.role === "admin" ? "/admin" : "/dashboard" }), { headers });
}
