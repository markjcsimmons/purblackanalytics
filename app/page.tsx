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
import { GoogleDocsImport } from '@/components/google-docs-import';
import { InsightsDisplay } from '@/components/insights-display';
import { PromotionEntryForm } from '@/components/promotion-entry-form';
import { PromotionInsights } from '@/components/promotion-insights';
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
}

export default function Dashboard() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited' | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [comparisonData, setComparisonData] = useState<{
    previousWeek: any;
    sameWeekYearAgo: any;
  } | null>(null);

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

  useEffect(() => {
    // Check access level
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setAccessLevel(data.accessLevel || 'full');
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });
    
    fetchWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeekId) {
      fetchWeekData(selectedWeekId);
    }
  }, [selectedWeekId]);

  const handleUploadSuccess = () => {
    fetchWeeks();
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
                  await fetch('/api/auth/logout', { method: 'POST' });
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
          <TabsList className={`grid w-full ${accessLevel === 'limited' ? 'grid-cols-1' : 'grid-cols-3'} lg:w-[400px]`}>
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
                      <p className="text-xs text-green-700 font-medium mb-2">
                        {getMetricValue(weekData.overallMetrics, 'Orders')} orders
                      </p>
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
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* ROMAN'S RECOMMENDATIONS */}
                <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
                  <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-amber-900">Roman&apos;s Recommendations</CardTitle>
                        <CardDescription className="text-amber-700">Expert insights and actionable recommendations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {(() => {
                      // Try multiple property name formats
                      const week = weekData.week as any;
                      const recommendations = week?.romans_recommendations || week?.romansRecommendations || week?.roman_recommendations || week?.romanRecommendations;
                      
                      if (recommendations && typeof recommendations === 'string' && recommendations.trim()) {
                        return (
                          <div className="prose prose-amber max-w-none">
                            <p 
                              className="text-gray-800 text-xs leading-relaxed whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdownBold(recommendations.trim())
                              }}
                            />
                          </div>
                        );
                      }
                      
                      return (
                        <div className="text-center py-8">
                          <Sparkles className="h-12 w-12 mx-auto mb-3 text-amber-300 opacity-50" />
                          <p className="text-amber-700 text-sm">
                            No recommendations added yet. Add them in the <strong>Add Data</strong> tab under &quot;Week Information&quot;.
                          </p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

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
                            {formatNumber(getMetricValue(weekData.funnelMetrics, 'Sessions → Add to Cart') || 
                              getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') * 
                              getMetricValue(weekData.overallMetrics, 'Total Sessions') / 100)}
                          </div>
                          <div className="text-xs font-semibold text-blue-700 mt-2 mb-2">
                            {(getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') || 0).toFixed(1)}% rate
                          </div>
                          {comparisonData && (() => {
                            const currentValue = getMetricValue(weekData.funnelMetrics, 'Sessions → Add to Cart') || 
                              getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') * 
                              getMetricValue(weekData.overallMetrics, 'Total Sessions') / 100;
                            const prevWeekATC = comparisonData.previousWeek 
                              ? (getMetricValue(comparisonData.previousWeek.funnelMetrics, 'Sessions → Add to Cart') || 
                                 getMetricValue(comparisonData.previousWeek.funnelMetrics, 'Add-to-cart rate') * 
                                 getMetricValue(comparisonData.previousWeek.overallMetrics, 'Total Sessions') / 100)
                              : null;
                            const yearAgoATC = comparisonData.sameWeekYearAgo 
                              ? (getMetricValue(comparisonData.sameWeekYearAgo.funnelMetrics, 'Sessions → Add to Cart') || 
                                 getMetricValue(comparisonData.sameWeekYearAgo.funnelMetrics, 'Add-to-cart rate') * 
                                 getMetricValue(comparisonData.sameWeekYearAgo.overallMetrics, 'Total Sessions') / 100)
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
                            {formatNumber(getFunnelMetricSum(weekData.funnelMetrics, 'Checkout'))}
                          </div>
                          <div className="text-xs font-semibold text-purple-700 mt-2 mb-2">
                            {(() => {
                              const totalCheckout = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                              const totalATC = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                              return totalATC > 0 ? ((totalCheckout / totalATC) * 100).toFixed(1) : '0.0';
                            })()}% from cart
                          </div>
                          {comparisonData && (() => {
                            const currentValue = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                            const prevWeekValue = comparisonData.previousWeek 
                              ? getFunnelMetricSum(comparisonData.previousWeek.funnelMetrics, 'Checkout')
                              : null;
                            const yearAgoValue = comparisonData.sameWeekYearAgo 
                              ? getFunnelMetricSum(comparisonData.sameWeekYearAgo.funnelMetrics, 'Checkout')
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
                                const totalCheckout = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                                const totalATC = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                                return totalATC > 0 ? (100 - ((totalCheckout / totalATC) * 100)).toFixed(1) : '0.0';
                              })()}%
                            </span>
                            {' '}of users who added to cart didn't checkout
                          </div>
                          {comparisonData && (() => {
                            const currentCheckout = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                            const currentATC = getTotalAddToCart(weekData.funnelMetrics, weekData.overallMetrics);
                            const currentAbandonment = currentATC > 0 ? (100 - ((currentCheckout / currentATC) * 100)) : 0;
                            
                            const prevWeekCheckout = comparisonData.previousWeek 
                              ? getFunnelMetricSum(comparisonData.previousWeek.funnelMetrics, 'Checkout')
                              : null;
                            const prevWeekATC = comparisonData.previousWeek 
                              ? getTotalAddToCart(comparisonData.previousWeek.funnelMetrics, comparisonData.previousWeek.overallMetrics)
                              : null;
                            const prevWeekAbandonment = prevWeekATC && prevWeekATC > 0 
                              ? (100 - ((prevWeekCheckout! / prevWeekATC) * 100))
                              : null;
                            
                            const yearAgoCheckout = comparisonData.sameWeekYearAgo 
                              ? getFunnelMetricSum(comparisonData.sameWeekYearAgo.funnelMetrics, 'Checkout')
                              : null;
                            const yearAgoATC = comparisonData.sameWeekYearAgo 
                              ? getTotalAddToCart(comparisonData.sameWeekYearAgo.funnelMetrics, comparisonData.sameWeekYearAgo.overallMetrics)
                              : null;
                            const yearAgoAbandonment = yearAgoATC && yearAgoATC > 0 
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
                      // Look for products with /products/ prefix first
                      let products = weekData.overallMetrics
                        .filter((m: any) => m.metric_name.startsWith('/products/') && m.metric_name !== '/products/');
                      
                      // If no products found, try alternative formats
                      if (products.length === 0) {
                        // Try looking for metrics that might be products (e.g., product names without prefix)
                        products = weekData.overallMetrics
                          .filter((m: any) => {
                            const name = m.metric_name.toLowerCase();
                            // Exclude known non-product metrics
                            return !name.includes('revenue') && 
                                   !name.includes('orders') && 
                                   !name.includes('aov') && 
                                   !name.includes('conversion') && 
                                   !name.includes('sessions') &&
                                   !name.includes('spend') &&
                                   !name.includes('clicks') &&
                                   !name.startsWith('*') &&
                                   m.metric_value > 0 &&
                                   m.metric_value < 10000; // Reasonable order count range
                          });
                      }
                      
                      if (products.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>No product data available</p>
                            <p className="text-xs mt-2">Products should be uploaded with metric names starting with &quot;/products/&quot;</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
                          {products
                        .sort((a: any, b: any) => b.metric_value - a.metric_value)
                        .slice(0, 6)
                        .map((product: any, idx: number) => {
                              let productName = product.metric_name;
                              
                              // Handle /products/ prefix format - just remove the prefix to get full name
                              if (productName.startsWith('/products/')) {
                                productName = productName.replace('/products/', '');
                              } else {
                                // For other formats, just capitalize first letter of each word
                                productName = productName
                                  .split(/[-_\s]/)
                                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                              }
                              
                          return (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gradient-to-r from-white to-pink-50 border border-pink-200 rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm leading-relaxed break-words">{productName}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{formatNumber(product.metric_value)} orders</div>
                              </div>
                            </div>
                          );
                            })}
                    </div>
                      );
                    })()}
                  </CardContent>
                </Card>

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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                      {weekData && weekData.marketingChannels && Array.isArray(weekData.marketingChannels) && 
                        Object.entries(
                          weekData.marketingChannels.reduce((acc: any, item: any) => {
                            if (!acc[item.channel_name]) {
                              acc[item.channel_name] = { revenue: 0, spend: 0, conversions: 0, clicks: 0 };
                            }
                            const metricLower = item.metric_name.toLowerCase();
                            // Recognize revenue, sales, or attributed revenue
                            if (metricLower.includes('revenue') || metricLower.includes('sales') || metricLower.includes('total $') || metricLower.includes('attributed')) {
                              acc[item.channel_name].revenue = item.metric_value;
                            }
                            if (metricLower.includes('spend') || metricLower.includes('cost')) {
                              acc[item.channel_name].spend = item.metric_value;
                            }
                            if (metricLower.includes('conversion')) {
                              acc[item.channel_name].conversions = item.metric_value;
                            }
                            if (metricLower.includes('click')) {
                              acc[item.channel_name].clicks = item.metric_value;
                            }
                            return acc;
                          }, {})
                        ).map(([channel, data]: [string, any]) => {
                          const roi = data.spend > 0 ? ((data.revenue - data.spend) / data.spend * 100) : 0;
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
                                {channel === 'Google Ads' && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Spend:</span>
                                  <span className="text-red-600">{formatCurrency(data.spend)}</span>
                                </div>
                                )}
                                {channel === 'Google Ads' && (
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="text-muted-foreground font-semibold">ROI:</span>
                                  <span className={`font-bold text-lg flex items-center gap-1 ${roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {roi > 0 ? <ArrowUpRight className="h-4 w-4" /> : roi < 0 ? <ArrowDownRight className="h-4 w-4" /> : null}
                                    {roi.toFixed(0)}%
                                  </span>
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

                {/* Promotion Insights */}
                <PromotionInsights />

                {/* AI INSIGHTS - After Visual Overview */}
                <InsightsDisplay 
                  weekId={selectedWeekId || undefined} 
                  existingInsights={weekData.insights}
                  onGenerate={() => fetchWeekData(selectedWeekId!)}
                />
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
                      <div className="grid gap-4 md:grid-cols-3">
                          {metrics
                            .filter((metric: any) => {
                              // Hide spend metrics for all channels except Google Ads
                              const metricLower = metric.metric_name.toLowerCase();
                              const isSpend = metricLower.includes('spend') || metricLower.includes('cost');
                              if (isSpend && channel !== 'Google Ads') {
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

                            const isCurrency = metric.metric_name.toLowerCase().includes('revenue') || 
                               metric.metric_name.toLowerCase().includes('spend') || 
                                              metric.metric_name.toLowerCase().includes('cost');
                            const isRate = metric.metric_name.toLowerCase().includes('rate') ||
                                          metric.metric_name.toLowerCase().includes('roas');

                            return (
                              <div key={metric.id} className="space-y-2 p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50">
                                <p className="text-sm font-medium text-muted-foreground">{metric.metric_name}</p>
                                <div className="space-y-1">
                                  <p className="text-2xl font-bold">
                                    {isCurrency
                                      ? formatCurrency(currentValue)
                                      : isRate
                                ? metric.metric_value.toFixed(2)
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
                                        ({isCurrency ? formatCurrency(prevWeekValue) : isRate ? prevWeekValue.toFixed(2) : formatNumber(prevWeekValue)})
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
                                        ({isCurrency ? formatCurrency(yearAgoValue) : isRate ? yearAgoValue.toFixed(2) : formatNumber(yearAgoValue)})
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
              </div>
            )}
          </TabsContent>
          )}

          {/* Add Data Tab - Full Access Only */}
          {accessLevel === 'full' && (
          <TabsContent value="add-data" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Weekly Data Upload</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <DataUpload onUploadSuccess={handleUploadSuccess} />
                <GoogleDocsImport onUploadSuccess={handleUploadSuccess} />
              </div>
              <div className="mt-4">
                <DataEntryForm onSuccess={handleUploadSuccess} />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-2xl font-bold mb-4">Promotions & Discounts</h2>
              <PromotionEntryForm onSuccess={handleUploadSuccess} />
            </div>
          </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

