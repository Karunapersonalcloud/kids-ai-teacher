import type { AccessRequest } from "@/lib/access-store";

export type LoginInstructions = {
  loginUrl: string;
  loginIdentifier: string;
  temporaryPin: string;
  planLabel: string;
  children: string[];
};

export function buildLoginInstructions(request: AccessRequest): LoginInstructions {
  const baseUrl = process.env.APP_BASE_URL || "https://conceptkid.in";
  return {
    loginUrl: `${baseUrl.replace(/\/$/, "")}/login`,
    loginIdentifier: request.email || request.mobile,
    temporaryPin: request.tempPin || "",
    planLabel: request.status === "trial" ? "Trial" : request.status === "active" ? "Full Access" : request.plan,
    children: [`${request.childName} - ${request.grade} - ${request.board}`],
  };
}

export function approvalEmailSubject() {
  return "ConceptKid access approved - login instructions";
}

export function approvalEmailText(parentName: string, instructions: LoginInstructions) {
  return `Hello ${parentName},

Your ConceptKid access has been approved.

Login here:
${instructions.loginUrl}

Login ID:
${instructions.loginIdentifier}

Temporary PIN:
${instructions.temporaryPin}

For security, you will be asked to change this PIN after your first login.

Approved access:
${instructions.planLabel}

Child profile(s):
${instructions.children.map((child) => `- ${child}`).join("\n")}

Next steps:
1. Open the login link.
2. Enter your registered email/mobile and temporary PIN.
3. Create a new private PIN.
4. Complete your child's diagnostic test.
5. Start learning.

Important:
Textbooks from official sources may be imported automatically where available. For private publisher or school-provided textbooks, the parent must upload the textbook PDF, scanned pages, or chapter photos after login.

Regards,
ConceptKid Team`;
}

export function approvalEmailHtml(parentName: string, instructions: LoginInstructions) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color:#6d28d9;">ConceptKid access approved</h2>
      <p>Hello ${escapeHtml(parentName)},</p>
      <p>Your ConceptKid access has been approved.</p>
      <p><strong>Login here:</strong><br/><a href="${instructions.loginUrl}">${instructions.loginUrl}</a></p>
      <p><strong>Login ID:</strong><br/>${escapeHtml(instructions.loginIdentifier)}</p>
      <p><strong>Temporary PIN:</strong><br/><span style="font-size:20px;font-weight:700;">${escapeHtml(instructions.temporaryPin)}</span></p>
      <p>For security, you will be asked to change this PIN after your first login.</p>
      <p><strong>Approved access:</strong><br/>${escapeHtml(instructions.planLabel)}</p>
      <p><strong>Child profile(s):</strong></p>
      <ul>${instructions.children.map((child) => `<li>${escapeHtml(child)}</li>`).join("")}</ul>
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Open the login link.</li>
        <li>Enter your registered email/mobile and temporary PIN.</li>
        <li>Create a new private PIN.</li>
        <li>Complete your child's diagnostic test.</li>
        <li>Start learning.</li>
      </ol>
      <p><strong>Important:</strong> Textbooks from official sources may be imported automatically where available. For private publisher or school-provided textbooks, the parent must upload the textbook PDF, scanned pages, or chapter photos after login.</p>
      <p>Regards,<br/>ConceptKid Team</p>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });
}
