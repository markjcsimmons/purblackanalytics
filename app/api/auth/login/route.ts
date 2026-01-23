import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HASHED_PASSWORD = '$2a$10$r8qZ8K9L4J5N7M6P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K'; // Pre-hashed version of Mark32246!

// Password configuration
const FULL_ACCESS_PASSWORD = process.env.SITE_PASSWORD || 'Mark32246!';
const LIMITED_ACCESS_PASSWORD = 'PB2026!';

export type AccessLevel = 'full' | 'limited';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    let accessLevel: AccessLevel | null = null;

    // Check for full access password
    if (password === FULL_ACCESS_PASSWORD) {
      accessLevel = 'full';
    } 
    // Check for limited access password
    else if (password === LIMITED_ACCESS_PASSWORD) {
      accessLevel = 'limited';
    }

    if (accessLevel) {
      const response = NextResponse.json({ 
        success: true, 
        accessLevel 
      });
      
      // Set authentication cookie (expires in 7 days)
      response.cookies.set('auth_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      // Set access level cookie
      response.cookies.set('access_level', accessLevel, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
