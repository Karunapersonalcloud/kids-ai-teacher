import { createHmac, timingSafeEqual } from "crypto";
import { parseCookieHeader } from "./request-access";

const sessionCookie = "kids_session";

export function createSessionToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function getSessionUserIdFromCookie(cookieHeader: string) {
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[sessionCookie];
  if (!token) return undefined;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return undefined;

  const userId = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) return undefined;
  return timingSafeEqual(signatureBuffer, expectedBuffer) ? userId : undefined;
}

export function buildSessionCookie(userId: string, request: Request) {
  const secure = isProductionRequest(request) ? "; Secure" : "";
  return `${sessionCookie}=${encodeURIComponent(createSessionToken(userId))}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function buildExpiredSessionCookie() {
  return `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isProductionRequest(request: Request) {
  const host = new URL(request.url).hostname.toLowerCase();
  return process.env.NODE_ENV === "production" || host === "conceptkid.in" || host === "www.conceptkid.in" || host.endsWith(".vercel.app");
}

export function isLocalRequest(request: Request) {
  const host = new URL(request.url).hostname.toLowerCase();
  return process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1" || host === "::1");
}

function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET || "local-dev-session-secret").update(value).digest("base64url");
}
