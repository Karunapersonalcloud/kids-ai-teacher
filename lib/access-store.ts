import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { PlanName } from "./billing-types";
import type { AccessStatus, UserRole } from "./access-control";

export type UserType = "internalFamily" | "externalUser";

export type AccessRequest = {
  id: string;
  parentName: string;
  email: string;
  mobile: string;
  city: string;
  preferredLanguage: string;
  childName: string;
  grade: string;
  board: "CBSE" | "State" | "ICSE" | "Other";
  explanationLanguage: string;
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
    city: "",
    preferredLanguage: "English",
    childName: "Jayadeep and Harini",
    grade: "Family",
    board: "CBSE",
    explanationLanguage: "English",
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
  await fs.mkdir(accessRoot, { recursive: true });
  await fs.writeFile(accessPath, JSON.stringify(mergeSeed(requests), null, 2), "utf8");
}

export async function createAccessRequest(
  input: Pick<
    AccessRequest,
    "parentName" | "email" | "mobile" | "city" | "preferredLanguage" | "childName" | "grade" | "board" | "explanationLanguage" | "weakSubjects" | "learningGoal"
  >
) {
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
  const requests = await readAccessRequests();
  const next = requests.map((request) => (request.id === id ? { ...request, ...patch, updatedAt: new Date().toISOString() } : request));
  await writeAccessRequests(next);
  return next.find((request) => request.id === id);
}

export async function findAccessByEmail(email: string) {
  const requests = await readAccessRequests();
  return requests.find((request) => request.email.toLowerCase() === email.toLowerCase());
}

export async function findAccessByIdentifier(identifier: string) {
  const normalized = identifier.toLowerCase();
  const requests = await readAccessRequests();
  return requests.find((request) => request.email.toLowerCase() === normalized || request.mobile === identifier || request.loginIdentifier.toLowerCase() === normalized);
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
    city: request.city || "",
    preferredLanguage: request.preferredLanguage || "English",
    childName: request.childName || "",
    grade: request.grade || "",
    board: request.board || "CBSE",
    explanationLanguage: request.explanationLanguage || "English",
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
