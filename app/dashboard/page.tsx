'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout, hasAccess } from '@/lib/auth';
import styles from '../dashboard.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const storedSession = localStorage.getItem('authSession');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
        
        // Check if user has full access
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
        <h1>Dashboard</h1>
        <div className={styles.headerActions}>
          <span className={styles.accessBadge}>Full Access</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <nav className={styles.nav}>
        <a href="/overview" className={styles.navLink}>Overview</a>
        <a href="/dashboard" className={`${styles.navLink} ${styles.active}`}>Dashboard</a>
        <a href="/reports" className={styles.navLink}>Reports</a>
        <a href="/brand-tracking" className={styles.navLink}>Brand Tracking</a>
        <a href="/settings" className={styles.navLink}>Settings</a>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          <h2>Full Access Dashboard</h2>
          <p>This page requires full access. You can see detailed analytics and manage all features here.</p>
          
          <div className={styles.dashboardGrid}>
            <div className={styles.dashboardCard}>
              <h3>Advanced Analytics</h3>
              <p>Detailed metrics and insights available only to full access users.</p>
            </div>
            <div className={styles.dashboardCard}>
              <h3>User Management</h3>
              <p>Manage users, permissions, and access levels.</p>
            </div>
            <div className={styles.dashboardCard}>
              <h3>System Configuration</h3>
              <p>Configure system settings and preferences.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

