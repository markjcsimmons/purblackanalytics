'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout, hasAccess } from '@/lib/auth';
import styles from '../dashboard.module.css';

export default function ReportsPage() {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = localStorage.getItem('authSession');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
        
        if (!hasAccess('full')) {
          router.push('/overview');
          return;
        }
      } catch (e) {
        localStorage.removeItem('authSession');
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authSession');
    router.push('/');
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Reports</h1>
        <div className={styles.headerActions}>
          <span className={styles.accessBadge}>Full Access</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <nav className={styles.nav}>
        <a href="/overview" className={styles.navLink}>Overview</a>
        <a href="/dashboard" className={styles.navLink}>Dashboard</a>
        <a href="/reports" className={`${styles.navLink} ${styles.active}`}>Reports</a>
        <a href="/brand-tracking" className={styles.navLink}>Brand Tracking</a>
        <a href="/settings" className={styles.navLink}>Settings</a>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          <h2>Reports</h2>
          <p>Generate and view detailed reports. This page requires full access.</p>
        </div>
      </main>
    </div>
  );
}

