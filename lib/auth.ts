// Authentication configuration
// Full access password should be set via environment variable NEXT_PUBLIC_FULL_ACCESS_PASSWORD
// If not set, defaults to 'Mark32246!' (change this default to your current password)
// Note: Using NEXT_PUBLIC_ prefix makes it available in the browser
// For better security, consider implementing server-side authentication
export const getFullAccessPassword = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_ variable
    return process.env.NEXT_PUBLIC_FULL_ACCESS_PASSWORD || 'Mark32246!';
  }
  // Server-side: prefer NEXT_PUBLIC_ but fallback to regular env var
  return process.env.NEXT_PUBLIC_FULL_ACCESS_PASSWORD || process.env.FULL_ACCESS_PASSWORD || 'Mark32246!';
};

export const PASSWORDS = {
  LIMITED_ACCESS: 'PB2026!',
} as const;

export type AccessLevel = 'full' | 'limited' | null;

export interface AuthSession {
  accessLevel: AccessLevel;
  isAuthenticated: boolean;
}

// Client-side authentication functions
export function authenticate(password: string): AuthSession | null {
  const fullAccessPassword = getFullAccessPassword();
  
  if (password === fullAccessPassword) {
    return {
      accessLevel: 'full',
      isAuthenticated: true,
    };
  } else if (password === PASSWORDS.LIMITED_ACCESS) {
    return {
      accessLevel: 'limited',
      isAuthenticated: true,
    };
  }
  return null;
}

export function getSession(): AuthSession | null {
  // Get session from localStorage (client-side)
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('authSession');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authSession');
  }
}

export function hasAccess(requiredLevel: 'full' | 'limited'): boolean {
  const session = getSession();
  
  if (!session || !session.isAuthenticated) {
    return false;
  }
  
  if (requiredLevel === 'full') {
    return session.accessLevel === 'full';
  }
  
  // Limited access can access limited pages
  return session.accessLevel === 'limited' || session.accessLevel === 'full';
}

