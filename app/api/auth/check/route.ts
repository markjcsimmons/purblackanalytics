import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type AccessLevel = 'full' | 'limited';

export async function GET(request: NextRequest) {
  const isAuthenticated = request.cookies.get('auth_token')?.value === 'authenticated';
  const accessLevel = request.cookies.get('access_level')?.value as AccessLevel | undefined;
  
  return NextResponse.json({ 
    authenticated: isAuthenticated,
    accessLevel: isAuthenticated ? (accessLevel || 'full') : null
  });
}
