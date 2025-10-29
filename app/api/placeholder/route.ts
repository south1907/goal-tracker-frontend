import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'GoalTracker API',
    version: '1.0.0',
    endpoints: {
      goals: '/api/goals',
      logs: '/api/logs',
      stats: '/api/stats'
    },
    note: 'This is a placeholder API route. Server actions will be implemented here in the future.'
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    message: 'Placeholder POST endpoint',
    receivedData: body,
    note: 'Server actions will be implemented here for data persistence.'
  });
}
