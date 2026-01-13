'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout, hasAccess } from '@/lib/auth';
import { BrandRanking, SearchResult } from '@/lib/brandTracker';
import styles from '../dashboard.module.css';

interface TrackingState {
  query: string;
  isLoading: boolean;
  results: SearchResult[];
  rankings: BrandRanking[];
  error: string | null;
  perplexityApiKey: string;
  openaiApiKey: string;
  enabledEngines: string[];
}

export default function BrandTrackingPage() {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<TrackingState>({
    query: 'best shilajit brands',
    isLoading: false,
    results: [],
    rankings: [],
    error: null,
    perplexityApiKey: '',
    openaiApiKey: '',
    enabledEngines: ['perplexity', 'google', 'bing'],
  });

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
    loadExistingResults();
  }, [router]);

  const loadExistingResults = async () => {
    try {
      const response = await fetch('/api/brand-tracking');
      const data = await response.json();
      if (data.success) {
        setState(prev => ({
          ...prev,
          results: data.results || [],
          rankings: data.rankings || [],
        }));
      }
    } catch (error) {
      console.error('Failed to load results:', error);
    }
  };

  const handleSearch = async () => {
    if (!state.query.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a search query' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/brand-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: state.query,
          perplexityApiKey: state.perplexityApiKey || undefined,
          openaiApiKey: state.openaiApiKey || undefined,
          enabledEngines: state.enabledEngines,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          results: [...prev.results, ...data.results],
          rankings: data.rankings,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.error || 'Search failed',
          isLoading: false,
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to perform search',
        isLoading: false,
      }));
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>AI Search Brand Tracking</h1>
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
        <a href="/reports" className={styles.navLink}>Reports</a>
        <a href="/settings" className={styles.navLink}>Settings</a>
        <a href="/brand-tracking" className={`${styles.navLink} ${styles.active}`}>
          Brand Tracking
        </a>
      </nav>

      <main className={styles.main}>
        <div className={styles.content}>
          <div style={{ marginBottom: '2rem' }}>
            <h2>Track Brand Rankings in AI Search Results</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Query multiple AI search engines to see which shilajit brands are ranking well.
            </p>

            <div style={{ 
              background: '#f5f5f5', 
              padding: '1.5rem', 
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Search Query:
                </label>
                <input
                  type="text"
                  value={state.query}
                  onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
                  placeholder="e.g., best shilajit brands, top shilajit products"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Enabled Search Engines:
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['perplexity', 'google', 'bing', 'chatgpt'].map((engine) => (
                    <label key={engine} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={state.enabledEngines.includes(engine)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setState(prev => ({
                              ...prev,
                              enabledEngines: [...prev.enabledEngines, engine],
                            }));
                          } else {
                            setState(prev => ({
                              ...prev,
                              enabledEngines: prev.enabledEngines.filter(e => e !== engine),
                            }));
                          }
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{engine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Perplexity API Key (optional):
                </label>
                <input
                  type="password"
                  value={state.perplexityApiKey}
                  onChange={(e) => setState(prev => ({ ...prev, perplexityApiKey: e.target.value }))}
                  placeholder="Leave empty for web scraping (may be limited)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  OpenAI API Key (optional, for ChatGPT):
                </label>
                <input
                  type="password"
                  value={state.openaiApiKey}
                  onChange={(e) => setState(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                  placeholder="Required for ChatGPT queries"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                />
              </div>

              {state.error && (
                <div style={{
                  background: '#fee',
                  color: '#c33',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                }}>
                  {state.error}
                </div>
              )}

              <button
                onClick={handleSearch}
                disabled={state.isLoading}
                style={{
                  background: state.isLoading ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  borderRadius: '4px',
                  cursor: state.isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {state.isLoading ? 'Searching...' : 'Search AI Engines'}
              </button>
            </div>

            {state.rankings.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3>Brand Rankings</h3>
                <div style={{
                  overflowX: 'auto',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Brand
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Total Mentions
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Avg Position
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Search Engines
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                          Last Seen
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.rankings.map((ranking, index) => (
                        <tr key={ranking.brand} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                            {index + 1}. {ranking.brand}
                          </td>
                          <td style={{ padding: '1rem' }}>{ranking.totalMentions}</td>
                          <td style={{ padding: '1rem' }}>
                            {ranking.averagePosition.toFixed(1)}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {ranking.searchEngines.join(', ')}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {new Date(ranking.lastSeen).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {state.results.length > 0 && (
              <div>
                <h3>Recent Search Results ({state.results.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {state.results.slice(-10).reverse().map((result, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong>{result.searchEngine}</strong>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem', color: '#666' }}>
                        Query: "{result.query}"
                      </div>
                      {result.brands.length > 0 ? (
                        <div>
                          <strong>Brands found:</strong>{' '}
                          {result.brands.map(b => b.brand).join(', ')}
                        </div>
                      ) : (
                        <div style={{ color: '#999' }}>No brands detected</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
