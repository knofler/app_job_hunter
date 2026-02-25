import { NextRequest } from "next/server";
import { proxyProjects } from "../../../_proxy";
type P = { params: Promise<{ projectId: string; resumeId: string }> };
export async function DELETE(_req: NextRequest, { params }: P) {
  const { projectId, resumeId } = await params;
  return proxyProjects(_req, `/${projectId}/resumes/${resumeId}`, "DELETE");
}
