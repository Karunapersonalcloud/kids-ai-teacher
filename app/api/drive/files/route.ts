import { listDriveFiles } from "@/lib/google-drive";
import { getRequestAccess } from "@/lib/request-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const result = await listDriveFiles();
  const access = await getRequestAccess(request);
  if (access.userType !== "internalFamily" && "files" in result) {
    return Response.json({
      ...result,
      files: result.files.map((file) => {
        const sanitized = { ...file };
        delete sanitized.webViewLink;
        return sanitized;
      }),
      notice: "Drive file links are hidden for this account. Ask admin to import approved materials.",
    });
  }
  return Response.json(result);
}
