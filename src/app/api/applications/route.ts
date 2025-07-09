import { NextResponse } from 'next/server';

const applications: unknown[] = [];

export async function GET() {
  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const { jobId, jobTitle } = await req.json();
  const newApp = {
    id: Date.now(),
    jobId,
    jobTitle,
    status: "Applied",
    timestamp: new Date().toISOString(),
    timeline: [
      { status: "Applied", timestamp: new Date().toISOString() },
    ],
  };
  applications.push(newApp);
  return NextResponse.json(newApp);
}
