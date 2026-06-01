import fs from "fs/promises";
import path from "path";
import { Client } from "pg";

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizeMobile(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function normalizeLoginIdentifier(value = "") {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return trimmed.includes("@") ? normalizeEmail(trimmed) : normalizeMobile(trimmed);
}

function statusPriority(status = "") {
  if (status === "active") return 6;
  if (status === "trial") return 5;
  if (status === "pending") return 4;
  if (status === "expired") return 3;
  if (status === "blocked") return 2;
  if (status === "rejected") return 1;
  return 0;
}

function timeValue(value) {
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareRecords(a, b) {
  const statusDiff = statusPriority(b.status) - statusPriority(a.status);
  if (statusDiff !== 0) return statusDiff;
  const updatedDiff = timeValue(b.updatedAt) - timeValue(a.updatedAt);
  if (updatedDiff !== 0) return updatedDiff;
  const createdDiff = timeValue(b.createdAt) - timeValue(a.createdAt);
  if (createdDiff !== 0) return createdDiff;
  return String(b.id).localeCompare(String(a.id));
}

function identityKeys(record) {
  const keys = [];
  const email = normalizeEmail(record.email);
  const mobile = normalizeMobile(record.mobile);
  const loginIdentifier = normalizeLoginIdentifier(record.loginIdentifier);
  if (email) keys.push(`email:${email}`);
  if (mobile) keys.push(`mobile:${mobile}`);
  if (loginIdentifier) keys.push(`login:${loginIdentifier}`);
  return keys;
}

function groupDuplicates(records) {
  const parent = records.map((_, index) => index);
  const find = (index) => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    while (parent[index] !== index) {
      const next = parent[index];
      parent[index] = root;
      index = next;
    }
    return root;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };

  const seenByKey = new Map();
  records.forEach((record, index) => {
    identityKeys(record).forEach((key) => {
      if (!seenByKey.has(key)) {
        seenByKey.set(key, index);
      } else {
        union(index, seenByKey.get(key));
      }
    });
  });

  const groups = new Map();
  records.forEach((_, index) => {
    const root = find(index);
    const list = groups.get(root) || [];
    list.push(index);
    groups.set(root, list);
  });

  return Array.from(groups.values())
    .map((indices) => indices.map((index) => records[index]).sort(compareRecords))
    .filter((group) => group.length > 1);
}

function normalizeRow(record, source) {
  return {
    source,
    id: record.id,
    email: record.email || "",
    mobile: record.mobile || "",
    loginIdentifier: record.loginIdentifier || record.email || record.mobile || "",
    status: record.status || "pending",
    plan: record.plan || "demo",
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  };
}

async function loadRecordsFromStorage() {
  const storageFile = path.join(process.cwd(), "storage", "access-requests.json");
  const raw = await fs.readFile(storageFile, "utf8");
  const parsed = JSON.parse(raw);
  return parsed.map((record) => normalizeRow(record, "accessRequest"));
}

async function loadRecordsFromPostgres(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const requestRows = await client.query(
      'SELECT id, email, mobile, "loginIdentifier", status, plan, "updatedAt", "createdAt" FROM "AccessRequest"'
    );
    const userRows = await client.query('SELECT id, email, mobile, "loginIdentifier", status, plan, "updatedAt", "createdAt" FROM "User"');
    return [
      ...requestRows.rows.map((row) => normalizeRow(row, "accessRequest")),
      ...userRows.rows.map((row) => normalizeRow(row, "user")),
    ];
  } finally {
    await client.end();
  }
}

async function loadRecords() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (connectionString) {
    try {
      return await loadRecordsFromPostgres(connectionString);
    } catch (error) {
      console.warn("Postgres read failed, falling back to local storage:", error.message || error);
    }
  }
  return await loadRecordsFromStorage();
}

async function main() {
  const records = await loadRecords();
  const duplicateGroups = groupDuplicates(records);

  console.log(`Total records scanned: ${records.length}`);
  console.log(`Duplicate groups found: ${duplicateGroups.length}`);

  if (!duplicateGroups.length) {
    console.log("No duplicate identity groups detected.");
    return;
  }

  duplicateGroups.forEach((group, index) => {
    const canonical = group[0];
    const duplicates = group.slice(1);
    const identifiers = Array.from(new Set(group.flatMap(identityKeys))).sort();

    console.log(`\n[Group ${index + 1}]`);
    console.log(`Identifiers: ${identifiers.join(", ")}`);
    console.log(`Keep (canonical): ${canonical.source}:${canonical.id} status=${canonical.status} updatedAt=${canonical.updatedAt}`);
    duplicates.forEach((record) => {
      console.log(`Candidate duplicate: ${record.source}:${record.id} status=${record.status} updatedAt=${record.updatedAt}`);
    });
    console.log("Suggested action: keep canonical above; exclude duplicates from admin list or mark archived/duplicate only after manual review.");
  });
}

main().catch((error) => {
  console.error("Failed to generate duplicate access report:", error);
  process.exitCode = 1;
});
