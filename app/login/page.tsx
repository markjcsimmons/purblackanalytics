'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to root login page immediately
    router.replace('/');
  }, [router]);

  // Return minimal content while redirecting
  return null;
}
