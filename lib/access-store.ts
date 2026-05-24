import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "./db";
import { isPostgresEnabled } from "./persistence-provider";
import type { PlanName } from "./billing-types";
import type { AccessStatus, UserRole } from "./access-control";
import { normalizeSubmittedSubjects } from "./student-subjects";

export type UserType = "internalFamily" | "externalUser";

export type AccessRequest = {
  id: string;
  parentName: string;
  email: string;
  mobile: string;
  state: string;
  city: string;
  preferredLanguage: string;
  childName: string;
  grade: string;
  board: "CBSE" | "State" | "ICSE" | "Other";
  explanationLanguage: string;
  r1Language: string;
  r2Language: string;
  r3Language: string;
  regionalLanguage: string;
  selectedLanguages: string;
  submittedSubjects: string;
  cbseLanguageRuleWarning: string;
  cbseLanguageValidationStatus: string;
  weakSubjects: string;
  learningGoal: string;
  status: Exclude<AccessStatus, "guest">;
  role: UserRole;
  userType: UserType;
  plan: PlanName;
  loginIdentifier: string;
  // TODO production: replace plain local MVP PIN storage with a salted password hash.
  credentialHash?: string;
  tempPin?: string;
  mustChangeCredentials: boolean;
  tempCredentialsIssuedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAt?: string;
  canDownloadMaterials: boolean;
  canUploadMaterials: boolean;
  canUseAI: boolean;
  canUseOCR: boolean;
  canImportFromDrive: boolean;
  canIndexMaterials: boolean;
  maxChildren: number;
  dailyAiLimit: number;
  uploadLimit: number;
  ocrLimit: number;
  visualLessonLimit: number;
  quizGenerationLimit: number;
  expiryDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const accessRoot = path.join(process.cwd(), "storage");
const accessPath = path.join(accessRoot, "access-requests.json");

const seedRequests: AccessRequest[] = [
  {
    id: "family-admin",
    parentName: "Family Admin",
    email: "admin@kids-ai-teacher.local",
    mobile: "",
    state: "",
    city: "",
    preferredLanguage: "English",
    childName: "Jayadeep and Harini",
    grade: "Family",
    board: "CBSE",
    explanationLanguage: "English",
    r1Language: "English",
    r2Language: "Hindi",
    r3Language: "Kannada",
    regionalLanguage: "Kannada",
    selectedLanguages: JSON.stringify([
      { role: "R1", language: "English", subjectLabel: "R1 English" },
      { role: "R2", language: "Hindi", subjectLabel: "R2 Hindi" },
      { role: "R3", language: "Kannada", subjectLabel: "R3 Kannada" },
    ]),
    submittedSubjects: "[]",
    cbseLanguageRuleWarning: "",
    cbseLanguageValidationStatus: "Valid",
    weakSubjects: "",
    learningGoal: "Full family access",
    status: "active",
    role: "admin",
    userType: "internalFamily",
    plan: "family",
    loginIdentifier: "admin@kids-ai-teacher.local",
    credentialHash: "000000",
    mustChangeCredentials: false,
    approvedAt: new Date().toISOString(),
    approvedBy: "system",
    canDownloadMaterials: true,
    canUploadMaterials: true,
    canUseAI: true,
    canUseOCR: true,
    canImportFromDrive: true,
    canIndexMaterials: true,
    maxChildren: 6,
    dailyAiLimit: 500,
    uploadLimit: 500,
    ocrLimit: 150,
    visualLessonLimit: 100,
    quizGenerationLimit: 100,
    notes: "Built-in local admin for MVP.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function readAccessRequests(): Promise<AccessRequest[]> {
  if (isPostgresEnabled()) {
    await ensurePostgresFamilyAdmin();
    const [users, requests] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.accessRequest.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    const requestUserIds = new Set(requests.map((request) => request.userId).filter(Boolean));
    return [
      ...users.filter((user) => !requestUserIds.has(user.id)).map(accessFromUser),
      ...requests.map(accessFromRequest),
    ];
  }

  try {
    await fs.mkdir(accessRoot, { recursive: true });
    const raw = await fs.readFile(accessPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AccessRequest>[];
    const migrated = mergeSeed(parsed.map(migrateAccessRequest));
    await writeAccessRequests(migrated);
    return migrated;
  } catch {
    await writeAccessRequests(seedRequests);
    return seedRequests;
  }
}

export async function writeAccessRequests(requests: AccessRequest[]) {
  if (isPostgresEnabled()) {
    await Promise.all(requests.map((request) => upsertPostgresAccess(request)));
    return;
  }

  await fs.mkdir(accessRoot, { recursive: true });
  await fs.writeFile(accessPath, JSON.stringify(mergeSeed(requests), null, 2), "utf8");
}

export async function createAccessRequest(
  input: Pick<
    AccessRequest,
    | "parentName"
    | "email"
    | "mobile"
    | "state"
    | "city"
    | "preferredLanguage"
    | "childName"
    | "grade"
    | "board"
    | "explanationLanguage"
    | "r1Language"
    | "r2Language"
    | "r3Language"
    | "regionalLanguage"
    | "selectedLanguages"
    | "submittedSubjects"
    | "cbseLanguageRuleWarning"
    | "cbseLanguageValidationStatus"
    | "weakSubjects"
    | "learningGoal"
  >
) {
  if (isPostgresEnabled()) {
    const now = new Date();
    const record = await prisma.accessRequest.upsert({
      where: { email: input.email },
      update: {
        parentName: input.parentName,
        mobile: input.mobile,
        state: input.state,
        city: input.city,
        preferredLanguage: input.preferredLanguage,
        childName: input.childName,
        grade: input.grade,
        board: input.board,
        preferredExplanationLanguage: input.explanationLanguage,
        r1Language: input.r1Language,
        r2Language: input.r2Language,
        r3Language: input.r3Language,
        regionalLanguage: input.regionalLanguage,
        selectedLanguages: input.selectedLanguages,
        submittedSubjects: parseJson(input.submittedSubjects),
        cbseLanguageRuleWarning: input.cbseLanguageRuleWarning,
        cbseLanguageValidationStatus: input.cbseLanguageValidationStatus,
        weakSubjects: input.weakSubjects,
        learningGoal: input.learningGoal,
        status: "pending",
        plan: "demo",
        loginIdentifier: input.email,
        mustChangeCredentials: false,
        updatedAt: now,
      },
      create: {
        parentName: input.parentName,
        email: input.email,
        mobile: input.mobile,
        state: input.state,
        city: input.city,
        preferredLanguage: input.preferredLanguage,
        childName: input.childName,
        grade: input.grade,
        board: input.board,
        preferredExplanationLanguage: input.explanationLanguage,
        r1Language: input.r1Language,
        r2Language: input.r2Language,
        r3Language: input.r3Language,
        regionalLanguage: input.regionalLanguage,
        selectedLanguages: input.selectedLanguages,
        submittedSubjects: parseJson(input.submittedSubjects),
        cbseLanguageRuleWarning: input.cbseLanguageRuleWarning,
        cbseLanguageValidationStatus: input.cbseLanguageValidationStatus,
        weakSubjects: input.weakSubjects,
        learningGoal: input.learningGoal,
        status: "pending",
        role: "parent",
        userType: "externalUser",
        plan: "demo",
        loginIdentifier: input.email,
        mustChangeCredentials: false,
      },
    });
    return accessFromRequest(record);
  }

  const now = new Date().toISOString();
  const record: AccessRequest = {
    ...input,
    id: randomUUID(),
    status: "pending",
    role: "parent",
    userType: "externalUser",
    plan: "demo",
    loginIdentifier: input.email,
    mustChangeCredentials: false,
    canDownloadMaterials: false,
    canUploadMaterials: false,
    canUseAI: false,
    canUseOCR: false,
    canImportFromDrive: false,
    canIndexMaterials: false,
    maxChildren: 1,
    dailyAiLimit: 3,
    uploadLimit: 0,
    ocrLimit: 0,
    visualLessonLimit: 2,
    quizGenerationLimit: 1,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
  const requests = await readAccessRequests();
  await writeAccessRequests([record, ...requests.filter((request) => request.email.toLowerCase() !== record.email.toLowerCase())]);
  return record;
}

export async function updateAccessRequest(id: string, patch: Partial<AccessRequest>) {
  if (isPostgresEnabled()) {
    await ensurePostgresFamilyAdmin();
    if (id === "family-admin") {
      const user = await prisma.user.update({ where: { id }, data: userPatchToPrisma(patch) });
      return accessFromUser(user);
    }

    const existing = await prisma.accessRequest.findUnique({ where: { id } });
    if (!existing) return undefined;

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: requestPatchToPrisma(patch),
    });

    if (updated.status === "trial" || updated.status === "active") {
      const user = await upsertApprovedUser(updated);
      await prisma.accessRequest.update({ where: { id }, data: { userId: user.id } });
      await prisma.adminAction.create({
        data: {
          adminUserId: "family-admin",
          targetUserId: user.id,
          targetRequestId: id,
          action: `set-${updated.status}`,
          notes: updated.adminNotes,
          metadata: { plan: updated.plan, dailyAiLimit: updated.dailyAiLimit },
        },
      });
      return accessFromRequest(updated);
    }

    return accessFromRequest(updated);
  }

  const requests = await readAccessRequests();
  const next = requests.map((request) => (request.id === id ? { ...request, ...patch, updatedAt: new Date().toISOString() } : request));
  await writeAccessRequests(next);
  return next.find((request) => request.id === id);
}

export async function findAccessById(id: string) {
  if (isPostgresEnabled()) {
    await ensurePostgresFamilyAdmin();
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) {
      const request = await prisma.accessRequest.findFirst({ where: { userId: user.id } });
      if (request) return accessFromRequest(request);
      return accessFromUser(user);
    }
    const request = await prisma.accessRequest.findUnique({ where: { id } });
    return request ? accessFromRequest(request) : undefined;
  }

  const requests = await readAccessRequests();
  return requests.find((request) => request.id === id);
}

export async function findAccessByEmail(email: string) {
  if (isPostgresEnabled()) {
    await ensurePostgresFamilyAdmin();
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (user) return accessFromUser(user);
    const request = await prisma.accessRequest.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    return request ? accessFromRequest(request) : undefined;
  }

  const requests = await readAccessRequests();
  return requests.find((request) => request.email.toLowerCase() === email.toLowerCase());
}

export async function findAccessByIdentifier(identifier: string) {
  if (isPostgresEnabled()) {
    await ensurePostgresFamilyAdmin();
    const normalized = identifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalized, mode: "insensitive" } },
          { mobile: identifier },
          { loginIdentifier: { equals: normalized, mode: "insensitive" } },
        ],
      },
    });
    if (user) return accessFromUser(user);
    const request = await prisma.accessRequest.findFirst({
      where: {
        OR: [
          { email: { equals: normalized, mode: "insensitive" } },
          { mobile: identifier },
          { loginIdentifier: { equals: normalized, mode: "insensitive" } },
        ],
      },
    });
    return request ? accessFromRequest(request) : undefined;
  }

  const normalized = identifier.toLowerCase();
  const requests = await readAccessRequests();
  return requests.find((request) => request.email.toLowerCase() === normalized || request.mobile === identifier || request.loginIdentifier.toLowerCase() === normalized);
}

function optionalDate(value?: string | Date | null) {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function isoDate(value?: Date | string | null) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function parseJson(value?: unknown) {
  if (!value) return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stringifyJson(value: unknown) {
  if (!value) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function accessFromUser(user: {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  role: string;
  userType: string;
  status: string;
  plan: string;
  loginIdentifier: string | null;
  credentialHash: string | null;
  tempPin: string | null;
  mustChangeCredentials: boolean;
  approvedAt: Date | null;
  approvedBy: string | null;
  lastLoginAt: Date | null;
  canDownloadMaterials: boolean;
  canUploadMaterials: boolean;
  canUseAI: boolean;
  canUseOCR: boolean;
  canImportFromDrive: boolean;
  canIndexMaterials: boolean;
  dailyAiLimit: number;
  uploadLimit: number;
  createdAt: Date;
  updatedAt: Date;
}): AccessRequest {
  return migrateAccessRequest({
    id: user.id,
    parentName: user.name,
    email: user.email || "",
    mobile: user.mobile || "",
    childName: user.userType === "internalFamily" ? "Jayadeep and Harini" : "",
    grade: user.userType === "internalFamily" ? "Family" : "",
    status: user.status as Exclude<AccessStatus, "guest">,
    role: user.role as UserRole,
    userType: user.userType as UserType,
    plan: user.plan as PlanName,
    loginIdentifier: user.loginIdentifier || user.email || user.mobile || "",
    credentialHash: user.credentialHash || undefined,
    tempPin: user.tempPin || undefined,
    mustChangeCredentials: user.mustChangeCredentials,
    approvedAt: isoDate(user.approvedAt),
    approvedBy: user.approvedBy || undefined,
    lastLoginAt: isoDate(user.lastLoginAt),
    canDownloadMaterials: user.canDownloadMaterials,
    canUploadMaterials: user.canUploadMaterials,
    canUseAI: user.canUseAI,
    canUseOCR: user.canUseOCR,
    canImportFromDrive: user.canImportFromDrive,
    canIndexMaterials: user.canIndexMaterials,
    dailyAiLimit: user.dailyAiLimit,
    uploadLimit: user.uploadLimit,
    createdAt: isoDate(user.createdAt),
    updatedAt: isoDate(user.updatedAt),
  });
}

function accessFromRequest(request: {
  id: string;
  parentName: string;
  email: string;
  mobile: string;
  state: string | null;
  city: string | null;
  preferredLanguage: string | null;
  childName: string;
  grade: string;
  board: string | null;
  preferredExplanationLanguage: string | null;
  r1Language: string | null;
  r2Language: string | null;
  r3Language: string | null;
  regionalLanguage: string | null;
  selectedLanguages: unknown;
  submittedSubjects: unknown;
  cbseLanguageRuleWarning: string | null;
  cbseLanguageValidationStatus: string | null;
  weakSubjects: string | null;
  learningGoal: string | null;
  status: string;
  role: string;
  userType: string;
  plan: string;
  loginIdentifier: string | null;
  credentialHash: string | null;
  tempPin: string | null;
  mustChangeCredentials: boolean;
  tempCredentialsIssuedAt: Date | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  lastLoginAt: Date | null;
  canDownloadMaterials: boolean;
  canUploadMaterials: boolean;
  canUseAI: boolean;
  canUseOCR: boolean;
  canImportFromDrive: boolean;
  canIndexMaterials: boolean;
  maxChildren: number;
  dailyAiLimit: number;
  uploadLimit: number;
  ocrLimit: number;
  visualLessonLimit: number;
  quizGenerationLimit: number;
  expiryDate: Date | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AccessRequest {
  return migrateAccessRequest({
    id: request.id,
    parentName: request.parentName,
    email: request.email,
    mobile: request.mobile,
    state: request.state || "",
    city: request.city || "",
    preferredLanguage: request.preferredLanguage || "English",
    childName: request.childName,
    grade: request.grade,
    board: (request.board || "CBSE") as AccessRequest["board"],
    explanationLanguage: request.preferredExplanationLanguage || "English",
    r1Language: request.r1Language || "",
    r2Language: request.r2Language || "",
    r3Language: request.r3Language || "",
    regionalLanguage: request.regionalLanguage || "",
    selectedLanguages: stringifyJson(request.selectedLanguages),
    submittedSubjects: stringifyJson(request.submittedSubjects),
    cbseLanguageRuleWarning: request.cbseLanguageRuleWarning || "",
    cbseLanguageValidationStatus: request.cbseLanguageValidationStatus || "",
    weakSubjects: request.weakSubjects || "",
    learningGoal: request.learningGoal || "",
    status: request.status as Exclude<AccessStatus, "guest">,
    role: request.role as UserRole,
    userType: request.userType as UserType,
    plan: request.plan as PlanName,
    loginIdentifier: request.loginIdentifier || request.email || request.mobile,
    credentialHash: request.credentialHash || undefined,
    tempPin: request.tempPin || undefined,
    mustChangeCredentials: request.mustChangeCredentials,
    tempCredentialsIssuedAt: isoDate(request.tempCredentialsIssuedAt),
    approvedAt: isoDate(request.approvedAt),
    approvedBy: request.approvedBy || undefined,
    lastLoginAt: isoDate(request.lastLoginAt),
    canDownloadMaterials: request.canDownloadMaterials,
    canUploadMaterials: request.canUploadMaterials,
    canUseAI: request.canUseAI,
    canUseOCR: request.canUseOCR,
    canImportFromDrive: request.canImportFromDrive,
    canIndexMaterials: request.canIndexMaterials,
    maxChildren: request.maxChildren,
    dailyAiLimit: request.dailyAiLimit,
    uploadLimit: request.uploadLimit,
    ocrLimit: request.ocrLimit,
    visualLessonLimit: request.visualLessonLimit,
    quizGenerationLimit: request.quizGenerationLimit,
    expiryDate: isoDate(request.expiryDate),
    notes: request.adminNotes || "",
    createdAt: isoDate(request.createdAt),
    updatedAt: isoDate(request.updatedAt),
  });
}

function requestPatchToPrisma(patch: Partial<AccessRequest>) {
  return {
    status: patch.status,
    role: patch.role,
    userType: patch.userType,
    plan: patch.plan,
    loginIdentifier: patch.loginIdentifier,
    credentialHash: patch.credentialHash,
    tempPin: patch.tempPin,
    mustChangeCredentials: patch.mustChangeCredentials,
    tempCredentialsIssuedAt: optionalDate(patch.tempCredentialsIssuedAt),
    approvedAt: optionalDate(patch.approvedAt),
    approvedBy: patch.approvedBy,
    lastLoginAt: optionalDate(patch.lastLoginAt),
    expiryDate: optionalDate(patch.expiryDate),
    adminNotes: patch.notes,
    state: patch.state,
    r1Language: patch.r1Language,
    r2Language: patch.r2Language,
    r3Language: patch.r3Language,
    regionalLanguage: patch.regionalLanguage,
    selectedLanguages: parseJson(patch.selectedLanguages),
    submittedSubjects: parseJson(patch.submittedSubjects),
    cbseLanguageRuleWarning: patch.cbseLanguageRuleWarning,
    cbseLanguageValidationStatus: patch.cbseLanguageValidationStatus,
    canDownloadMaterials: patch.canDownloadMaterials,
    canUploadMaterials: patch.canUploadMaterials,
    canUseAI: patch.canUseAI,
    canUseOCR: patch.canUseOCR,
    canImportFromDrive: patch.canImportFromDrive,
    canIndexMaterials: patch.canIndexMaterials,
    maxChildren: patch.maxChildren,
    dailyAiLimit: patch.dailyAiLimit,
    uploadLimit: patch.uploadLimit,
    ocrLimit: patch.ocrLimit,
    visualLessonLimit: patch.visualLessonLimit,
    quizGenerationLimit: patch.quizGenerationLimit,
  };
}

function userPatchToPrisma(patch: Partial<AccessRequest>) {
  return {
    status: patch.status,
    role: patch.role,
    userType: patch.userType,
    plan: patch.plan,
    loginIdentifier: patch.loginIdentifier,
    credentialHash: patch.credentialHash,
    tempPin: patch.tempPin,
    mustChangeCredentials: patch.mustChangeCredentials,
    approvedAt: optionalDate(patch.approvedAt),
    approvedBy: patch.approvedBy,
    lastLoginAt: optionalDate(patch.lastLoginAt),
    canDownloadMaterials: patch.canDownloadMaterials,
    canUploadMaterials: patch.canUploadMaterials,
    canUseAI: patch.canUseAI,
    canUseOCR: patch.canUseOCR,
    canImportFromDrive: patch.canImportFromDrive,
    canIndexMaterials: patch.canIndexMaterials,
    dailyAiLimit: patch.dailyAiLimit,
    uploadLimit: patch.uploadLimit,
  };
}

async function ensurePostgresFamilyAdmin() {
  await prisma.user.upsert({
    where: { id: "family-admin" },
    update: {},
    create: {
      id: "family-admin",
      email: "admin@kids-ai-teacher.local",
      name: "Family Admin",
      role: "admin",
      userType: "internalFamily",
      status: "active",
      plan: "family",
      loginIdentifier: "admin@kids-ai-teacher.local",
      credentialHash: "000000",
      mustChangeCredentials: false,
      approvedAt: new Date(),
      approvedBy: "system",
      canDownloadMaterials: true,
      canUploadMaterials: true,
      canUseAI: true,
      canUseOCR: true,
      canImportFromDrive: true,
      canIndexMaterials: true,
      dailyAiLimit: 500,
      uploadLimit: 500,
    },
  });
}

async function upsertPostgresAccess(request: AccessRequest) {
  if (request.id === "family-admin" || request.role === "admin") {
    await prisma.user.upsert({
      where: { id: request.id },
      update: userPatchToPrisma(request),
      create: {
        id: request.id,
        email: request.email || null,
        mobile: request.mobile || null,
        name: request.parentName,
        role: request.role,
        userType: request.userType,
        status: request.status,
        plan: request.plan,
        loginIdentifier: request.loginIdentifier,
        credentialHash: request.credentialHash,
        tempPin: request.tempPin,
        mustChangeCredentials: request.mustChangeCredentials,
        approvedAt: optionalDate(request.approvedAt),
        approvedBy: request.approvedBy,
        lastLoginAt: optionalDate(request.lastLoginAt),
        dailyAiLimit: request.dailyAiLimit,
        uploadLimit: request.uploadLimit,
        canDownloadMaterials: request.canDownloadMaterials,
        canUploadMaterials: request.canUploadMaterials,
        canUseAI: request.canUseAI,
        canUseOCR: request.canUseOCR,
        canImportFromDrive: request.canImportFromDrive,
        canIndexMaterials: request.canIndexMaterials,
      },
    });
    return;
  }

  await prisma.accessRequest.upsert({
    where: { id: request.id },
    update: requestPatchToPrisma(request),
    create: {
      id: request.id,
      parentName: request.parentName,
      email: request.email,
      mobile: request.mobile,
      state: request.state,
      city: request.city,
      preferredLanguage: request.preferredLanguage,
      childName: request.childName,
      grade: request.grade,
      board: request.board,
      preferredExplanationLanguage: request.explanationLanguage,
      r1Language: request.r1Language,
      r2Language: request.r2Language,
      r3Language: request.r3Language,
      regionalLanguage: request.regionalLanguage,
      selectedLanguages: parseJson(request.selectedLanguages),
      submittedSubjects: parseJson(request.submittedSubjects),
      cbseLanguageRuleWarning: request.cbseLanguageRuleWarning,
      cbseLanguageValidationStatus: request.cbseLanguageValidationStatus,
      weakSubjects: request.weakSubjects,
      learningGoal: request.learningGoal,
      status: request.status,
      role: request.role,
      userType: request.userType,
      plan: request.plan,
      loginIdentifier: request.loginIdentifier,
      credentialHash: request.credentialHash,
      tempPin: request.tempPin,
      mustChangeCredentials: request.mustChangeCredentials,
      tempCredentialsIssuedAt: optionalDate(request.tempCredentialsIssuedAt),
      approvedAt: optionalDate(request.approvedAt),
      approvedBy: request.approvedBy,
      lastLoginAt: optionalDate(request.lastLoginAt),
      expiryDate: optionalDate(request.expiryDate),
      adminNotes: request.notes,
      canDownloadMaterials: request.canDownloadMaterials,
      canUploadMaterials: request.canUploadMaterials,
      canUseAI: request.canUseAI,
      canUseOCR: request.canUseOCR,
      canImportFromDrive: request.canImportFromDrive,
      canIndexMaterials: request.canIndexMaterials,
      maxChildren: request.maxChildren,
      dailyAiLimit: request.dailyAiLimit,
      uploadLimit: request.uploadLimit,
      ocrLimit: request.ocrLimit,
      visualLessonLimit: request.visualLessonLimit,
      quizGenerationLimit: request.quizGenerationLimit,
    },
  });
}

async function upsertApprovedUser(request: Awaited<ReturnType<typeof prisma.accessRequest.findUnique>> & {}) {
  if (!request) throw new Error("Missing access request.");
  const submittedSubjects = normalizeSubmittedSubjects(request.submittedSubjects);
  const user = await prisma.user.upsert({
    where: { email: request.email },
    update: {
      name: request.parentName,
      mobile: request.mobile || null,
      role: request.role,
      userType: request.userType,
      status: request.status,
      plan: request.plan,
      loginIdentifier: request.loginIdentifier || request.email,
      credentialHash: request.credentialHash,
      tempPin: request.tempPin,
      mustChangeCredentials: request.mustChangeCredentials,
      approvedAt: request.approvedAt,
      approvedBy: request.approvedBy,
      dailyAiLimit: request.dailyAiLimit,
      uploadLimit: request.uploadLimit,
      canDownloadMaterials: request.canDownloadMaterials,
      canUploadMaterials: request.canUploadMaterials,
      canUseAI: request.canUseAI,
      canUseOCR: request.canUseOCR,
      canImportFromDrive: request.canImportFromDrive,
      canIndexMaterials: request.canIndexMaterials,
    },
    create: {
      email: request.email,
      mobile: request.mobile || null,
      name: request.parentName,
      role: request.role,
      userType: request.userType,
      status: request.status,
      plan: request.plan,
      loginIdentifier: request.loginIdentifier || request.email,
      credentialHash: request.credentialHash,
      tempPin: request.tempPin,
      mustChangeCredentials: request.mustChangeCredentials,
      approvedAt: request.approvedAt,
      approvedBy: request.approvedBy,
      dailyAiLimit: request.dailyAiLimit,
      uploadLimit: request.uploadLimit,
      canDownloadMaterials: request.canDownloadMaterials,
      canUploadMaterials: request.canUploadMaterials,
      canUseAI: request.canUseAI,
      canUseOCR: request.canUseOCR,
      canImportFromDrive: request.canImportFromDrive,
      canIndexMaterials: request.canIndexMaterials,
    },
  });

  const existingChild = await prisma.child.findFirst({ where: { userId: user.id, name: request.childName } });
  const childData = {
    userId: user.id,
    name: request.childName,
    grade: request.grade,
    classNumber: request.classNumber,
    board: request.board,
    preferredLanguage: request.preferredExplanationLanguage,
    r1Language: request.r1Language,
    r2Language: request.r2Language,
    r3Language: request.r3Language,
    regionalLanguage: request.regionalLanguage,
    selectedLanguages: parseJson(request.selectedLanguages),
    submittedSubjects: parseJson(request.submittedSubjects),
    cbseLanguageRuleWarning: request.cbseLanguageRuleWarning,
    cbseLanguageValidationStatus: request.cbseLanguageValidationStatus,
    weakSubjects: request.weakSubjects,
    learningGoal: request.learningGoal,
  };
  let child;
  if (existingChild) {
    child = await prisma.child.update({ where: { id: existingChild.id }, data: childData });
  } else {
    child = await prisma.child.create({
      data: childData,
    });
  }

  await prisma.studentSubject.deleteMany({
    where: {
      OR: [{ accessRequestId: request.id }, { userId: user.id, childId: child.id }],
    },
  });
  if (submittedSubjects.length) {
    await prisma.studentSubject.createMany({
      data: submittedSubjects.map((subject) => ({
        userId: user.id,
        childId: child.id,
        accessRequestId: request.id,
        subjectName: subject.subjectName,
        subjectType: subject.subjectType,
        languageRole: subject.languageRole,
        language: subject.language,
        publisher: subject.publisher,
        bookTitle: subject.bookTitle,
        medium: subject.medium,
        autoDownloadAllowed: subject.autoDownloadAllowed,
        sourceStatus: subject.sourceStatus,
      })),
    });
  }

  return user;
}

export function generateTemporaryPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function mergeSeed(requests: Partial<AccessRequest>[]) {
  const withoutSeed = requests.filter((request) => request.id !== "family-admin");
  return [...seedRequests, ...withoutSeed.map(migrateAccessRequest)];
}

function migrateAccessRequest(request: Partial<AccessRequest>): AccessRequest {
  const now = new Date().toISOString();
  const status = request.status || "pending";
  const plan = request.plan || (status === "trial" ? "trial" : status === "active" ? "basic" : "demo");
  const internal = request.id === "family-admin" || request.role === "admin";
  return {
    id: request.id || randomUUID(),
    parentName: request.parentName || "Parent",
    email: request.email || "",
    mobile: request.mobile || "",
    state: request.state || "",
    city: request.city || "",
    preferredLanguage: request.preferredLanguage || "English",
    childName: request.childName || "",
    grade: request.grade || "",
    board: request.board || "CBSE",
    explanationLanguage: request.explanationLanguage || "English",
    r1Language: request.r1Language || "",
    r2Language: request.r2Language || "",
    r3Language: request.r3Language || "",
    regionalLanguage: request.regionalLanguage || "",
    selectedLanguages: request.selectedLanguages || "",
    submittedSubjects: request.submittedSubjects || "",
    cbseLanguageRuleWarning: request.cbseLanguageRuleWarning || "",
    cbseLanguageValidationStatus: request.cbseLanguageValidationStatus || "",
    weakSubjects: request.weakSubjects || "",
    learningGoal: request.learningGoal || "",
    status,
    role: request.role || "parent",
    userType: request.userType || (internal ? "internalFamily" : "externalUser"),
    plan,
    loginIdentifier: request.loginIdentifier || request.email || request.mobile || "",
    credentialHash: request.credentialHash,
    tempPin: request.tempPin,
    mustChangeCredentials: request.mustChangeCredentials ?? (!internal && (status === "trial" || status === "active") && !request.credentialHash),
    tempCredentialsIssuedAt: request.tempCredentialsIssuedAt,
    approvedAt: request.approvedAt,
    approvedBy: request.approvedBy,
    lastLoginAt: request.lastLoginAt,
    canDownloadMaterials: request.canDownloadMaterials ?? internal,
    canUploadMaterials: request.canUploadMaterials ?? (internal || status === "trial" || status === "active"),
    canUseAI: request.canUseAI ?? (internal || status === "trial" || status === "active"),
    canUseOCR: request.canUseOCR ?? internal,
    canImportFromDrive: request.canImportFromDrive ?? internal,
    canIndexMaterials: request.canIndexMaterials ?? internal,
    maxChildren: request.maxChildren || (internal ? 6 : 1),
    dailyAiLimit: request.dailyAiLimit || (internal ? 500 : status === "trial" ? 20 : status === "active" ? 100 : 3),
    uploadLimit: request.uploadLimit || (internal ? 500 : status === "trial" ? 10 : status === "active" ? 50 : 0),
    ocrLimit: request.ocrLimit || (internal ? 150 : 0),
    visualLessonLimit: request.visualLessonLimit || (internal ? 100 : status === "trial" ? 5 : status === "active" ? 20 : 2),
    quizGenerationLimit: request.quizGenerationLimit || (internal ? 100 : status === "trial" ? 5 : status === "active" ? 20 : 1),
    expiryDate: request.expiryDate,
    notes: request.notes || "",
    createdAt: request.createdAt || now,
    updatedAt: request.updatedAt || now,
  };
}
