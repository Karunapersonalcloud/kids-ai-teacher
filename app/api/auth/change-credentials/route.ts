import { findAccessById, findAccessByIdentifier, updateAccessRequest } from "@/lib/access-store";
import { hashPin, verifyPin } from "@/lib/credentials";
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

  const newPin = (body.newPin || "").trim();
  const confirmPin = (body.confirmPin || "").trim();
  if (!newPin || newPin.length < 6) return Response.json({ error: "New PIN/password must be at least 6 characters." }, { status: 400 });
  if (newPin !== confirmPin) return Response.json({ error: "Confirm PIN/password must match." }, { status: 400 });

  // Reject if new PIN equals the temporary PIN or the current credential.
  if (user.tempPin && newPin === user.tempPin) {
    return Response.json({ error: "New PIN/password cannot be the same as the temporary PIN." }, { status: 400 });
  }
  const currentMatch = verifyPin(user.credentialHash, newPin);
  if (currentMatch.ok) {
    return Response.json({ error: "New PIN/password must be different from the current one." }, { status: 400 });
  }

  await updateAccessRequest(user.id, {
    credentialHash: hashPin(newPin),
    tempPin: undefined,
    mustChangeCredentials: false,
    notes: "User changed temporary PIN.",
  });

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", "kids_must_change_credentials=false; Path=/; SameSite=Lax");
  return new Response(JSON.stringify({ ok: true, redirectTo: user.role === "admin" ? "/admin" : "/dashboard" }), { headers });
}
