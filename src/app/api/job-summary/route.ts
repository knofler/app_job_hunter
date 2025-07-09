import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Mock LLM summary
  const { tone } = await req.json();
  let summary = "This is a concise summary of the job description.";
  if (tone === "Simplify") summary = "A simple version of the job summary.";
  return NextResponse.json({ summary });
}
