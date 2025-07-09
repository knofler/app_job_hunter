import { NextResponse } from 'next/server';

export async function GET() {
  // Mocked suggested actions
  return NextResponse.json([
    { id: 1, text: 'Complete skill assessment for Python' },
    { id: 2, text: 'Update your LinkedIn profile link' },
    { id: 3, text: 'Add recent project to resume' },
  ]);
}
