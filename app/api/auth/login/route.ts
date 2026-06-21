import { AccessRequest, ensureUserForAccessRequest, findAccessByIdentifier, normalizeLoginIdentifier, updateAccessRequest } from "@/lib/access-store";
import { verifyPin } from "@/lib/credentials";
import { prisma } from "@/lib/db";
import { isPostgresEnabled } from "@/lib/persistence-provider";
import { buildSessionCookie, isLocalRequest } from "@/lib/session";
import { getParentLock, resetParentLock, setParentLock } from "@/lib/auth-locks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      pin?: string;
      email?: string;
      adminDemo?: boolean;
      loginType?: "parent" | "student";
    };
    const loginType = body.loginType === "student" ? "student" : "parent";
    const rawIdentifier = (body.identifier || body.email || "").trim();
    const identifier = normalizeLoginIdentifier(rawIdentifier);
    const pin = (body.pin || "").trim();

    if (!identifier && !body.adminDemo) {
      return Response.json({ error: loginType === "student" ? "Student ID is required." : "Email/mobile is required." }, { status: 400 });
    }
    if (!pin && !body.adminDemo) {
      return Response.json({ error: "PIN/password is required." }, { status: 400 });
    }

    if (loginType === "student") {
      return await loginStudent(request, identifier, pin);
    }

    if (body.adminDemo && !isLocalRequest(request)) {
      return Response.json({ error: "Local family admin quick login is disabled in production." }, { status: 403 });
    }

    const user = body.adminDemo
      ? await findAccessByIdentifier(process.env.ADMIN_EMAIL || "admin@kids-ai-teacher.local")
      : identifier
        ? await findAccessByIdentifier(identifier)
        : undefined;

    if (!body.adminDemo && process.env.NODE_ENV !== "production") {
      console.info("[auth][login][parent] Lookup result", {
        found: Boolean(user),
        identifierType: rawIdentifier.includes("@") ? "email" : "mobile",
        identifierNormalized: Boolean(identifier),
        status: user?.status,
        mustChangeCredentials: user?.mustChangeCredentials,
        hasCredentialHash: Boolean(user?.credentialHash),
        hasTempPin: Boolean(user?.tempPin),
      });
    }

    if (!user) {
      return Response.json({ error: "No registration found for this email/mobile. Please register first." }, { status: 404 });
    }

    if (user.status === "pending") {
      return Response.json({ error: "Your account is waiting for admin approval." }, { status: 403 });
    }
    if (user.status === "blocked") {
      return Response.json({ error: "Your account is blocked. Contact support." }, { status: 403 });
    }
    if (user.status === "rejected") {
      return Response.json({ error: "Your account is blocked. Contact support." }, { status: 403 });
    }

    const parentLock = await getParentLock(user.id);
    const postgresParentUser = isPostgresEnabled() ? await getPostgresParentUser(user) : null;
    if (postgresParentUser?.lockedAt && !postgresParentUser.unlockedAt) {
      return Response.json(
        { error: "Your account is locked after too many wrong attempts. Please reset your password or contact support." },
        { status: 403 }
      );
    }

    const expiredByDate = Boolean(user.expiryDate) && Date.parse(user.expiryDate as string) <= Date.now();
    if (user.status === "expired" || expiredByDate) {
      return Response.json({ error: "Your access has expired. Contact admin." }, { status: 403 });
    }

    if (user.role === "admin" && (user.userType !== "internalFamily" || user.status !== "active")) {
      return Response.json({ error: "Admin account is not active." }, { status: 403 });
    }

    let mustChangeCredentials = user.mustChangeCredentials;
    if (!body.adminDemo) {
      const verification = verifyPin(user.credentialHash, pin);
      if (process.env.NODE_ENV !== "production") {
        console.info("[auth][login][parent] Credential verification", {
          userId: user.id,
          path: user.mustChangeCredentials ? "temporary-or-current-credential-hash" : "credential-hash",
          matched: verification.ok,
          legacyPlainMatch: verification.legacyPlainMatch,
        });
      }
      if (!verification.ok) {
        const attempts = (postgresParentUser?.failedLoginAttempts ?? parentLock.failedLoginAttempts) + 1;
        if (attempts >= 3) {
          if (postgresParentUser) {
            await prisma.user.update({
              where: { id: postgresParentUser.id },
              data: {
                failedLoginAttempts: attempts,
                lockedAt: new Date(),
                lockedReason: "too_many_failed_logins",
                unlockedAt: null,
              },
            });
          } else {
            await setParentLock(user.id, {
              failedLoginAttempts: attempts,
              lockedAt: new Date().toISOString(),
              lockedReason: "too_many_failed_logins",
            });
          }
          return Response.json(
            { error: "Your account is locked after too many wrong attempts. Please reset your password or contact support." },
            { status: 403 }
          );
        }
        if (postgresParentUser) {
          await prisma.user.update({ where: { id: postgresParentUser.id }, data: { failedLoginAttempts: attempts } });
        } else {
          await setParentLock(user.id, { failedLoginAttempts: attempts });
        }
        return Response.json(
          { error: `Incorrect PIN/password. ${3 - attempts} attempt${attempts === 2 ? "" : "s"} remaining.` },
          { status: 401 }
        );
      }
      if (verification.legacyPlainMatch) {
        mustChangeCredentials = true;
      }
      if (postgresParentUser) {
        await prisma.user.update({
          where: { id: postgresParentUser.id },
          data: {
            failedLoginAttempts: 0,
            lockedAt: null,
            lockedReason: null,
            unlockedAt: null,
          },
        });
      } else {
        await resetParentLock(user.id);
      }
    }

    let loginAccess = user;
    let sessionUserId: string;
    try {
      loginAccess =
        (await updateAccessRequest(user.id, {
          lastLoginAt: new Date().toISOString(),
          mustChangeCredentials,
        })) || user;
      sessionUserId = await ensureUserForAccessRequest(loginAccess);
    } catch (error) {
      console.error("[auth][login][parent] User mapping failed", summarizeLoginError(error));
      return Response.json({ error: "Login setup is incomplete. Please contact support." }, { status: 503 });
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    const cookieBase = "Path=/; SameSite=Lax";
    headers.append("Set-Cookie", buildSessionCookie(sessionUserId, request));
    headers.append("Set-Cookie", `kids_user_id=${encodeURIComponent(sessionUserId)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_user_email=${encodeURIComponent(user.email)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_access_role=${encodeURIComponent(user.role)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_access_status=${encodeURIComponent(user.status)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_access_plan=${encodeURIComponent(user.plan)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_user_type=${encodeURIComponent(user.userType)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_must_change_credentials=${String(mustChangeCredentials)}; ${cookieBase}`);

    const safeUser = { ...loginAccess, mustChangeCredentials, credentialHash: undefined, tempPin: undefined };
    return new Response(JSON.stringify({ user: safeUser, loginType: "parent" }), { headers });
  } catch (error) {
    console.error("[auth][login] Unhandled error", summarizeLoginError(error));
    return Response.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}

async function getPostgresParentUser(user: AccessRequest) {
  if (!isPostgresEnabled()) return null;
  if (user.id === "family-admin" || user.role === "admin") return null;

  let userId = user.userId || user.id;
  if ((user.status === "trial" || user.status === "active") && !user.userId) {
    try {
      userId = await ensureUserForAccessRequest(user);
    } catch {
      // If user creation fails, fallback to access request state.
    }
  }

  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      credentialHash: true,
      failedLoginAttempts: true,
      lockedAt: true,
      lockedReason: true,
      unlockedAt: true,
    },
  });
}

async function loginStudent(request: Request, studentLoginId: string, pin: string) {
  if (!isPostgresEnabled()) {
    return Response.json({ error: "Student login is not configured in this environment." }, { status: 503 });
  }

  try {
    const child = await prisma.child.findFirst({
      where: {
        studentLoginId,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        grade: true,
        studentLoginId: true,
        studentPasswordHash: true,
        mustChangeStudentPassword: true,
        studentLoginEnabled: true,
        studentFailedLoginAttempts: true,
        studentLockedAt: true,
        studentLockedReason: true,
        studentUnlockedAt: true,
      },
    });

    if (!child) {
      return Response.json({ error: "Student ID not found." }, { status: 404 });
    }

    if (!child.studentLoginEnabled) {
      return Response.json({ error: "Student login is disabled. Ask your parent to enable it." }, { status: 403 });
    }

    if (child.studentLockedAt && !child.studentUnlockedAt) {
      return Response.json(
        { error: "Your account is locked after too many wrong attempts. Please ask your parent to unlock it." },
        { status: 403 }
      );
    }

    const verification = verifyPin(child.studentPasswordHash, pin);
    if (process.env.NODE_ENV !== "production") {
      console.info("[auth][login][student] Credential verification", {
        studentId: child.id,
        matched: verification.ok,
        mustChangeStudentPassword: child.mustChangeStudentPassword,
      });
    }
    if (!verification.ok) {
      const attempts = child.studentFailedLoginAttempts + 1;
      if (attempts >= 3) {
        await prisma.child.update({
          where: { id: child.id },
          data: {
            studentFailedLoginAttempts: attempts,
            studentLockedAt: new Date(),
            studentLockedReason: "too_many_failed_logins",
            studentUnlockedAt: null,
          },
        });
        return Response.json(
          { error: "Your account is locked after too many wrong attempts. Please ask your parent to unlock it." },
          { status: 403 }
        );
      }
      await prisma.child.update({ where: { id: child.id }, data: { studentFailedLoginAttempts: attempts } });
      return Response.json(
        { error: `Incorrect PIN/password. ${3 - attempts} attempt${attempts === 2 ? "" : "s"} remaining.` },
        { status: 401 }
      );
    }
    await prisma.child.update({
      where: { id: child.id },
      data: {
        studentFailedLoginAttempts: 0,
        studentLockedAt: null,
        studentLockedReason: null,
        studentUnlockedAt: null,
      },
    });

    const headers = new Headers({ "Content-Type": "application/json" });
    const cookieBase = "Path=/; SameSite=Lax";
    headers.append("Set-Cookie", buildSessionCookie(child.id, request));
    headers.append("Set-Cookie", `kids_user_id=${encodeURIComponent(child.id)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_student_id=${encodeURIComponent(child.id)}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_student_name=${encodeURIComponent(child.name || "Student")}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_student_grade=${encodeURIComponent(child.grade || "")}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_parent_user_id=${encodeURIComponent(child.userId || "")}; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_access_role=student; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_access_status=active; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_access_plan=student; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_user_type=student; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_must_change_credentials=false; ${cookieBase}`);
    headers.append("Set-Cookie", `kids_must_change_student_password=${String(child.mustChangeStudentPassword)}; ${cookieBase}`);

    return new Response(
      JSON.stringify({
        loginType: "student",
        student: {
          id: child.id,
          name: child.name,
          grade: child.grade,
          studentLoginId: child.studentLoginId,
          mustChangeStudentPassword: child.mustChangeStudentPassword,
        },
      }),
      { headers }
    );
  } catch (error) {
    if (isMissingChildLoginColumn(error)) {
      console.error("[auth][login][student] Missing student login columns", summarizeLoginError(error));
      return Response.json({ error: "Student login setup is pending. Please contact support." }, { status: 503 });
    }
    throw error;
  }
}

function summarizeLoginError(error: unknown) {
  const err = error as { name?: string; code?: string; message?: string };
  return {
    name: err?.name,
    code: err?.code,
    message: err?.message,
  };
}

function isMissingChildLoginColumn(error: unknown) {
  const err = error as { code?: string; message?: string };
  return err?.code === "P2022" && typeof err?.message === "string" && err.message.includes("Child.studentLoginId");
}
