import { promises as fs } from "fs";
import path from "path";

const lockFilePath = path.join(process.cwd(), "storage", "auth-locks.json");

type LockState = {
  failedLoginAttempts: number;
  lockedAt?: string;
  lockedReason?: string;
  unlockedAt?: string;
};

export type AuthLocks = {
  parents: Record<string, LockState>;
  students: Record<string, LockState>;
};

const defaultLocks: AuthLocks = {
  parents: {},
  students: {},
};

async function ensureStorage() {
  await fs.mkdir(path.dirname(lockFilePath), { recursive: true });
}

async function readAuthLocks(): Promise<AuthLocks> {
  await ensureStorage();
  try {
    const raw = await fs.readFile(lockFilePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AuthLocks>;
    return {
      parents: parsed.parents || {},
      students: parsed.students || {},
    };
  } catch {
    await writeAuthLocks(defaultLocks);
    return defaultLocks;
  }
}

async function writeAuthLocks(locks: AuthLocks) {
  await ensureStorage();
  await fs.writeFile(lockFilePath, JSON.stringify(locks, null, 2), "utf8");
}

function normalizeLockState(state?: LockState): LockState {
  return {
    failedLoginAttempts: state?.failedLoginAttempts ?? 0,
    lockedAt: state?.lockedAt,
    lockedReason: state?.lockedReason,
    unlockedAt: state?.unlockedAt,
  };
}

export async function getParentLock(accessId: string): Promise<LockState> {
  const locks = await readAuthLocks();
  return normalizeLockState(locks.parents[accessId]);
}

export async function setParentLock(accessId: string, patch: Partial<LockState>) {
  const locks = await readAuthLocks();
  locks.parents[accessId] = normalizeLockState({ ...locks.parents[accessId], ...patch });
  await writeAuthLocks(locks);
}

export async function resetParentLock(accessId: string) {
  const locks = await readAuthLocks();
  locks.parents[accessId] = { failedLoginAttempts: 0 };
  await writeAuthLocks(locks);
}

export async function getStudentLock(childId: string): Promise<LockState> {
  const locks = await readAuthLocks();
  return normalizeLockState(locks.students[childId]);
}

export async function setStudentLock(childId: string, patch: Partial<LockState>) {
  const locks = await readAuthLocks();
  locks.students[childId] = normalizeLockState({ ...locks.students[childId], ...patch });
  await writeAuthLocks(locks);
}

export async function resetStudentLock(childId: string) {
  const locks = await readAuthLocks();
  locks.students[childId] = { failedLoginAttempts: 0 };
  await writeAuthLocks(locks);
}
