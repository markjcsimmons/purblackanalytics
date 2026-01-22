'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout, hasAccess } from '@/lib/auth';
import { PromotionInsights } from '@/components/promotion-insights';
import styles from '../dashboard.module.css';

interface SearchResult {
  searchEngine: string;
  query: string;
  timestamp: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
  brandsFound: string[];
}

export default function OverviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  useEffect(() => {
    // Check authentication from localStorage (client-side persistence)
    const storedSession = localStorage.getItem('authSession');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        // Sync with server-side session
        const serverSession = getSession();
        if (!serverSession || !serverSession.isAuthenticated) {
          // In a real app, you'd validate the stored session
          // For now, we'll just check if it exists
        }
        setSession(parsed);
      } catch (e) {
        localStorage.removeItem('authSession');
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setIsLoading(false);
    loadSearchResults();
  }, [router]);

  const loadSearchResults = async () => {
    setIsLoadingSearch(true);
    try {
      const response = await fetch('/api/overview-search?query=best shilajit');
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to load search results:', error);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authSession');
    router.push('/');
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const accessLevel = session?.accessLevel || null;
  const isFullAccess = accessLevel === 'full';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Overview</h1>
        <div className={styles.headerActions}>
          <span className={styles.accessBadge}>
            {isFullAccess ? 'Full Access' : 'Limited Access'}
          </span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <h2>Analytics Overview</h2>
          <p>Welcome to the overview page. This page is accessible to all authenticated users.</p>
          
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Users</h3>
              <p className={styles.statValue}>1,234</p>
            </div>
            <div className={styles.statCard}>
              <h3>Active Sessions</h3>
              <p className={styles.statValue}>567</p>
            </div>
            <div className={styles.statCard}>
              <h3>Revenue</h3>
              <p className={styles.statValue}>$45,678</p>
            </div>
            <div className={styles.statCard}>
              <h3>Growth</h3>
              <p className={styles.statValue}>+12.5%</p>
            </div>
          </div>

          {isFullAccess && (
            <div className={styles.navigation}>
              <h3>Full Access Navigation</h3>
              <div className={styles.navLinks}>
                <a href="/dashboard" className={styles.navLink}>Dashboard</a>
                <a href="/reports" className={styles.navLink}>Reports</a>
                <a href="/brand-tracking" className={styles.navLink}>Brand Tracking</a>
                <a href="/settings" className={styles.navLink}>Settings</a>
              </div>
            </div>
          )}

          {!isFullAccess && (
            <div className={styles.limitedNotice}>
              <p>You have limited access. Only the overview page is available.</p>
            </div>
          )}

          {/* Promotion Insights */}
          <div style={{ marginTop: '2rem' }}>
            <PromotionInsights />
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h2>AI Search Results: "best shilajit"</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Top 5 results from each AI search engine with source links
            </p>

            {isLoadingSearch ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Loading search results...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No search results available. Click refresh to load results.
                <button
                  onClick={loadSearchResults}
                  style={{
                    display: 'block',
                    margin: '1rem auto',
                    padding: '0.75rem 1.5rem',
                    background: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Refresh Results
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div style={{ marginBottom: '1rem', borderBottom: '2px solid #0070f3', paddingBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, color: '#0070f3', fontSize: '1.25rem' }}>
                        {result.searchEngine}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                      {result.brandsFound.length > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
                          Brands: {result.brandsFound.join(', ')}
                        </p>
                      )}
                    </div>

                    {result.topResults.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {result.topResults.map((link, linkIndex) => (
                          <div
                            key={linkIndex}
                            style={{
                              padding: '0.75rem',
                              background: '#f9f9f9',
                              borderRadius: '4px',
                              border: '1px solid #e0e0e0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{
                                background: '#0070f3',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                flexShrink: 0,
                              }}>
                                {link.position}
                              </span>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#0070f3',
                                  textDecoration: 'none',
                                  fontWeight: '500',
                                  fontSize: '0.95rem',
                                  flex: 1,
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                              >
                                {link.title}
                              </a>
                            </div>
                            {link.snippet && (
                              <p style={{
                                margin: '0.25rem 0 0 1.75rem',
                                fontSize: '0.875rem',
                                color: '#666',
                                lineHeight: '1.4',
                              }}>
                                {link.snippet.length > 150 ? `${link.snippet.substring(0, 150)}...` : link.snippet}
                              </p>
                            )}
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                marginTop: '0.5rem',
                                marginLeft: '1.75rem',
                                fontSize: '0.75rem',
                                color: '#999',
                                textDecoration: 'none',
                              }}
                            >
                              {new URL(link.url).hostname}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                        No source links found
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isLoadingSearch && searchResults.length > 0 && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button
                  onClick={loadSearchResults}
                  disabled={isLoadingSearch}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isLoadingSearch ? '#ccc' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoadingSearch ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {isLoadingSearch ? 'Refreshing...' : 'Refresh Results'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

