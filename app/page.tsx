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
import { DataUpload } from '@/components/data-upload';
import { GoogleDocsImport } from '@/components/google-docs-import';
import { MetricsChart } from '@/components/metrics-chart';
import { InsightsDisplay } from '@/components/insights-display';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

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

  const getChannelChartData = () => {
    if (!weekData || !weekData.marketingChannels || !Array.isArray(weekData.marketingChannels)) return [];
    
    const channelData: any = {};
    weekData.marketingChannels.forEach((item: any) => {
      if (!channelData[item.channel_name]) {
        channelData[item.channel_name] = { channel: item.channel_name };
      }
      channelData[item.channel_name][item.metric_name] = item.metric_value;
    });
    
    return Object.values(channelData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Purblack Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Marketing Intelligence Dashboard
              </p>
            </div>
            {weeks.length > 0 && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {weekData && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(getMetricValue(weekData.overallMetrics, 'Total Revenue') || 
                                       getMetricValue(weekData.overallMetrics, 'Revenue'))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Orders</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(getMetricValue(weekData.overallMetrics, 'Total Orders') || 
                                     getMetricValue(weekData.overallMetrics, 'Orders'))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(getMetricValue(weekData.overallMetrics, 'Conversion Rate') || 0).toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Website Visitors</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(getMetricValue(weekData.overallMetrics, 'Visitors') || 
                                     getMetricValue(weekData.overallMetrics, 'Total Visitors'))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                <InsightsDisplay 
                  weekId={selectedWeekId || undefined} 
                  existingInsights={weekData.insights}
                  onGenerate={() => fetchWeekData(selectedWeekId!)}
                />

                {/* Marketing Channels Overview */}
                <div className="grid gap-6 md:grid-cols-2">
                  <MetricsChart
                    title="Channel Performance"
                    description="Revenue by marketing channel"
                    data={getChannelChartData()}
                    dataKey="Revenue"
                    xAxisKey="channel"
                    type="bar"
                    color="#8b5cf6"
                  />
                  <MetricsChart
                    title="Channel Spend"
                    description="Marketing spend by channel"
                    data={getChannelChartData()}
                    dataKey="Spend"
                    xAxisKey="channel"
                    type="bar"
                    color="#3b82f6"
                  />
                </div>
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
                    <Button onClick={() => document.querySelector('[value="upload"]')?.dispatchEvent(new Event('click'))}>
                      Upload Data
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

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            {/* Upload Method Selection */}
            <Tabs defaultValue="csv" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                <TabsTrigger value="docs">Google Docs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="csv" className="mt-6">
                <DataUpload onUploadSuccess={handleUploadSuccess} />
              </TabsContent>
              
              <TabsContent value="docs" className="mt-6">
                <GoogleDocsImport onUploadSuccess={handleUploadSuccess} />
              </TabsContent>
            </Tabs>
            
            {/* CSV Format Guide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>CSV Format Guide</CardTitle>
                <CardDescription>How to structure your data file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Required Columns:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your CSV must have these four columns: <code className="bg-gray-100 px-2 py-1 rounded">Category</code>, {' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">Subcategory</code>, {' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">Metric</code>, {' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">Value</code>
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Example Data:</h4>
                  <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
{`Category,Subcategory,Metric,Value
Overall,Store,Total Revenue,45000
Overall,Store,Total Orders,120
Overall,Store,Conversion Rate,2.5
Overall,Store,Visitors,4800
Marketing,Meta Ads,Spend,5000
Marketing,Meta Ads,Revenue,15000
Marketing,Meta Ads,ROAS,3.0
Marketing,Google Ads,Spend,3000
Marketing,Google Ads,Revenue,9000
Marketing,Email & SMS,Revenue,8000
Funnel,Homepage,Visitors,4800
Funnel,Product Page,Visitors,2400
Funnel,Cart,Visitors,600
Funnel,Checkout,Visitors,150`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Categories:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Overall:</strong> Store-wide metrics (Revenue, Orders, Conversion Rate, etc.)</li>
                    <li><strong>Marketing:</strong> Channel-specific metrics (Subcategory = Channel name)</li>
                    <li><strong>Funnel:</strong> Website funnel stages (Subcategory = Stage name)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
