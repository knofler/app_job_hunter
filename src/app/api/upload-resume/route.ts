import { NextResponse } from 'next/server';

export async function POST() {
  // This is a mock. In production, parse the file and extract text.
  return NextResponse.json({ success: true, text: "Extracted resume text (mock)" });
}
