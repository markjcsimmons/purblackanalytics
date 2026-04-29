'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataEntryForm } from '@/components/data-entry-form';
import { DataUpload } from '@/components/data-upload';
import { ShopifyReportsUpload } from '@/components/shopify-reports-upload';
import { GoogleDocsImport } from '@/components/google-docs-import';
import { PromotionsUpload } from '@/components/promotions-upload';
import { RevenueAnalysisChat } from '@/components/revenue-analysis-chat';
import { Modal } from '@/components/ui/modal';
import { MetricHistoryCharts, type MetricsHistoryPoint } from '@/components/metric-history-charts';
import { ChannelHistoryCharts } from '@/components/channel-history-charts';
import { getSession, logout } from '@/lib/auth';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Calendar,
  Sparkles,
  Store,
  Megaphone,
  Target,
  Instagram,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  formatCurrency, 
  formatNumber, 
  getMetricValue, 
  getFunnelMetricSum, 
  getTotalAddToCart,
  getComparisonFunnelMetric 
} from '@/lib/utils';

interface WeekData {
  week: any;
  overallMetrics: any[];
  marketingChannels: any[];
  funnelMetrics: any[];
  insights: any[];
  socialMediaMetrics?: any[];
}

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
  rawResponse?: string;
}

interface AISearchInsight {
  text: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
}

export default function Dashboard() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited' | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewSubTab, setOverviewSubTab] = useState<'deep-dive' | 'charts'>('deep-dive');
  const [comparisonData, setComparisonData] = useState<{
    previousWeek: any;
    sameWeekYearAgo: any;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('best shilajit');
  const [aiSearchInsights, setAiSearchInsights] = useState<AISearchInsight[]>([]);
  const [isGeneratingAISearchInsights, setIsGeneratingAISearchInsights] = useState(false);
  const [aiSearchInsightsError, setAiSearchInsightsError] = useState('');
  const [aiSearchWhyAnalysis, setAiSearchWhyAnalysis] = useState<any | null>(null);
  const [isGeneratingAISearchWhy, setIsGeneratingAISearchWhy] = useState(false);
  const [aiSearchWhyError, setAiSearchWhyError] = useState('');
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
  const [expandedSourceEngines, setExpandedSourceEngines] = useState<Set<string>>(new Set());
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistoryPoint[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [chartsError, setChartsError] = useState('');
  const [channelsHistory, setChannelsHistory] = useState<Record<string, MetricsHistoryPoint[]>>({});
  const [waterfallWeekStart, setWaterfallWeekStart] = useState<string | null>(null);
  const [revenueAnalysis, setRevenueAnalysis] = useState<string | null>(null);
  const [revenueAnalysisLoading, setRevenueAnalysisLoading] = useState(false);
  const [revenueAnalysisError, setRevenueAnalysisError] = useState('');
  const [revenueAnalysisContext, setRevenueAnalysisContext] = useState<any>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

  const fetchWeeks = async () => {
    try {
      const response = await fetch('/api/weeks');
      const data = await response.json();
      setWeeks(data.weeks);
      
      // Auto-select the most recent week
      if (data.weeks.length > 0 && !selectedWeekId) {
        setSelectedWeekId(data.weeks[0].id);
      }
    } catch (error) {
      console.error('Error fetching weeks:', error);
    }
  };

  const fetchWeekData = async (weekId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/weeks/${weekId}`);
      const data = await response.json();
      setWeekData(data);
      
      // Fetch comparison data for channels tab
      const comparisonResponse = await fetch(`/api/weeks/${weekId}?comparisons=true`);
      const comparisonResult = await comparisonResponse.json();
      if (comparisonResult.comparisons) {
        setComparisonData(comparisonResult.comparisons);
      }
    } catch (error) {
      console.error('Error fetching week data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchResults = async () => {
    setIsLoadingSearch(true);
    setAiSearchInsights([]);
    setAiSearchInsightsError('');
    setAiSearchWhyAnalysis(null);
    setAiSearchWhyError('');
    try {
      const response = await fetch(`/api/overview-search?query=${encodeURIComponent(searchQuery)}`);
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

  const generateAISearchInsights = async () => {
    if (!searchResults.length) {
      setAiSearchInsightsError('Please run a search first.');
      return;
    }
    setIsGeneratingAISearchInsights(true);
    setAiSearchInsightsError('');
    try {
      const response = await fetch('/api/ai-search-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          results: searchResults,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate insights (${response.status})`);
      }
      const data = await response.json();
      setAiSearchInsights(data.insights || []);
    } catch (error: any) {
      console.error('AI search insights error:', error);
      setAiSearchInsightsError(error.message || 'Failed to generate insights.');
    } finally {
      setIsGeneratingAISearchInsights(false);
    }
  };

  const generateAISearchWhy = async () => {
    if (!searchResults.length) {
      setAiSearchWhyError('Please run a search first.');
      return;
    }
    setIsGeneratingAISearchWhy(true);
    setAiSearchWhyError('');
    try {
      const response = await fetch('/api/ai-search-why', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          results: searchResults,
          brand: 'Pürblack',
          brandDomains: ['purblack.com'],
          brandAliases: ['Pürblack', 'Purblack', 'Pur black'],
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate why analysis (${response.status})`);
      }
      const data = await response.json();
      setAiSearchWhyAnalysis(data.analysis || null);
    } catch (error: any) {
      console.error('AI search why analysis error:', error);
      setAiSearchWhyError(error.message || 'Failed to generate why analysis.');
    } finally {
      setIsGeneratingAISearchWhy(false);
    }
  };

  const loadMetricsHistory = async () => {
    setIsLoadingCharts(true);
    setChartsError('');
    try {
      const res = await fetch('/api/metrics-history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to load metrics history (${res.status})`);
      setMetricsHistory(Array.isArray(data.history) ? data.history : []);
    } catch (e: any) {
      console.error('Metrics history load error:', e);
      setChartsError(e.message || 'Failed to load charts data');
    } finally {
      setIsLoadingCharts(false);
    }
  };

  const loadChannelsHistory = async () => {
    try {
      const res = await fetch('/api/channels-history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to load channel history (${res.status})`);
      setChannelsHistory(data.history && typeof data.history === 'object' ? data.history : {});
    } catch (e: any) {
      console.error('Channel history load error:', e);
    }
  };

  useEffect(() => {
    // Check access level from localStorage session
    const session = getSession();
    if (session?.isAuthenticated) {
      setAccessLevel(session.accessLevel || 'full');
    } else {
      window.location.href = '/login';
      return;
    }

    fetchWeeks();
    loadSearchResults();
    loadMetricsHistory();
    loadChannelsHistory();
  }, []);

  useEffect(() => {
    if (selectedWeekId) {
      fetchWeekData(selectedWeekId);
    }
  }, [selectedWeekId]);

  const handleUploadSuccess = async () => {
    await fetchWeeks();
    if (selectedWeekId) {
      await fetchWeekData(selectedWeekId);
    }
    loadMetricsHistory();
    loadChannelsHistory();
  };


  // Returns the 4-week slope for a metric from metricsHistory as a % per week.
  // Used to show trend direction on each overview stat card.
  const get4wkTrend = (metricKey: string): { pctPerWk: number; label: string; color: string } | null => {
    const sorted = [...metricsHistory].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
    const last4 = sorted.slice(-4).filter((p) => Object.prototype.hasOwnProperty.call(p.metrics, metricKey));
    if (last4.length < 2) return null;
    const vals = last4.map((p) => p.metrics[metricKey]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg === 0) return null;
    // Simple slope: (last - first) / (n - 1) weeks, normalised to % of avg
    const slope = (vals[vals.length - 1] - vals[0]) / (vals.length - 1);
    const pctPerWk = (slope / Math.abs(avg)) * 100;
    const arrow = pctPerWk > 0.5 ? '↑' : pctPerWk < -0.5 ? '↓' : '→';
    const sign = pctPerWk > 0 ? '+' : '';
    const label = `${arrow} ${sign}${pctPerWk.toFixed(1)}%/wk (4-wk)`;
    const color = pctPerWk > 0.5 ? 'text-emerald-700' : pctPerWk < -0.5 ? 'text-red-600' : 'text-slate-500';
    return { pctPerWk, label, color };
  };

  const renderMarkdownBold = (text: string) => {
    if (!text) return '';
    // Escape HTML first to prevent XSS
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    // Convert **text** to <strong>text</strong> and newlines to <br />
    return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const isHomepageUrl = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname || '/';
      const isRoot = path === '/' || path === '';
      const hasQueryOrHash = Boolean(u.search && u.search !== '?') || Boolean(u.hash);
      return isRoot && !hasQueryOrHash;
    } catch {
      return false;
    }
  };

  const getUrlLabel = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname && u.pathname !== '/' ? u.pathname : '/';
      return `${u.hostname}${path}`;
    } catch {
      return url;
    }
  };

  const getSocialMetric = (data: any, platform: string, contentType: string, metricName: string): number | null => {
    const arr = data?.socialMediaMetrics;
    if (!arr || !Array.isArray(arr)) return null;
    const match = arr.find(
      (m: any) =>
        m.platform === platform &&
        m.content_type === contentType &&
        m.metric_name === metricName
    );
    return match ? (match.metric_value as number) : null;
  };

  const formatChange = (current: number, previous: number | null) => {
    if (previous === null) return null;
    if (previous === 0) return current > 0 ? Infinity : 0;
    return ((current - previous) / previous) * 100;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Pürblack Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Marketing Intelligence Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              {weeks.length > 0 && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <Select
                      value={selectedWeekId?.toString()}
                      onValueChange={(value) => setSelectedWeekId(parseInt(value))}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select a week" />
                      </SelectTrigger>
                      <SelectContent>
                        {weeks.map((week) => (
                          <SelectItem key={week.id} value={week.id.toString()}>
                            {format(new Date(week.week_start_date), 'MMM d')} - {format(new Date(week.week_end_date), 'MMM d, yyyy')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {weeks.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">Viewing {weeks.length} week{weeks.length > 1 ? 's' : ''} of data</p>
                    )}
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch {
                    // ignore network/cold start issues; client-side logout still works
                  }
                  logout(); // clears localStorage auth session
                  window.location.href = '/login';
                }}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {accessLevel === 'limited' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-900">Limited Access:</span>
              <span className="text-sm text-amber-700">You can only view the Overview page.</span>
            </div>
          </div>
        )}
        <Tabs 
          value={activeTab}
          onValueChange={(value) => {
            // Prevent limited access users from switching to restricted tabs
            if (accessLevel === 'limited' && value !== 'overview') {
              return;
            }
            setActiveTab(value);
          }}
          className="space-y-6"
        >
          <TabsList className={`grid w-full ${accessLevel === 'limited' ? 'grid-cols-1' : 'grid-cols-2'} lg:w-[400px]`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {accessLevel === 'full' && (
              <>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="add-data">Add Data</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {weekData && (
              <>
                {/* HERO SECTION - Key Performance Indicators */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Revenue - Most Important */}
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-green-900">Total Revenue</CardTitle>
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        {formatCurrency(getMetricValue(weekData.overallMetrics, 'Revenue'))}
                      </div>
                      <p className="text-xs text-green-700 font-medium mb-1">
                        {getMetricValue(weekData.overallMetrics, 'Orders')} orders
                      </p>
                      {(() => {
                        const compDiscounts = getMetricValue(weekData.overallMetrics, 'Comp Discounts');
                        if (compDiscounts <= 0) return null;
                        const reported = getMetricValue(weekData.overallMetrics, 'Revenue');
                        const adjusted = reported + compDiscounts;
                        return (
                          <p className="text-xs text-amber-700 font-medium mb-1">
                            Adjusted: {formatCurrency(adjusted)}{' '}
                            <span className="text-amber-500 font-normal">(+{formatCurrency(compDiscounts)} comps)</span>
                          </p>
                        );
                      })()}
                      {comparisonData && (() => {
                        const currentValue = getMetricValue(weekData.overallMetrics, 'Revenue');
                        const prevWeekValue = comparisonData.previousWeek 
                          ? getMetricValue(comparisonData.previousWeek.overallMetrics, 'Revenue')
                          : null;
                        const yearAgoValue = comparisonData.sameWeekYearAgo 
                          ? getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Revenue')
                          : null;
                        const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                          ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                          : null;
                        const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                          ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                          : null;
                        const revTrend = get4wkTrend('Revenue');
                        return (
                          <div className="space-y-1 mt-2 pt-2 border-t border-green-200">
                            {prevWeekValue !== null && prevWeekChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600">vs. Last Week:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  prevWeekChange > 0 ? 'text-green-700' : prevWeekChange < 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(prevWeekChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {yearAgoValue !== null && yearAgoChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600">vs. Year Ago:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  yearAgoChange > 0 ? 'text-green-700' : yearAgoChange < 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(yearAgoChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {revTrend && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-green-100">
                                <span className="text-green-600">Trend:</span>
                                <span className={`font-semibold ${revTrend.color}`}>{revTrend.label}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Conversion Rate */}
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-blue-900">Conversion Rate</CardTitle>
                        <Percent className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                        {(getMetricValue(weekData.overallMetrics, 'Conversion Rate') || 0).toFixed(2)}%
                      </div>
                      <p className="text-xs text-blue-700 font-medium mb-2">
                        of {formatNumber(getMetricValue(weekData.overallMetrics, 'Total Sessions'))} sessions
                      </p>
                      {comparisonData && (() => {
                        const currentValue = getMetricValue(weekData.overallMetrics, 'Conversion Rate') || 0;
                        const prevWeekValue = comparisonData.previousWeek 
                          ? (getMetricValue(comparisonData.previousWeek.overallMetrics, 'Conversion Rate') || 0)
                          : null;
                        const yearAgoValue = comparisonData.sameWeekYearAgo 
                          ? (getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Conversion Rate') || 0)
                          : null;
                        const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                          ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                          : null;
                        const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                          ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                          : null;
                        const crTrend = get4wkTrend('Conversion Rate');
                        return (
                          <div className="space-y-1 mt-2 pt-2 border-t border-blue-200">
                            {prevWeekValue !== null && prevWeekChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600">vs. Last Week:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  prevWeekChange > 0 ? 'text-blue-700' : prevWeekChange < 0 ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(prevWeekChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {yearAgoValue !== null && yearAgoChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600">vs. Year Ago:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  yearAgoChange > 0 ? 'text-blue-700' : yearAgoChange < 0 ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                  {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(yearAgoChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {crTrend && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-100">
                                <span className="text-blue-600">Trend:</span>
                                <span className={`font-semibold ${crTrend.color}`}>{crTrend.label}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* AOV */}
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-purple-900">Avg Order Value</CardTitle>
                        <ShoppingCart className="h-5 w-5 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        {formatCurrency(getMetricValue(weekData.overallMetrics, 'AOV'))}
                      </div>
                      <p className="text-xs text-purple-700 font-medium mb-2">
                        per order
                      </p>
                      {comparisonData && (() => {
                        const currentValue = getMetricValue(weekData.overallMetrics, 'AOV');
                        const prevWeekValue = comparisonData.previousWeek 
                          ? getMetricValue(comparisonData.previousWeek.overallMetrics, 'AOV')
                          : null;
                        const yearAgoValue = comparisonData.sameWeekYearAgo 
                          ? getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'AOV')
                          : null;
                        const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                          ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                          : null;
                        const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                          ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                          : null;
                        const aovTrend = get4wkTrend('AOV');
                        return (
                          <div className="space-y-1 mt-2 pt-2 border-t border-purple-200">
                            {prevWeekValue !== null && prevWeekChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-purple-600">vs. Last Week:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  prevWeekChange > 0 ? 'text-purple-700' : prevWeekChange < 0 ? 'text-red-600' : 'text-purple-600'
                                }`}>
                                  {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(prevWeekChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {yearAgoValue !== null && yearAgoChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-purple-600">vs. Year Ago:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  yearAgoChange > 0 ? 'text-purple-700' : yearAgoChange < 0 ? 'text-red-600' : 'text-purple-600'
                                }`}>
                                  {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(yearAgoChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {aovTrend && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-100">
                                <span className="text-purple-600">Trend:</span>
                                <span className={`font-semibold ${aovTrend.color}`}>{aovTrend.label}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Sessions */}
                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-orange-900">Total Sessions</CardTitle>
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                        {formatNumber(getMetricValue(weekData.overallMetrics, 'Total Sessions'))}
                      </div>
                      <p className="text-xs text-orange-700 font-medium mb-2">
                        website visitors
                      </p>
                      {comparisonData && (() => {
                        const currentValue = getMetricValue(weekData.overallMetrics, 'Total Sessions');
                        const prevWeekValue = comparisonData.previousWeek 
                          ? getMetricValue(comparisonData.previousWeek.overallMetrics, 'Total Sessions')
                          : null;
                        const yearAgoValue = comparisonData.sameWeekYearAgo 
                          ? getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Total Sessions')
                          : null;
                        const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                          ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                          : null;
                        const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                          ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                          : null;
                        const sessTrend = get4wkTrend('Total Sessions');
                        return (
                          <div className="space-y-1 mt-2 pt-2 border-t border-orange-200">
                            {prevWeekValue !== null && prevWeekChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-orange-600">vs. Last Week:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  prevWeekChange > 0 ? 'text-orange-700' : prevWeekChange < 0 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(prevWeekChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {yearAgoValue !== null && yearAgoChange !== null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-orange-600">vs. Year Ago:</span>
                                <span className={`font-semibold flex items-center gap-1 ${
                                  yearAgoChange > 0 ? 'text-orange-700' : yearAgoChange < 0 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                  {Math.abs(yearAgoChange).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            {sessTrend && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-orange-100">
                                <span className="text-orange-600">Trend:</span>
                                <span className={`font-semibold ${sessTrend.color}`}>{sessTrend.label}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Overview workspace */}
                <Tabs value={overviewSubTab} onValueChange={(v) => setOverviewSubTab(v as any)} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm lg:w-[320px]">
                    <TabsTrigger
                      value="deep-dive"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                    >
                      Deep Dive
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai-search"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                    >
                      AI / Search
                    </TabsTrigger>
                    <TabsTrigger
                      value="charts"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow"
                    >
                      Charts
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="deep-dive" className="space-y-8">
                {/* CONVERSION FUNNEL - Detailed Breakdown */}
                <Card className="border-2 border-indigo-100">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Conversion Funnel</CardTitle>
                        <CardDescription>Track visitor journey from session to purchase</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {/* Sessions */}
                      <div className="relative">
                        <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200">
                          <div className="text-sm text-slate-600 mb-2">Sessions</div>
                          <div className="text-3xl font-bold text-slate-900">
                            {formatNumber(getMetricValue(weekData.overallMetrics, 'Total Sessions'))}
                          </div>
                          <div className="text-xs text-slate-500 mt-2 mb-2">Starting point</div>
                          {comparisonData && (() => {
                            const currentValue = getMetricValue(weekData.overallMetrics, 'Total Sessions');
                            const prevWeekValue = comparisonData.previousWeek 
                              ? getMetricValue(comparisonData.previousWeek.overallMetrics, 'Total Sessions')
                              : null;
                            const yearAgoValue = comparisonData.sameWeekYearAgo 
                              ? getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Total Sessions')
                              : null;
                            const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                              ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                              : null;
                            const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                              ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                              : null;
                            return (
                              <div className="space-y-1 mt-2 pt-2 border-t border-slate-200">
                                {prevWeekValue !== null && prevWeekChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-slate-600">Last Week:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      prevWeekChange > 0 ? 'text-green-600' : prevWeekChange < 0 ? 'text-red-600' : 'text-slate-600'
                                    }`}>
                                      {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(prevWeekChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                                {yearAgoValue !== null && yearAgoChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-slate-600">Year Ago:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      yearAgoChange > 0 ? 'text-green-600' : yearAgoChange < 0 ? 'text-red-600' : 'text-slate-600'
                                    }`}>
                                      {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(yearAgoChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                          <ArrowUpRight className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Add to Cart */}
                      <div className="relative">
                        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg border-2 border-blue-200">
                          <div className="text-sm text-blue-600 mb-2">Add to Cart</div>
                          <div className="text-3xl font-bold text-blue-900">
                            {formatNumber(getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics))}
                          </div>
                          <div className="text-xs font-semibold text-blue-700 mt-2 mb-2">
                            {(getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') || 0).toFixed(1)}% rate
                          </div>
                          {comparisonData && (() => {
                            const currentValue = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                            const prevWeekATC = comparisonData.previousWeek 
                              ? getTotalAddToCart(comparisonData.previousWeek.funnelMetrics, comparisonData.previousWeek.overallMetrics)
                              : null;
                            const yearAgoATC = comparisonData.sameWeekYearAgo 
                              ? getTotalAddToCart(comparisonData.sameWeekYearAgo.funnelMetrics, comparisonData.sameWeekYearAgo.overallMetrics)
                              : null;
                            const prevWeekChange = prevWeekATC !== null && prevWeekATC !== 0 
                              ? ((currentValue - prevWeekATC) / prevWeekATC) * 100 
                              : null;
                            const yearAgoChange = yearAgoATC !== null && yearAgoATC !== 0 
                              ? ((currentValue - yearAgoATC) / yearAgoATC) * 100 
                              : null;
                            return (
                              <div className="space-y-1 mt-2 pt-2 border-t border-blue-200">
                                {prevWeekChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-blue-600">Last Week:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      prevWeekChange > 0 ? 'text-green-600' : prevWeekChange < 0 ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                      {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(prevWeekChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                                {yearAgoChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-blue-600">Year Ago:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      yearAgoChange > 0 ? 'text-green-600' : yearAgoChange < 0 ? 'text-red-600' : 'text-blue-600'
                                    }`}>
                                      {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(yearAgoChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                          <ArrowUpRight className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Checkout */}
                      <div className="relative">
                        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg border-2 border-purple-200">
                          <div className="text-sm text-purple-600 mb-2">Checkout</div>
                          <div className="text-3xl font-bold text-purple-900">
                            {formatNumber(getMetricValue(weekData.overallMetrics, 'Total Checkout') || getFunnelMetricSum(weekData.funnelMetrics, 'Checkout'))}
                          </div>
                          <div className="text-xs font-semibold text-purple-700 mt-2 mb-2">
                            {(() => {
                              const totalCheckout =
                                getMetricValue(weekData.overallMetrics, 'Total Checkout') || getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                              const totalATC = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                              return totalATC > 0 ? ((totalCheckout / totalATC) * 100).toFixed(1) : '0.0';
                            })()}% from cart
                          </div>
                          {comparisonData && (() => {
                            const currentValue =
                              getMetricValue(weekData.overallMetrics, 'Total Checkout') || getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                            const prevWeekValue = comparisonData.previousWeek 
                              ? (getMetricValue(comparisonData.previousWeek.overallMetrics, 'Total Checkout') ||
                                 getFunnelMetricSum(comparisonData.previousWeek.funnelMetrics, 'Checkout'))
                              : null;
                            const yearAgoValue = comparisonData.sameWeekYearAgo 
                              ? (getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Total Checkout') ||
                                 getFunnelMetricSum(comparisonData.sameWeekYearAgo.funnelMetrics, 'Checkout'))
                              : null;
                            const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                              ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                              : null;
                            const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                              ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                              : null;
                            return (
                              <div className="space-y-1 mt-2 pt-2 border-t border-purple-200">
                                {prevWeekChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-purple-600">Last Week:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      prevWeekChange > 0 ? 'text-green-600' : prevWeekChange < 0 ? 'text-red-600' : 'text-purple-600'
                                    }`}>
                                      {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(prevWeekChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                                {yearAgoChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-purple-600">Year Ago:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      yearAgoChange > 0 ? 'text-green-600' : yearAgoChange < 0 ? 'text-red-600' : 'text-purple-600'
                                    }`}>
                                      {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(yearAgoChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-purple-400">
                          <ArrowUpRight className="h-6 w-6" />
                        </div>
                      </div>

                      {/* Purchase */}
                      <div className="relative">
                        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border-2 border-green-300">
                          <div className="text-sm text-green-600 mb-2">Purchase</div>
                          <div className="text-3xl font-bold text-green-900">
                            {formatNumber(getMetricValue(weekData.overallMetrics, 'Orders'))}
                          </div>
                          <div className="text-xs font-semibold text-green-700 mt-2 mb-2">
                            {((getMetricValue(weekData.funnelMetrics, 'Checkout → Purchase') || 0)).toFixed(1)}% checkout rate
                          </div>
                          {comparisonData && (() => {
                            const currentValue = getMetricValue(weekData.overallMetrics, 'Orders');
                            const prevWeekValue = comparisonData.previousWeek 
                              ? getMetricValue(comparisonData.previousWeek.overallMetrics, 'Orders')
                              : null;
                            const yearAgoValue = comparisonData.sameWeekYearAgo 
                              ? getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Orders')
                              : null;
                            const prevWeekChange = prevWeekValue !== null && prevWeekValue !== 0 
                              ? ((currentValue - prevWeekValue) / prevWeekValue) * 100 
                              : null;
                            const yearAgoChange = yearAgoValue !== null && yearAgoValue !== 0 
                              ? ((currentValue - yearAgoValue) / yearAgoValue) * 100 
                              : null;
                            return (
                              <div className="space-y-1 mt-2 pt-2 border-t border-green-200">
                                {prevWeekChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-green-600">Last Week:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      prevWeekChange > 0 ? 'text-green-700' : prevWeekChange < 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(prevWeekChange).toFixed(1)}%
                                    </span>
                        </div>
                                )}
                                {yearAgoChange !== null && (
                                  <div className="flex items-center justify-center gap-1 text-xs">
                                    <span className="text-green-600">Year Ago:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      yearAgoChange > 0 ? 'text-green-700' : yearAgoChange < 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(yearAgoChange).toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Checkout Abandonment Callout */}
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded">
                          <ShoppingCart className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-900 text-sm mb-1">Checkout Abandonment</div>
                          <div className="text-sm text-amber-700">
                            <span className="font-bold text-lg">
                              {(() => {
                                const explicitRate = getMetricValue(weekData.overallMetrics, 'Checkout Abandonment Rate');
                                if (explicitRate > 0) return explicitRate.toFixed(1);

                                const totalCheckout =
                                  getMetricValue(weekData.overallMetrics, 'Total Checkout') ||
                                  getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                                const totalATC = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                                return totalATC > 0 ? (100 - ((totalCheckout / totalATC) * 100)).toFixed(1) : '0.0';
                              })()}%
                            </span>
                            {' '}of users who added to cart didn't checkout
                          </div>
                          {comparisonData && (() => {
                            const currentExplicit = getMetricValue(weekData.overallMetrics, 'Checkout Abandonment Rate');
                            const currentCheckout =
                              getMetricValue(weekData.overallMetrics, 'Total Checkout') ||
                              getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                            const currentATC = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                            const currentAbandonment =
                              currentExplicit > 0 ? currentExplicit : currentATC > 0 ? (100 - ((currentCheckout / currentATC) * 100)) : 0;
                            
                            const prevWeekExplicit = comparisonData.previousWeek
                              ? getMetricValue(comparisonData.previousWeek.overallMetrics, 'Checkout Abandonment Rate')
                              : 0;
                            const prevWeekCheckout = comparisonData.previousWeek
                              ? (getMetricValue(comparisonData.previousWeek.overallMetrics, 'Total Checkout') ||
                                 getFunnelMetricSum(comparisonData.previousWeek.funnelMetrics, 'Checkout'))
                              : null;
                            const prevWeekATC = comparisonData.previousWeek
                              ? getTotalAddToCart(comparisonData.previousWeek.funnelMetrics, comparisonData.previousWeek.overallMetrics)
                              : null;
                            const prevWeekAbandonment =
                              prevWeekExplicit > 0
                                ? prevWeekExplicit
                                : prevWeekATC && prevWeekATC > 0
                                ? (100 - ((prevWeekCheckout! / prevWeekATC) * 100))
                                : null;
                            
                            const yearAgoExplicit = comparisonData.sameWeekYearAgo
                              ? getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Checkout Abandonment Rate')
                              : 0;
                            const yearAgoCheckout = comparisonData.sameWeekYearAgo
                              ? (getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Total Checkout') ||
                                 getFunnelMetricSum(comparisonData.sameWeekYearAgo.funnelMetrics, 'Checkout'))
                              : null;
                            const yearAgoATC = comparisonData.sameWeekYearAgo
                              ? getTotalAddToCart(comparisonData.sameWeekYearAgo.funnelMetrics, comparisonData.sameWeekYearAgo.overallMetrics)
                              : null;
                            const yearAgoAbandonment =
                              yearAgoExplicit > 0
                                ? yearAgoExplicit
                                : yearAgoATC && yearAgoATC > 0
                                ? (100 - ((yearAgoCheckout! / yearAgoATC) * 100))
                                : null;
                            
                            // For abandonment, increase is BAD (red), decrease is GOOD (green)
                            const prevWeekChange = prevWeekAbandonment !== null 
                              ? currentAbandonment - prevWeekAbandonment
                              : null;
                            const yearAgoChange = yearAgoAbandonment !== null 
                              ? currentAbandonment - yearAgoAbandonment
                              : null;
                            
                            return (
                              <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
                                {prevWeekChange !== null && prevWeekAbandonment !== null && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-amber-700">vs. Last Week:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      prevWeekChange > 0 ? 'text-red-600' : prevWeekChange < 0 ? 'text-green-600' : 'text-amber-700'
                                    }`}>
                                      {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(prevWeekChange).toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-amber-600">
                                      ({prevWeekAbandonment.toFixed(1)}%)
                                    </span>
                        </div>
                                )}
                                {yearAgoChange !== null && yearAgoAbandonment !== null && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-amber-700">vs. Year Ago:</span>
                                    <span className={`font-semibold flex items-center gap-1 ${
                                      yearAgoChange > 0 ? 'text-red-600' : yearAgoChange < 0 ? 'text-green-600' : 'text-amber-700'
                                    }`}>
                                      {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                      {Math.abs(yearAgoChange).toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-amber-600">
                                      ({yearAgoAbandonment.toFixed(1)}%)
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* TOP SELLING PRODUCTS */}
                <Card className="border-2 border-pink-100">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Top Selling Products</CardTitle>
                        <CardDescription>Best performing products this week</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {(() => {
                      // Unit entries: /products/<name>  (not /products/sales/<name>)
                      const unitEntries = weekData.overallMetrics.filter(
                        (m: any) => m.metric_name.startsWith('/products/') && !m.metric_name.startsWith('/products/sales/')
                      );
                      // Net sales entries: /products/sales/<name>
                      const salesMap: Record<string, number> = {};
                      weekData.overallMetrics
                        .filter((m: any) => m.metric_name.startsWith('/products/sales/'))
                        .forEach((m: any) => {
                          const name = m.metric_name.replace('/products/sales/', '');
                          salesMap[name] = m.metric_value;
                        });

                      if (unitEntries.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No product data available</p>
                            <p className="text-xs mt-2">Upload CSV with top_product_1_name, top_product_1_units (and optionally top_product_1_net_sales)</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                          {unitEntries
                            .sort((a: any, b: any) => {
                              const aName = a.metric_name.replace('/products/', '');
                              const bName = b.metric_name.replace('/products/', '');
                              const aSales = salesMap[aName] ?? 0;
                              const bSales = salesMap[bName] ?? 0;
                              // Sort by net sales if available, fall back to units
                              if (aSales > 0 || bSales > 0) return bSales - aSales;
                              return b.metric_value - a.metric_value;
                            })
                            .slice(0, 6)
                            .map((product: any, idx: number) => {
                              const rawName = product.metric_name.replace('/products/', '');
                              const netSales = salesMap[rawName];
                              return (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gradient-to-r from-white to-pink-50 border border-pink-200 rounded-lg">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm leading-relaxed break-words">{rawName}</div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      <span className="text-xs text-muted-foreground">{product.metric_value} units sold</span>
                                      {netSales !== undefined && (
                                        <span className="text-xs font-semibold text-green-700">{formatCurrency(netSales)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Revenue Waterfall — week selector */}
                {(() => {
                  // Shopify points sorted descending for dropdown (most recent first)
                  const shopifyDesc = [...metricsHistory]
                    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate))
                    .filter((p) => (p.metrics['Gross Sales'] ?? 0) > 0);
                  const shopifyAsc = [...shopifyDesc].reverse();
                  if (shopifyAsc.length === 0) return null;

                  // Use selected week, defaulting to most recent
                  const waterfallPoint = shopifyDesc.find((p) => p.weekStartDate === waterfallWeekStart) ?? shopifyDesc[0];

                  const grossSales      = waterfallPoint.metrics['Gross Sales'] ?? 0;
                  const totalDiscounts  = waterfallPoint.metrics['Total Discount Amount'] ?? 0;
                  const refunds         = waterfallPoint.metrics['Refunds'] ?? 0;
                  const shippingRev     = waterfallPoint.metrics['Shipping Reversals'] ?? 0;
                  const taxRev          = waterfallPoint.metrics['Tax Reversals'] ?? 0;
                  const compValue       = waterfallPoint.metrics['Comp Order Value'] ?? 0;
                  const promoDiscount   = waterfallPoint.metrics['Promo Discount Value'] ?? 0;
                  const classicDiscount = waterfallPoint.metrics['Classic Discount Value'] ?? 0;
                  const compCount       = waterfallPoint.metrics['Comp Order Count'] ?? 0;
                  const promoCount      = waterfallPoint.metrics['Promo Order Count'] ?? 0;
                  const classicCount    = waterfallPoint.metrics['Classic Discount Count'] ?? 0;
                  const isCurrentWeek   = weekData && weekData.week?.week_start_date === waterfallPoint.weekStartDate;
                  const totalOrders     = isCurrentWeek ? getMetricValue(weekData!.overallMetrics, 'Orders') : 0;
                  const weekLabel       = `${waterfallPoint.weekStartDate} – ${waterfallPoint.weekEndDate}`;

                  // True Commercial Revenue = Revenue (Net Sales) - Refunds
                  // Removes both comp-driven zeroing and genuine post-sale refunds, leaving only cash kept
                  const tcr = (p: MetricsHistoryPoint) => (p.metrics['Revenue'] ?? 0) - (p.metrics['Refunds'] ?? 0);
                  const netSales = tcr(waterfallPoint);
                  const currentTcr = netSales;
                  const pct = (v: number, base: number) => base > 0 ? ` (${((v / base) * 100).toFixed(1)}%)` : '';

                  // Prior week comparison
                  const wDate = new Date(waterfallPoint.weekStartDate + 'T00:00:00');
                  const priorDate = new Date(wDate);
                  priorDate.setDate(priorDate.getDate() - 7);
                  const priorDateStr = priorDate.toISOString().slice(0, 10);
                  const priorPoint = shopifyAsc.find((p) => p.weekStartDate === priorDateStr) ?? null;
                  const priorTcr = priorPoint ? tcr(priorPoint) : null;
                  const vsPriorPct = priorTcr !== null && priorTcr !== 0
                    ? ((currentTcr - priorTcr) / Math.abs(priorTcr)) * 100
                    : null;
                  const vsPriorAbs = priorTcr !== null ? currentTcr - priorTcr : null;

                  // Year-ago comparison (52 weeks = 364 days, ±3 day tolerance)
                  const yearAgoDate = new Date(wDate);
                  yearAgoDate.setDate(yearAgoDate.getDate() - 364);
                  const yearAgoPoint = shopifyAsc.find((p) => {
                    const diff = Math.abs(new Date(p.weekStartDate + 'T00:00:00').getTime() - yearAgoDate.getTime());
                    return diff <= 3 * 24 * 60 * 60 * 1000;
                  }) ?? null;
                  const yearAgoTcr = yearAgoPoint ? tcr(yearAgoPoint) : null;
                  const vsYoyPct = yearAgoTcr !== null && yearAgoTcr !== 0
                    ? ((currentTcr - yearAgoTcr) / Math.abs(yearAgoTcr)) * 100
                    : null;
                  const vsYoyAbs = yearAgoTcr !== null ? currentTcr - yearAgoTcr : null;

                  // TCR trend slope helper
                  const tcrSlope = (points: MetricsHistoryPoint[]) => {
                    if (points.length < 2) return null;
                    const vals = points.map((p) => tcr(p));
                    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                    if (avg === 0) return null;
                    const slope = (vals[vals.length - 1] - vals[0]) / (vals.length - 1);
                    const pctPerWk = (slope / Math.abs(avg)) * 100;
                    const arrow = pctPerWk > 0.5 ? '↑' : pctPerWk < -0.5 ? '↓' : '→';
                    const sign = pctPerWk > 0 ? '+' : '';
                    const label = `${arrow} ${sign}${pctPerWk.toFixed(1)}%/wk`;
                    const color = pctPerWk > 0.5 ? 'text-emerald-700' : pctPerWk < -0.5 ? 'text-red-600' : 'text-slate-500';
                    return { pctPerWk, label, color };
                  };

                  const trend4  = tcrSlope(shopifyAsc.slice(-4));
                  const trend12 = tcrSlope(shopifyAsc.slice(-12));
                  const trend52 = tcrSlope(shopifyAsc.slice(-52));
                  const tcrTrendPct = trend4?.pctPerWk ?? null;

                  // Card border colour driven by TCR trend
                  const borderClass = tcrTrendPct === null
                    ? 'border-violet-100'
                    : tcrTrendPct > 0.5
                    ? 'border-emerald-300'
                    : tcrTrendPct < -0.5
                    ? 'border-red-300'
                    : 'border-amber-300';

                  // Helper: render a waterfall deduction row
                  const WaterfallRow = ({ label, count, value, base, color }: { label: string; count: number; value: number; base: number; color: string }) => (
                    <div className="flex items-center justify-between py-1.5 pl-4 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-500">{label}{count > 0 ? <span className="text-xs text-slate-400"> · {count} orders · {((value / base) * 100).toFixed(1)}% of gross</span> : ''}</span>
                      <span className={`text-sm font-semibold ${color}`}>−{formatCurrency(value)}</span>
                    </div>
                  );

                  return (
                    <Card className={`border-2 ${borderClass}`}>
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50/50 py-3 px-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <CardTitle className="text-base text-slate-700 shrink-0">Revenue Breakdown</CardTitle>
                          <Select
                            value={waterfallPoint.weekStartDate}
                            onValueChange={(val) => setWaterfallWeekStart(val)}
                          >
                            <SelectTrigger className="h-7 text-xs w-auto max-w-[220px] border-slate-200 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {shopifyDesc.map((p) => (
                                <SelectItem key={p.weekStartDate} value={p.weekStartDate} className="text-xs">
                                  {p.weekStartDate} – {p.weekEndDate}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pt-3 pb-4 space-y-3">

                        {/* ── Hero: True Commercial Revenue ── */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-semibold text-emerald-800">True Commercial Revenue</span>
                            <p className="text-xs text-slate-400 mt-0.5">Revenue minus refunds. Cash the business actually kept.</p>
                          </div>
                          <span className="text-2xl font-bold text-emerald-700">{formatCurrency(currentTcr)}</span>
                        </div>

                        {/* Comparisons — 3 key rows */}
                        <div className="space-y-1.5">
                          {/* vs Prior week */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 flex items-center gap-1">
                              {vsPriorPct !== null ? (
                                vsPriorPct > 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-700" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />
                              ) : null}
                              vs Prior week
                            </span>
                            {vsPriorPct !== null && vsPriorAbs !== null ? (
                              <span className={`font-semibold ${vsPriorPct > 0 ? 'text-emerald-700' : vsPriorPct < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                {vsPriorAbs > 0 ? '+' : ''}{formatCurrency(vsPriorAbs)}  {vsPriorPct > 0 ? '+' : ''}{vsPriorPct.toFixed(1)}%
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </div>

                          {/* vs Year ago */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 flex items-center gap-1">
                              {vsYoyPct !== null ? (
                                vsYoyPct > 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-700" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />
                              ) : null}
                              vs Year ago
                            </span>
                            {vsYoyPct !== null && vsYoyAbs !== null ? (
                              <span className={`font-semibold ${vsYoyPct > 0 ? 'text-emerald-700' : vsYoyPct < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                {vsYoyAbs > 0 ? '+' : ''}{formatCurrency(vsYoyAbs)}  {vsYoyPct > 0 ? '+' : ''}{vsYoyPct.toFixed(1)}%
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </div>

                          {/* 4-week trend */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 flex items-center gap-1">
                              {trend4 && (
                                trend4.pctPerWk > 0.5 ? <ArrowUpRight className="h-4 w-4 text-emerald-700" /> : trend4.pctPerWk < -0.5 ? <ArrowDownRight className="h-4 w-4 text-red-600" /> : null
                              )}
                              Trend (4-wk)
                            </span>
                            {trend4 ? (
                              <span className={`font-semibold ${trend4.color}`}>{trend4.label}</span>
                            ) : <span className="text-slate-300">—</span>}
                          </div>
                        </div>

                        {/* ── Waterfall detail ── */}
                        <div className="border-t border-slate-200 pt-2">
                          <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                            Gross Sales − Discounts − Refunds + Reversals = Net Sales
                          </div>

                          {/* Gross Sales */}
                          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                            <span className="text-sm font-semibold text-slate-600">Gross Sales</span>
                            <span className="text-sm font-bold text-slate-700">{formatCurrency(grossSales)}</span>
                          </div>

                          {/* Discount breakdown */}
                          {compValue > 0 && <WaterfallRow label="Comp / free orders" count={compCount} value={compValue} base={grossSales} color="text-amber-700" />}
                          {promoDiscount > 0 && <WaterfallRow label="Promotional discounts" count={promoCount} value={promoDiscount} base={grossSales} color="text-orange-700" />}
                          {classicDiscount > 0 && <WaterfallRow label="Discount codes" count={classicCount} value={classicDiscount} base={grossSales} color="text-orange-600" />}
                          {/* Show total discounts if we have it but no breakdown */}
                          {totalDiscounts > 0 && compValue === 0 && promoDiscount === 0 && classicDiscount === 0 && (
                            <div className="flex items-center justify-between py-1.5 pl-4 border-b border-slate-100">
                              <span className="text-sm text-slate-500">− Discounts<span className="text-slate-400 text-xs"> · {((totalDiscounts / grossSales) * 100).toFixed(1)}% of gross</span></span>
                              <span className="text-sm font-semibold text-orange-700">−{formatCurrency(totalDiscounts)}</span>
                            </div>
                          )}

                          {/* Refunded payments */}
                          {refunds > 0 && (
                            <div className="flex items-center justify-between py-1.5 pl-4 border-b border-slate-100">
                              <span className="text-sm text-slate-500">− Refunded payments<span className="text-slate-400 text-xs"> · {((refunds / grossSales) * 100).toFixed(1)}% of gross</span></span>
                              <span className="text-sm font-semibold text-red-600">−{formatCurrency(refunds)}</span>
                            </div>
                          )}

                          {/* Shipping reversals */}
                          {shippingRev > 0 && (
                            <div className="flex items-center justify-between py-1.5 pl-4 border-b border-slate-100">
                              <span className="text-sm text-slate-500">+ Shipping reversals</span>
                              <span className="text-sm font-semibold text-blue-600">+{formatCurrency(shippingRev)}</span>
                            </div>
                          )}

                          {/* Tax reversals */}
                          {taxRev > 0 && (
                            <div className="flex items-center justify-between py-1.5 pl-4 border-b border-slate-100">
                              <span className="text-sm text-slate-500">+ Tax reversals</span>
                              <span className="text-sm font-semibold text-blue-600">+{formatCurrency(taxRev)}</span>
                            </div>
                          )}

                          {/* Net Sales */}
                          <div className="flex items-center justify-between py-2 mt-1 bg-emerald-50 px-2 rounded border border-emerald-100">
                            <span className="text-sm font-bold text-emerald-800">= Net Sales</span>
                            <span className="text-base font-bold text-emerald-700">{formatCurrency(netSales)}</span>
                          </div>

                          {/* Discount summary footer */}
                          {totalOrders > 0 && (compCount + promoCount + classicCount) > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-400">
                              {((compCount + promoCount + classicCount) / totalOrders * 100).toFixed(0)}% of orders discounted · total discount {(((compValue || totalDiscounts) / grossSales) * 100).toFixed(1)}% of gross sales
                            </div>
                          )}
                        </div>

                        {/* ── Run Analysis ── */}
                        <div className="border-t border-slate-200 pt-3 mt-1">
                          <Button
                            size="sm"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold tracking-wide"
                            disabled={revenueAnalysisLoading}
                            onClick={async () => {
                              setRevenueAnalysis(null);
                              setRevenueAnalysisError('');
                              setRevenueAnalysisLoading(true);
                              try {
                                // Build recent weeks context (last 8 shopify points)
                                const recentWeeks = shopifyAsc.slice(-8).map((p) => ({
                                  weekStart: p.weekStartDate,
                                  netSales: p.metrics['Revenue'] ?? 0,
                                  grossSales: p.metrics['Gross Sales'] ?? 0,
                                  totalDiscounts: p.metrics['Total Discount Amount'] ?? (
                                    (p.metrics['Comp Order Value'] ?? 0) +
                                    (p.metrics['Promo Discount Value'] ?? 0) +
                                    (p.metrics['Classic Discount Value'] ?? 0)
                                  ),
                                }));

                                // Extract channel data from current week
                                const channels: Record<string, any> = {};
                                if (isCurrentWeek && weekData?.marketingChannels) {
                                  weekData.marketingChannels.forEach((m: any) => {
                                    if (!channels[m.channel_name]) {
                                      channels[m.channel_name] = { revenue: 0, spend: 0, roas: 0 };
                                    }
                                    const metricLower = m.metric_name.toLowerCase();
                                    if (metricLower.includes('revenue') || metricLower.includes('sales') || metricLower.includes('total $') || metricLower.includes('attributed')) {
                                      channels[m.channel_name].revenue = m.metric_value;
                                    }
                                    if (metricLower.includes('spend') || metricLower.includes('cost')) {
                                      channels[m.channel_name].spend = m.metric_value;
                                    }
                                    if (metricLower.includes('roas')) {
                                      channels[m.channel_name].roas = m.metric_value;
                                    }
                                  });
                                }

                                // Extract prior week channel data for comparison
                                let priorWeekChannels: Record<string, any> = {};
                                if (priorPoint && comparisonData?.previousWeek?.marketingChannels) {
                                  comparisonData.previousWeek.marketingChannels.forEach((m: any) => {
                                    if (!priorWeekChannels[m.channel_name]) {
                                      priorWeekChannels[m.channel_name] = { revenue: 0 };
                                    }
                                    const metricLower = m.metric_name.toLowerCase();
                                    if (metricLower.includes('revenue') || metricLower.includes('sales') || metricLower.includes('total $') || metricLower.includes('attributed')) {
                                      priorWeekChannels[m.channel_name].revenue = m.metric_value;
                                    }
                                  });
                                  // Enrich channels with prior week revenue for comparison
                                  Object.keys(channels).forEach((ch) => {
                                    if (priorWeekChannels[ch]) {
                                      channels[ch].prevWeekRevenue = priorWeekChannels[ch].revenue;
                                    }
                                  });
                                }

                                const res = await fetch('/api/revenue-analysis', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    weekLabel,
                                    netSales,
                                    grossSales,
                                    totalDiscounts,
                                    compValue, compCount,
                                    promoDiscount, promoCount,
                                    classicDiscount, classicCount,
                                    refunds,
                                    shippingRev,
                                    taxRev,
                                    vsPriorPct,
                                    vsPriorAbs,
                                    vsYoyPct,
                                    vsYoyAbs,
                                    trend4: trend4?.label ?? null,
                                    trend12: trend12?.label ?? null,
                                    trend52: trend52?.label ?? null,
                                    recentWeeks,
                                    channels,
                                    priorWeekChannels,
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error || 'Analysis failed');
                                setRevenueAnalysis(data.analysis);

                                // Store context for follow-up questions
                                setRevenueAnalysisContext({
                                  netSales,
                                  grossSales,
                                  totalDiscounts,
                                  compValue,
                                  promoDiscount,
                                  classicDiscount,
                                  refunds,
                                  vsPriorPct,
                                  vsYoyPct,
                                  trend4: trend4?.label ?? null,
                                  trend12: trend12?.label ?? null,
                                  trend52: trend52?.label ?? null,
                                  channels,
                                });

                                // Open the analysis modal
                                setIsAnalysisModalOpen(true);
                              } catch (e: any) {
                                setRevenueAnalysisError(e.message || 'Analysis failed');
                              } finally {
                                setRevenueAnalysisLoading(false);
                              }
                            }}
                          >
                            {revenueAnalysisLoading ? 'Analysing…' : 'RUN ANALYSIS'}
                          </Button>

                          {revenueAnalysisError && (
                            <p className="mt-2 text-xs text-red-600">{revenueAnalysisError}</p>
                          )}
                        </div>

                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Section 2: 📢 MARKETING CHANNELS */}
                <Card className="border-2 border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Megaphone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Marketing Channels</CardTitle>
                        <CardDescription>Performance across all marketing channels</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Channel Summary Cards with Enhanced Affiliates */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
                      {weekData && weekData.marketingChannels && Array.isArray(weekData.marketingChannels) && 
                        Object.entries(
                          weekData.marketingChannels.reduce((acc: any, item: any) => {
                            if (!acc[item.channel_name]) {
                              acc[item.channel_name] = { revenue: 0, spend: 0, conversions: 0, clicks: 0, affiliatesSignedUp: 0, roas: 0 };
                            }
                            const metricLower = item.metric_name.toLowerCase();
                            // Recognize revenue, sales, or attributed revenue
                            if (metricLower.includes('revenue') || metricLower.includes('sales') || metricLower.includes('total $') || metricLower.includes('attributed')) {
                              acc[item.channel_name].revenue = item.metric_value;
                            }
                            if (metricLower.includes('spend') || metricLower.includes('cost')) {
                              acc[item.channel_name].spend = item.metric_value;
                            }
                            if (metricLower.includes('roas')) {
                              acc[item.channel_name].roas = item.metric_value;
                            }
                            if (metricLower.includes('conversion')) {
                              acc[item.channel_name].conversions = item.metric_value;
                            }
                            if (metricLower.includes('click')) {
                              acc[item.channel_name].clicks = item.metric_value;
                            }
                            if (metricLower.includes('affiliate') && (metricLower.includes('signed') || metricLower.includes('signup'))) {
                              acc[item.channel_name].affiliatesSignedUp = item.metric_value;
                            }
                            return acc;
                          }, {})
                        ).map(([channel, data]: [string, any]) => {
                          const roi = data.spend > 0 ? ((data.revenue - data.spend) / data.spend * 100) : 0;
                          // Use stored ROAS if available, otherwise compute from revenue/spend
                          const roas = data.roas > 0 ? data.roas : (data.spend > 0 ? data.revenue / data.spend : 0);
                          const isAffiliate = channel.toLowerCase().includes('affiliate');
                          
                          // Get revenue comparison data
                          const getChannelRevenue = (comparisonWeek: any, channelName: string) => {
                            if (!comparisonWeek || !comparisonWeek.marketingChannels) return null;
                            const channelData = comparisonWeek.marketingChannels.filter((m: any) => m.channel_name === channelName);
                            for (const metric of channelData) {
                              const metricLower = metric.metric_name.toLowerCase();
                              if (metricLower.includes('revenue') || metricLower.includes('sales') || metricLower.includes('total $') || metricLower.includes('attributed')) {
                                return metric.metric_value;
                              }
                            }
                            return null;
                          };

                          // Check if comparison weeks exist
                          const hasPreviousWeek = comparisonData?.previousWeek !== null && comparisonData?.previousWeek !== undefined;
                          const hasYearAgoWeek = comparisonData?.sameWeekYearAgo !== null && comparisonData?.sameWeekYearAgo !== undefined;

                          const prevWeekRevenue = hasPreviousWeek 
                            ? getChannelRevenue(comparisonData.previousWeek, channel)
                            : null;
                          const yearAgoRevenue = hasYearAgoWeek 
                            ? getChannelRevenue(comparisonData.sameWeekYearAgo, channel)
                            : null;

                          // Calculate changes - handle null (no data) vs 0 (zero revenue)
                          const prevWeekChange = prevWeekRevenue !== null 
                            ? (prevWeekRevenue === 0 ? (data.revenue > 0 ? Infinity : 0) : ((data.revenue - prevWeekRevenue) / prevWeekRevenue) * 100)
                            : null;
                          const yearAgoChange = yearAgoRevenue !== null 
                            ? (yearAgoRevenue === 0 ? (data.revenue > 0 ? Infinity : 0) : ((data.revenue - yearAgoRevenue) / yearAgoRevenue) * 100)
                            : null;

                          return (
                            <div 
                              key={channel} 
                              className={`p-4 border-2 rounded-lg ${
                                isAffiliate 
                                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300' 
                                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="font-bold text-sm">{channel}</div>
                                {isAffiliate && (
                                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                                    Partnership
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Revenue:</span>
                                  <span className="font-bold text-green-700">{formatCurrency(data.revenue)}</span>
                                </div>
                                {data.spend > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Spend:</span>
                                    <span className="font-semibold text-slate-700">{formatCurrency(data.spend)}</span>
                                  </div>
                                )}
                                {roas > 0 && (
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-muted-foreground">ROAS:</span>
                                    <span className={`font-bold text-xl ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                                      {roas.toFixed(2)}x
                                    </span>
                                  </div>
                                )}
                                {isAffiliate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Affiliates signed up:</span>
                                    <span className="font-semibold text-slate-900">{formatNumber(data.affiliatesSignedUp || 0)}</span>
                                  </div>
                                )}
                                {(hasPreviousWeek || hasYearAgoWeek) && (
                                  <div className="space-y-1 pt-2 border-t border-gray-200">
                                    {hasPreviousWeek && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">vs Last Week:</span>
                                        {prevWeekRevenue !== null ? (
                                          <span className={`font-semibold flex items-center gap-1 ${
                                            prevWeekChange !== null && prevWeekChange > 0 ? 'text-green-600' : prevWeekChange !== null && prevWeekChange < 0 ? 'text-red-600' : 'text-gray-600'
                                          }`}>
                                            {prevWeekChange !== null && prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange !== null && prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                            {prevWeekChange !== null && prevWeekChange !== Infinity ? Math.abs(prevWeekChange).toFixed(1) + '%' : prevWeekChange === Infinity ? 'New' : '0.0%'}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">No data</span>
                                        )}
                                      </div>
                                    )}
                                    {hasYearAgoWeek && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">vs Year Ago:</span>
                                        {yearAgoRevenue !== null ? (
                                          <span className={`font-semibold flex items-center gap-1 ${
                                            yearAgoChange !== null && yearAgoChange > 0 ? 'text-green-600' : yearAgoChange !== null && yearAgoChange < 0 ? 'text-red-600' : 'text-gray-600'
                                          }`}>
                                            {yearAgoChange !== null && yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange !== null && yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                            {yearAgoChange !== null && yearAgoChange !== Infinity ? Math.abs(yearAgoChange).toFixed(1) + '%' : yearAgoChange === Infinity ? 'New' : '0.0%'}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">No data</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>

                  </CardContent>
                </Card>

                {/* Social Media (Instagram) - Overview Highlights */}
                <Card className="border-2 border-pink-100">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500 rounded-lg">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Social Media</CardTitle>
                        <CardDescription>Overview highlights (Account Subscribers + Reels/Posts Reach &amp; Interactions)</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {(() => {
                      const highlights = [
                        { contentType: 'Account', key: 'Subscribers', label: 'Account Subscribers' },
                        { contentType: 'Reels', key: 'Reach', label: 'Reels Reach' },
                        { contentType: 'Reels', key: 'Interactions', label: 'Reels Interactions' },
                        { contentType: 'Posts', key: 'Reach', label: 'Posts Reach' },
                        { contentType: 'Posts', key: 'Interactions', label: 'Posts Interactions' },
                      ];

                      const hasAny = highlights.some(
                        (m) => getSocialMetric(weekData, 'Instagram', m.contentType, m.key) !== null
                      );

                      if (!hasAny) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Instagram className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No social media data available yet</p>
                            <p className="text-xs mt-2">Full Social Media details are on the Channels tab.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                          {highlights.map((metric) => {
                            const current = getSocialMetric(weekData, 'Instagram', metric.contentType, metric.key);
                            const prev = comparisonData?.previousWeek
                              ? getSocialMetric(comparisonData.previousWeek, 'Instagram', metric.contentType, metric.key)
                              : null;
                            const yearAgo = comparisonData?.sameWeekYearAgo
                              ? getSocialMetric(comparisonData.sameWeekYearAgo, 'Instagram', metric.contentType, metric.key)
                              : null;

                            const currentValue = current ?? 0;
                            const prevChange = current !== null ? formatChange(currentValue, prev) : null;
                            const yearAgoChange = current !== null ? formatChange(currentValue, yearAgo) : null;

                            return (
                              <div
                                key={`${metric.contentType}-${metric.key}`}
                                className="p-4 border-2 border-pink-200 rounded-lg bg-gradient-to-br from-white to-pink-50"
                              >
                                <div className="text-sm font-medium text-slate-700 mb-2">{metric.label}</div>
                                <div className="text-2xl font-bold text-slate-900">{formatNumber(currentValue)}</div>

                                {(comparisonData?.previousWeek || comparisonData?.sameWeekYearAgo) && (
                                  <div className="space-y-1 mt-3 pt-3 border-t border-pink-200">
                                    {comparisonData?.previousWeek && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600">vs Last Week:</span>
                                        {prev !== null && current !== null ? (
                                          <span
                                            className={`font-semibold flex items-center gap-1 ${
                                              prevChange !== null && prevChange !== Infinity && prevChange > 0
                                                ? 'text-green-600'
                                                : prevChange !== null && prevChange !== Infinity && prevChange < 0
                                                ? 'text-red-600'
                                                : 'text-slate-600'
                                            }`}
                                          >
                                            {prevChange !== null && prevChange !== Infinity && prevChange > 0 ? (
                                              <ArrowUpRight className="h-3 w-3" />
                                            ) : prevChange !== null && prevChange !== Infinity && prevChange < 0 ? (
                                              <ArrowDownRight className="h-3 w-3" />
                                            ) : null}
                                            {prevChange === Infinity
                                              ? 'New'
                                              : prevChange !== null
                                              ? `${Math.abs(prevChange).toFixed(1)}%`
                                              : '0.0%'}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">No data</span>
                                        )}
                                      </div>
                                    )}
                                    {comparisonData?.sameWeekYearAgo && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600">vs Year Ago:</span>
                                        {yearAgo !== null && current !== null ? (
                                          <span
                                            className={`font-semibold flex items-center gap-1 ${
                                              yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange > 0
                                                ? 'text-green-600'
                                                : yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange < 0
                                                ? 'text-red-600'
                                                : 'text-slate-600'
                                            }`}
                                          >
                                            {yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange > 0 ? (
                                              <ArrowUpRight className="h-3 w-3" />
                                            ) : yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange < 0 ? (
                                              <ArrowDownRight className="h-3 w-3" />
                                            ) : null}
                                            {yearAgoChange === Infinity
                                              ? 'New'
                                              : yearAgoChange !== null
                                              ? `${Math.abs(yearAgoChange).toFixed(1)}%`
                                              : '0.0%'}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">No data</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                  </TabsContent>


                  <TabsContent value="charts" className="space-y-8">
                    <Card className="border-2 border-slate-100">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/70">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl">Charts</CardTitle>
                            <CardDescription>Historical trends for key KPIs</CardDescription>
                          </div>
                          <Button onClick={loadMetricsHistory} disabled={isLoadingCharts} variant="outline">
                            {isLoadingCharts ? 'Loading...' : 'Refresh data'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {chartsError && <div className="mb-4 text-sm text-red-600">{chartsError}</div>}
                        {isLoadingCharts ? (
                          <div className="text-sm text-muted-foreground">Loading chart data…</div>
                        ) : (
                          <MetricHistoryCharts history={metricsHistory} />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {!weekData && !isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first week of data to get started
                    </p>
                    <Button onClick={() => document.querySelector('[value="add-data"]')?.dispatchEvent(new Event('click'))}>
                      Add Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Channels Tab - Full Access Only */}
          {accessLevel === 'full' && (
          <TabsContent value="channels" className="space-y-6">
            {weekData && (
              <div className="grid gap-6">
                {weekData && weekData.marketingChannels && Array.isArray(weekData.marketingChannels) && Object.entries(
                  weekData.marketingChannels.reduce((acc: any, item: any) => {
                    if (!acc[item.channel_name]) {
                      acc[item.channel_name] = [];
                    }
                    acc[item.channel_name].push(item);
                    return acc;
                  }, {})
                ).map(([channel, metrics]: [string, any]) => {
                  // Helper function to get comparison value for a metric
                  const getComparisonValue = (metricName: string, comparisonWeek: any) => {
                    if (!comparisonWeek || !comparisonWeek.marketingChannels) return null;
                    const comparisonMetric = comparisonWeek.marketingChannels.find(
                      (m: any) => m.channel_name === channel && m.metric_name === metricName
                    );
                    return comparisonMetric ? comparisonMetric.metric_value : null;
                  };

                  // Helper function to calculate percentage change
                  const calculateChange = (current: number, previous: number | null) => {
                    if (previous === null || previous === 0) return null;
                    return ((current - previous) / previous) * 100;
                  };

                  return (
                  <Card key={channel}>
                    <CardHeader>
                      <CardTitle>{channel}</CardTitle>
                        <CardDescription>Performance metrics with comparisons</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                          {metrics
                            .filter((metric: any) => {
                              // Show spend/cost for Google Ads and Facebook Ads only
                              const metricLower = metric.metric_name.toLowerCase();
                              const isSpend = metricLower.includes('spend') || metricLower.includes('cost');
                              if (isSpend && channel !== 'Google Ads' && channel !== 'Facebook Ads') {
                                return false;
                              }
                              return true;
                            })
                            .map((metric: any) => {
                            const currentValue = metric.metric_value;
                            const prevWeekValue = comparisonData?.previousWeek
                              ? getComparisonValue(metric.metric_name, comparisonData.previousWeek)
                              : null;
                            const yearAgoValue = comparisonData?.sameWeekYearAgo
                              ? getComparisonValue(metric.metric_name, comparisonData.sameWeekYearAgo)
                              : null;

                            const prevWeekChange = calculateChange(currentValue, prevWeekValue);
                            const yearAgoChange = calculateChange(currentValue, yearAgoValue);

                            const metricNameLower = metric.metric_name.toLowerCase();
                            const isCurrency = metricNameLower.includes('revenue') ||
                               metricNameLower.includes('spend') ||
                               metricNameLower.includes('cost') ||
                               metricNameLower.includes('profit');
                            const isRate = metricNameLower.includes('rate');
                            const isRoas = metricNameLower.includes('roas');

                            return (
                              <div key={metric.id} className="space-y-2 p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50">
                                <p className="text-sm font-medium text-muted-foreground">{metric.metric_name}</p>
                                <div className="space-y-1">
                                  <p className="text-2xl font-bold">
                                    {isCurrency
                                      ? formatCurrency(currentValue)
                                      : isRoas
                                        ? `${currentValue.toFixed(2)}x`
                                        : isRate
                                          ? `${metric.metric_value.toFixed(2)}%`
                                          : formatNumber(currentValue)}
                                  </p>
                                  
                                  {/* Previous Week Comparison */}
                                  {prevWeekValue !== null && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">vs. Last Week:</span>
                                      {prevWeekChange !== null && (
                                        <span className={`font-semibold flex items-center gap-1 ${
                                          prevWeekChange > 0 ? 'text-green-600' : prevWeekChange < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                          {prevWeekChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : prevWeekChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                          {Math.abs(prevWeekChange).toFixed(1)}%
                                        </span>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        ({isCurrency ? formatCurrency(prevWeekValue) : isRoas ? `${prevWeekValue.toFixed(2)}x` : isRate ? `${prevWeekValue.toFixed(2)}%` : formatNumber(prevWeekValue)})
                                      </span>
                                    </div>
                                  )}

                                  {/* Year Ago Comparison */}
                                  {yearAgoValue !== null && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">vs. Year Ago:</span>
                                      {yearAgoChange !== null && (
                                        <span className={`font-semibold flex items-center gap-1 ${
                                          yearAgoChange > 0 ? 'text-green-600' : yearAgoChange < 0 ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                          {yearAgoChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : yearAgoChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                                          {Math.abs(yearAgoChange).toFixed(1)}%
                                        </span>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        ({isCurrency ? formatCurrency(yearAgoValue) : isRoas ? `${yearAgoValue.toFixed(2)}x` : isRate ? `${yearAgoValue.toFixed(2)}%` : formatNumber(yearAgoValue)})
                                      </span>
                                    </div>
                                  )}

                                  {prevWeekValue === null && yearAgoValue === null && (
                                    <p className="text-xs text-muted-foreground italic">No comparison data available</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}

                {/* Channel Trend Analysis */}
                <div className="pt-2">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Channel Trend Analysis</h2>
                    <p className="text-sm text-slate-500 mt-1">Historical trends, momentum and direction for each marketing channel</p>
                  </div>
                  <ChannelHistoryCharts channelHistory={channelsHistory} />
                </div>

                {/* Social Media (Instagram) - moved from Overview */}
                <Card className="border-2 border-pink-100">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500 rounded-lg">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Social Media</CardTitle>
                        <CardDescription>Weekly Instagram performance (Stories, Reels, Posts, Account)</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {(() => {
                      const sections: Array<{
                        title: string;
                        contentType: string;
                        metrics: Array<{ key: string; label: string }>;
                      }> = [
                        {
                          title: 'Stories',
                          contentType: 'Stories',
                          metrics: [
                            { key: 'Views', label: 'Views' },
                            { key: 'Reposts', label: 'Replies' },
                            { key: 'Interactions', label: 'Profile Visits' },
                            { key: 'Reach', label: 'Reach' },
                          ],
                        },
                        {
                          title: 'Reels',
                          contentType: 'Reels',
                          metrics: [
                            { key: 'Views', label: 'Views' },
                            { key: 'Reposts', label: 'Reposts' },
                            { key: 'Interactions', label: 'Interactions' },
                            { key: 'Reach', label: 'Reach' },
                          ],
                        },
                        {
                          title: 'Posts',
                          contentType: 'Posts',
                          metrics: [
                            { key: 'Views', label: 'Views' },
                            { key: 'Reposts', label: 'Reposts' },
                            { key: 'Interactions', label: 'Interactions' },
                            { key: 'Reach', label: 'Reach' },
                          ],
                        },
                        {
                          title: 'Account',
                          contentType: 'Account',
                          metrics: [
                            { key: 'Subscribers', label: 'Subscribers' },
                            { key: 'Views', label: 'Views' },
                            { key: 'Interactions', label: 'Interactions' },
                          ],
                        },
                      ];

                      const hasAny =
                        sections.some((s) =>
                          s.metrics.some((metric) => getSocialMetric(weekData, 'Instagram', s.contentType, metric.key) !== null)
                        );

                      if (!hasAny) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Instagram className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No social media data available yet</p>
                            <p className="text-xs mt-2">Add Instagram metrics in the Add Data tab (manual or CSV).</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-8">
                          {sections.map((section) => (
                            <div key={section.contentType} className="border-l-4 border-pink-300 pl-4">
                              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
                              <div className={`grid gap-4 ${section.metrics.length === 3 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                                {section.metrics.map((metric) => {
                                  const current = getSocialMetric(weekData, 'Instagram', section.contentType, metric.key);
                                  const prev = comparisonData?.previousWeek
                                    ? getSocialMetric(comparisonData.previousWeek, 'Instagram', section.contentType, metric.key)
                                    : null;
                                  const yearAgo = comparisonData?.sameWeekYearAgo
                                    ? getSocialMetric(comparisonData.sameWeekYearAgo, 'Instagram', section.contentType, metric.key)
                                    : null;

                                  const currentValue = current ?? 0;
                                  const prevChange = current !== null ? formatChange(currentValue, prev) : null;
                                  const yearAgoChange = current !== null ? formatChange(currentValue, yearAgo) : null;

                                  return (
                                    <div key={metric.key} className="p-4 border-2 border-pink-200 rounded-lg bg-gradient-to-br from-white to-pink-50">
                                      <div className="text-sm font-medium text-slate-700 mb-2">{metric.label}</div>
                                      <div className="text-2xl font-bold text-slate-900">{formatNumber(currentValue)}</div>

                                      {(comparisonData?.previousWeek || comparisonData?.sameWeekYearAgo) && (
                                        <div className="space-y-1 mt-3 pt-3 border-t border-pink-200">
                                          {comparisonData?.previousWeek && (
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-slate-600">vs Last Week:</span>
                                              {prev !== null && current !== null ? (
                                                <span
                                                  className={`font-semibold flex items-center gap-1 ${
                                                    prevChange !== null && prevChange !== Infinity && prevChange > 0
                                                      ? 'text-green-600'
                                                      : prevChange !== null && prevChange !== Infinity && prevChange < 0
                                                      ? 'text-red-600'
                                                      : 'text-slate-600'
                                                  }`}
                                                >
                                                  {prevChange !== null && prevChange !== Infinity && prevChange > 0 ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                  ) : prevChange !== null && prevChange !== Infinity && prevChange < 0 ? (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                  ) : null}
                                                  {prevChange === Infinity ? 'New' : prevChange !== null ? `${Math.abs(prevChange).toFixed(1)}%` : '0.0%'}
                                                </span>
                                              ) : (
                                                <span className="text-slate-400">No data</span>
                                              )}
                                            </div>
                                          )}
                                          {comparisonData?.sameWeekYearAgo && (
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-slate-600">vs Year Ago:</span>
                                              {yearAgo !== null && current !== null ? (
                                                <span
                                                  className={`font-semibold flex items-center gap-1 ${
                                                    yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange > 0
                                                      ? 'text-green-600'
                                                      : yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange < 0
                                                      ? 'text-red-600'
                                                      : 'text-slate-600'
                                                  }`}
                                                >
                                                  {yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange > 0 ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                  ) : yearAgoChange !== null && yearAgoChange !== Infinity && yearAgoChange < 0 ? (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                  ) : null}
                                                  {yearAgoChange === Infinity ? 'New' : yearAgoChange !== null ? `${Math.abs(yearAgoChange).toFixed(1)}%` : '0.0%'}
                                                </span>
                                              ) : (
                                                <span className="text-slate-400">No data</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          )}

          {/* Add Data Tab - Full Access Only */}
          {accessLevel === 'full' && (
          <TabsContent value="add-data" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <DataUpload onUploadSuccess={handleUploadSuccess} />
                <GoogleDocsImport onUploadSuccess={handleUploadSuccess} />
              </div>
              <ShopifyReportsUpload onUploadSuccess={handleUploadSuccess} />
              <PromotionsUpload />
            <DataEntryForm onSuccess={handleUploadSuccess} />
          </TabsContent>
          )}
        </Tabs>

        {/* Revenue Analysis Modal */}
        {revenueAnalysis && revenueAnalysisContext && (
          <Modal
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            title="Revenue Analysis"
            size="lg"
          >
            <RevenueAnalysisChat
              initialAnalysis={revenueAnalysis}
              weekLabel={weekLabel}
              analysisContext={revenueAnalysisContext}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

