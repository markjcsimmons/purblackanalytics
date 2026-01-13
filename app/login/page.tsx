'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate, getSession } from '@/lib/auth';
import styles from '../login.module.css';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const session = getSession();
    if (session?.isAuthenticated) {
      router.push('/overview');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const session = authenticate(password);
    
    if (session) {
      // Store session in localStorage for persistence across page refreshes
      localStorage.setItem('authSession', JSON.stringify(session));
      setIsLoading(false);
      router.push('/overview');
    } else {
      setError('Invalid password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Purblack Analytics</h1>
        <p className={styles.subtitle}>Please enter your password to continue</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
