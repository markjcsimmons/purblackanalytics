import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';

const HASHED_PASSWORD = '$2a$10$r8qZ8K9L4J5N7M6P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K'; // Pre-hashed version of Mark32246!

// For simplicity, we'll use a direct comparison since we're using a single password
// In production, you'd hash the password and compare with bcrypt
const CORRECT_PASSWORD = process.env.SITE_PASSWORD || 'Mark32246!';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Simple password comparison (in production, use bcrypt.compare)
    if (password === CORRECT_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set authentication cookie (expires in 7 days)
      response.cookies.set('auth_token', 'authenticated', {
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
