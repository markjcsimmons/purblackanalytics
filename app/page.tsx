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
import { InsightsDisplay } from '@/components/insights-display';
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

interface WeekData {
  week: any;
  overallMetrics: any[];
  marketingChannels: any[];
  funnelMetrics: any[];
  insights: any[];
  topProducts?: any[];
}

export default function Dashboard() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (error) {
      console.error('Error fetching week data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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

  const getMetricValue = (metrics: any[], metricName: string): number => {
    if (!metrics || !Array.isArray(metrics)) return 0;
    
    // Try exact match first
    let metric = metrics.find(m => m.metric_name === metricName);
    
    // If not found, try with asterisk prefix
    if (!metric) {
      metric = metrics.find(m => m.metric_name === `* ${metricName}`);
    }
    
    // If still not found, try flexible matching (contains)
    if (!metric) {
      metric = metrics.find(m => 
        m.metric_name.toLowerCase().includes(metricName.toLowerCase())
      );
    }
    
    return metric ? metric.metric_value : 0;
  };

  // Helper to sum funnel metrics across all channels for overall funnel display
  const getFunnelMetricSum = (funnelMetrics: any[], metricName: string): number => {
    if (!funnelMetrics || !Array.isArray(funnelMetrics)) return 0;
    
    // Sum the metric across all stages (channels)
    const sum = funnelMetrics
      .filter(m => {
        const metricLower = m.metric_name?.toLowerCase() || '';
        const searchLower = metricName.toLowerCase();
        return metricLower === searchLower || 
               metricLower === `* ${searchLower}` ||
               metricLower.includes(searchLower);
      })
      .reduce((sum, m) => sum + (Number(m.metric_value) || 0), 0);
    
    return isNaN(sum) ? 0 : sum;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
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
    // Then convert **text** to <strong>text</strong>
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="add-data">Add Data</TabsTrigger>
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
                      <p className="text-xs text-green-700 font-medium">
                        {getMetricValue(weekData.overallMetrics, 'Orders')} orders
                      </p>
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
                      <p className="text-xs text-blue-700 font-medium">
                        of {formatNumber(getMetricValue(weekData.overallMetrics, 'Total Sessions'))} sessions
                      </p>
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
                      <p className="text-xs text-purple-700 font-medium">
                        per order
                      </p>
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
                      <p className="text-xs text-orange-700 font-medium">
                        website visitors
                      </p>
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
                        <CardTitle className="text-xl text-amber-900">Roman's Recommendations</CardTitle>
                        <CardDescription className="text-amber-700">Expert insights and actionable recommendations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {weekData.week?.romans_recommendations ? (
                      <div className="prose prose-amber max-w-none">
                        <p 
                          className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdownBold(weekData.week.romans_recommendations)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 text-amber-300 opacity-50" />
                        <p className="text-amber-700 text-sm">
                          No recommendations added yet. Add them in the <strong>Add Data</strong> tab under "Week Information".
                        </p>
                      </div>
                    )}
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
                          <div className="text-xs text-slate-500 mt-2">Starting point</div>
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
                          <div className="text-xs font-semibold text-blue-700 mt-2">
                            {(getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') || 0).toFixed(1)}% rate
                          </div>
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
                            {(() => {
                              // Sum Checkout from all channels, or use Orders as fallback (can't purchase without checkout)
                              const checkoutSum = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                              const orders = getMetricValue(weekData.overallMetrics, 'Orders');
                              // Use checkout sum if > 0, otherwise use orders (since you can't purchase without checkout)
                              const checkoutValue = (checkoutSum > 0) ? checkoutSum : (orders || 0);
                              return formatNumber(checkoutValue);
                            })()}
                          </div>
                          <div className="text-xs font-semibold text-purple-700 mt-2">
                            {(() => {
                              const checkoutSum = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                              const orders = getMetricValue(weekData.overallMetrics, 'Orders');
                              const checkoutValue = (checkoutSum > 0) ? checkoutSum : (orders || 0);
                              const addToCartCount = getMetricValue(weekData.funnelMetrics, 'Sessions → Add to Cart') || 
                                (getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') * 
                                 getMetricValue(weekData.overallMetrics, 'Total Sessions') / 100);
                              return addToCartCount > 0 
                                ? ((checkoutValue / addToCartCount) * 100).toFixed(1)
                                : '0.0';
                            })()}% from cart
                          </div>
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
                          <div className="text-xs font-semibold text-green-700 mt-2">
                            {(() => {
                              const orders = getMetricValue(weekData.overallMetrics, 'Orders');
                              const checkoutSum = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                              const checkoutValue = (checkoutSum > 0) ? checkoutSum : (orders || 0); // Use orders as fallback
                              return checkoutValue > 0 
                                ? ((orders / checkoutValue) * 100).toFixed(1)
                                : '0.0';
                            })()}% checkout rate
                          </div>
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
                            {(() => {
                              // Get the actual Add to Cart count (same calculation as the Add to Cart card)
                              const addToCartCount = getMetricValue(weekData.funnelMetrics, 'Sessions → Add to Cart') || 
                                (getMetricValue(weekData.funnelMetrics, 'Add-to-cart rate') * 
                                 getMetricValue(weekData.overallMetrics, 'Total Sessions') / 100);
                              // Sum Checkout from all channels, or use Orders as fallback
                              const checkoutSum = getFunnelMetricSum(weekData.funnelMetrics, 'Checkout');
                              const orders = getMetricValue(weekData.overallMetrics, 'Orders');
                              // Use orders as fallback since you can't purchase without checkout
                              // But only if checkoutSum is 0 or falsy - if it's a valid number > 0, use it
                              const checkoutCount = (checkoutSum > 0) ? checkoutSum : (orders || 0);
                              
                              // Calculate abandonment: (1 - checkout/addToCart) * 100
                              // Ensure we don't divide by zero and handle edge cases
                              let abandonmentRate = '0.0';
                              if (addToCartCount > 0 && checkoutCount >= 0) {
                                const rate = (100 - ((checkoutCount / addToCartCount) * 100));
                                abandonmentRate = Math.max(0, Math.min(100, rate)).toFixed(1); // Clamp between 0-100
                              }
                              
                              return (
                                <>
                                  <span className="font-bold text-lg">{abandonmentRate}%</span>
                                  {' '}of users who added to cart didn't checkout
                                </>
                              );
                            })()}
                          </div>
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
                    {weekData.topProducts && weekData.topProducts.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {weekData.topProducts.map((product: any, idx: number) => (
                          <div key={idx} className="p-4 bg-gradient-to-r from-white to-pink-50 border-2 border-pink-200 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                                {product.rank || idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base truncate">{product.productName || product.product_name}</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Units Sold:</span>
                                <span className="font-bold text-pink-900">{formatNumber(product.unitsSold || product.units_sold || 0)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Revenue:</span>
                                <span className="font-bold text-green-700">{formatCurrency(product.revenue || 0)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No top products data available. Add them in the <strong>Add Data</strong> tab.</p>
                      </div>
                    )}
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
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Spend:</span>
                                  <span className="text-red-600">{formatCurrency(data.spend)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <span className="text-muted-foreground font-semibold">ROI:</span>
                                  <span className={`font-bold text-lg flex items-center gap-1 ${roi > 0 ? 'text-green-600' : roi < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                    {roi > 0 ? <ArrowUpRight className="h-4 w-4" /> : roi < 0 ? <ArrowDownRight className="h-4 w-4" /> : null}
                                    {roi.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>

                  </CardContent>
                </Card>

                {/* Section 3: 🎯 DETAILED FUNNEL METRICS */}
                <Card className="border-2 border-teal-100">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Detailed Funnel Metrics</CardTitle>
                        <CardDescription>Page-level insights and user behavior</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {weekData && weekData.funnelMetrics && weekData.funnelMetrics.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(
                          weekData.funnelMetrics.reduce((acc: any, item: any) => {
                            if (!acc[item.stage_name]) {
                              acc[item.stage_name] = [];
                            }
                            acc[item.stage_name].push(item);
                            return acc;
                          }, {})
                        ).map(([stage, metrics]: [string, any]) => (
                          <div key={stage} className="p-4 border-2 border-teal-200 rounded-lg bg-gradient-to-br from-white to-teal-50/30">
                            <div className="font-bold mb-3 text-teal-900 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                              {stage}
                            </div>
                            <div className="space-y-2">
                              {metrics.map((metric: any, idx: number) => {
                                // Format metric name for display
                                let displayName = metric.metric_name.replace(/^\*\s*/, '');
                                // Transform specific metric names
                                if (displayName === 'Add-to-cart rate') {
                                  displayName = 'Add to Cart Rate';
                                }
                                return (
                                <div key={idx} className="flex justify-between items-start text-sm">
                                  <span className="text-muted-foreground text-xs flex-1">
                                    {displayName}
                                  </span>
                                  <span className="font-semibold ml-2 text-teal-900">
                                    {typeof metric.metric_value === 'number' && metric.metric_value < 100 && !metric.metric_name.toLowerCase().includes('rate')
                                      ? metric.metric_value.toFixed(1)
                                      : formatNumber(metric.metric_value)}
                                    {metric.metric_name.toLowerCase().includes('rate') || metric.metric_name.toLowerCase().includes('%') ? '%' : ''}
                                  </span>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No funnel data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

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

          {/* Channels Tab */}
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
                ).map(([channel, metrics]: [string, any]) => (
                  <Card key={channel}>
                    <CardHeader>
                      <CardTitle>{channel}</CardTitle>
                      <CardDescription>Performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {metrics.map((metric: any) => (
                          <div key={metric.id} className="space-y-1">
                            <p className="text-sm text-muted-foreground">{metric.metric_name}</p>
                            <p className="text-2xl font-bold">
                              {metric.metric_name.toLowerCase().includes('revenue') || 
                               metric.metric_name.toLowerCase().includes('spend') || 
                               metric.metric_name.toLowerCase().includes('cost')
                                ? formatCurrency(metric.metric_value)
                                : metric.metric_name.toLowerCase().includes('rate') ||
                                  metric.metric_name.toLowerCase().includes('roas')
                                ? metric.metric_value.toFixed(2)
                                : formatNumber(metric.metric_value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Add Data Tab */}
          <TabsContent value="add-data" className="space-y-6">
            <Tabs defaultValue="form" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="form">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="form" className="space-y-4">
                <DataEntryForm onSuccess={handleUploadSuccess} />
              </TabsContent>
              
              <TabsContent value="csv" className="space-y-4">
                <DataUpload onUploadSuccess={handleUploadSuccess} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

