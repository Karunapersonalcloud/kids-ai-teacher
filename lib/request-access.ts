import type { PlanName } from "./billing-types";
import { findAccessById, findAccessByIdentifier } from "./access-store";
import { getSessionUserIdFromCookie } from "./session";

export type AccessPolicy = {
  canDownloadMaterials: boolean;
  canUploadMaterials: boolean;
  canUseAI: boolean;
  canUseOCR: boolean;
  canImportFromDrive: boolean;
  canIndexMaterials: boolean;
};

export type RequestAccess = {
  userId: string;
  role: string;
  status: string;
  plan: PlanName;
  userType: "internalFamily" | "externalUser";
  mustChangeCredentials: boolean;
  dailyAiLimit?: number;
  policy: AccessPolicy;
};

export function parseCookieHeader(cookie: string) {
  return Object.fromEntries(
    cookie
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((part) => part.length === 2)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

export async function getRequestAccess(request: Request): Promise<RequestAccess> {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookieHeader(cookieHeader);
  const sessionUserId = getSessionUserIdFromCookie(cookieHeader);
  const email = cookies.kids_user_email || "";
  const record = sessionUserId ? await findAccessById(sessionUserId) : email ? await findAccessByIdentifier(email) : undefined;

  if (record) {
    return {
      userId: record.id,
      role: record.role,
      status: record.status,
      plan: record.plan,
      userType: record.userType,
      mustChangeCredentials: record.mustChangeCredentials,
      dailyAiLimit: record.dailyAiLimit,
      policy: {
        canDownloadMaterials: record.canDownloadMaterials,
        canUploadMaterials: record.canUploadMaterials,
        canUseAI: record.canUseAI,
        canUseOCR: record.canUseOCR,
        canImportFromDrive: record.canImportFromDrive,
        canIndexMaterials: record.canIndexMaterials,
      },
    };
  }

  return {
    userId: cookies.kids_user_id || "demo-user",
    role: cookies.kids_access_role || "guest",
    status: cookies.kids_access_status || "guest",
    plan: ((cookies.kids_access_plan as PlanName | undefined) || "demo"),
    userType: (cookies.kids_user_type as "internalFamily" | "externalUser" | undefined) || "externalUser",
    mustChangeCredentials: cookies.kids_must_change_credentials === "true",
    dailyAiLimit: undefined,
    policy: {
      canDownloadMaterials: false,
      canUploadMaterials: false,
      canUseAI: cookies.kids_access_status === "trial" || cookies.kids_access_status === "active",
      canUseOCR: false,
      canImportFromDrive: false,
      canIndexMaterials: false,
    },
  };
}

export async function requirePolicy(request: Request, key: keyof AccessPolicy) {
  const access = await getRequestAccess(request);
  if (access.mustChangeCredentials) {
    return { ok: false as const, access, response: Response.json({ error: "Please change your temporary PIN before using this feature." }, { status: 403 }) };
  }
  if (!access.policy[key]) {
    return { ok: false as const, access, response: Response.json({ error: "Downloads are restricted. You can learn from this material inside the app." }, { status: 403 }) };
  }
  return { ok: true as const, access };
}
