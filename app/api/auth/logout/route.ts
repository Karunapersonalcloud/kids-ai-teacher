export const runtime = "nodejs";

export async function POST() {
  const headers = new Headers({ "Content-Type": "application/json" });
  const expired = "Path=/; SameSite=Lax; Max-Age=0";
  for (const name of ["kids_user_id", "kids_user_email", "kids_access_role", "kids_access_status", "kids_access_plan", "kids_user_type", "kids_must_change_credentials"]) {
    headers.append("Set-Cookie", `${name}=; ${expired}`);
  }
  return new Response(JSON.stringify({ ok: true }), { headers });
}
