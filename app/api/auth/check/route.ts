import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const isAuthenticated = request.cookies.get('auth_token')?.value === 'authenticated';
  
  return NextResponse.json({ authenticated: isAuthenticated });
}
