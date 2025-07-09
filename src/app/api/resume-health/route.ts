import { NextResponse } from 'next/server';

export async function GET() {
  // Mocked resume health data
  return NextResponse.json({
    score: 85,
    subScores: [
      { label: 'Keyword Optimization', value: 92 },
      { label: 'Skill Coverage', value: 80 },
      { label: 'Clarity & Formatting', value: 88 },
    ],
  });
}
