'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Store, 
  Megaphone, 
  Target, 
  Sparkles,
  Save,
  Calendar,
  Edit,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface FormData {
  // Week Info
  weekStartDate: string;
  weekEndDate: string;
  notes: string;
  romansRecommendations: string;
  
  // Overall Store Metrics
  revenue: string;
  orders: string;
  aov: string;
  conversionRate: string;
  sessions: string;
  
  // Google Ads
  googleAdsRevenue: string;
  googleAdsSpend: string;
  googleAdsClicks: string;
  googleAdsConversions: string;
  googleAdsSessions: string;
  googleAdsATC: string;
  googleAdsCheckout: string;
  googleAdsPurchases: string;
  
  // Email & SMS
  emailRevenue: string;
  emailSpend: string;
  emailOpenRate: string;
  emailCTR: string;
  emailSessions: string;
  emailATC: string;
  emailCheckout: string;
  emailPurchases: string;
  
  // Affiliates
  affiliatesRevenue: string;
  affiliatesSpend: string;
  affiliatesClicks: string;
  affiliatesConversions: string;
  affiliatesSessions: string;
  affiliatesATC: string;
  affiliatesCheckout: string;
  affiliatesPurchases: string;
  
  // SEO
  seoRevenue: string;
  seoImpressions: string;
  seoClicks: string;
  seoSessions: string;
  seoSpend: string;
  seoATC: string;
  seoCheckout: string;
  seoPurchases: string;
  
  // Social
  socialRevenue: string;
  socialSpend: string;
  socialSessions: string;
  socialATC: string;
  socialCheckout: string;
  socialPurchases: string;
  
  // Product Page Metrics
  productPageATCRate: string;
  productPageTimeOnPage: string;
  productPageScrollDepth: string;
  
  // Cart Metrics
  cartShippingIssues: string;
  cartAbandonment: string;
  
  // Top Products (5 products)
  topProduct1Name: string;
  topProduct1Units: string;
  topProduct1Revenue: string;
  topProduct2Name: string;
  topProduct2Units: string;
  topProduct2Revenue: string;
  topProduct3Name: string;
  topProduct3Units: string;
  topProduct3Revenue: string;
  topProduct4Name: string;
  topProduct4Units: string;
  topProduct4Revenue: string;
  topProduct5Name: string;
  topProduct5Units: string;
  topProduct5Revenue: string;
}

export function DataEntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('new');
  const [isLoadingWeekData, setIsLoadingWeekData] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    weekStartDate: '',
    weekEndDate: '',
    notes: '',
    romansRecommendations: '',
    revenue: '',
    orders: '',
    aov: '',
    conversionRate: '',
    sessions: '',
    googleAdsRevenue: '',
    googleAdsSpend: '',
    googleAdsClicks: '',
    googleAdsConversions: '',
    googleAdsSessions: '',
    googleAdsATC: '',
    googleAdsCheckout: '',
    googleAdsPurchases: '',
    emailRevenue: '',
    emailSpend: '',
    emailOpenRate: '',
    emailCTR: '',
    emailSessions: '',
    emailATC: '',
    emailCheckout: '',
    emailPurchases: '',
    affiliatesRevenue: '',
    affiliatesSpend: '',
    affiliatesClicks: '',
    affiliatesConversions: '',
    affiliatesSessions: '',
    affiliatesATC: '',
    affiliatesCheckout: '',
    affiliatesPurchases: '',
    seoRevenue: '',
    seoImpressions: '',
    seoClicks: '',
    seoSessions: '',
    seoSpend: '',
    seoATC: '',
    seoCheckout: '',
    seoPurchases: '',
    socialRevenue: '',
    socialSpend: '',
    socialSessions: '',
    socialATC: '',
    socialCheckout: '',
    socialPurchases: '',
    productPageATCRate: '',
    productPageTimeOnPage: '',
    productPageScrollDepth: '',
    cartShippingIssues: '',
    cartAbandonment: '',
    topProduct1Name: '',
    topProduct1Units: '',
    topProduct1Revenue: '',
    topProduct2Name: '',
    topProduct2Units: '',
    topProduct2Revenue: '',
    topProduct3Name: '',
    topProduct3Units: '',
    topProduct3Revenue: '',
    topProduct4Name: '',
    topProduct4Units: '',
    topProduct4Revenue: '',
    topProduct5Name: '',
    topProduct5Units: '',
    topProduct5Revenue: '',
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch weeks on component mount
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch('/api/weeks');
        const data = await response.json();
        setWeeks(data.weeks || []);
      } catch (error) {
        console.error('Error fetching weeks:', error);
      }
    };
    fetchWeeks();
  }, []);

  // Load week data when a week is selected
  useEffect(() => {
    if (selectedWeekId && selectedWeekId !== 'new') {
      loadWeekData(parseInt(selectedWeekId));
    } else {
      // Reset form for new week
      resetForm();
    }
  }, [selectedWeekId]);

  const loadWeekData = async (weekId: number) => {
    setIsLoadingWeekData(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`/api/weeks/${weekId}`);
      if (!response.ok) throw new Error('Failed to load week data');
      
      const data = await response.json();
      const week = data.week;
      const overallMetrics = data.overallMetrics || [];
      const marketingChannels = data.marketingChannels || [];
      const funnelMetrics = data.funnelMetrics || [];

      // Helper function to get metric value
      const getMetricValue = (metrics: any[], name: string): string => {
        const metric = metrics.find((m: any) => 
          m.metric_name === name || 
          m.metric_name === `* ${name}` ||
          m.metric_name.toLowerCase().includes(name.toLowerCase())
        );
        return metric ? metric.metric_value.toString() : '';
      };

      // Helper function to get channel metric value
      const getChannelMetric = (channel: string, metricName: string): string => {
        const metric = marketingChannels.find((m: any) => 
          m.channel_name === channel && 
          (m.metric_name === metricName || 
           m.metric_name === `* ${metricName}` ||
           m.metric_name.toLowerCase().includes(metricName.toLowerCase()))
        );
        return metric ? metric.metric_value.toString() : '';
      };

      // Helper function to get funnel metric value
      const getFunnelMetric = (stage: string, metricName: string): string => {
        const metric = funnelMetrics.find((m: any) => 
          m.stage_name === stage && 
          m.metric_name === metricName
        );
        return metric ? metric.metric_value.toString() : '';
      };

      // Load top products if available
      const topProducts = data.topProducts || [];
      const topProductsData: any = {
        topProduct1Name: '',
        topProduct1Units: '',
        topProduct1Revenue: '',
        topProduct2Name: '',
        topProduct2Units: '',
        topProduct2Revenue: '',
        topProduct3Name: '',
        topProduct3Units: '',
        topProduct3Revenue: '',
        topProduct4Name: '',
        topProduct4Units: '',
        topProduct4Revenue: '',
        topProduct5Name: '',
        topProduct5Units: '',
        topProduct5Revenue: '',
      };
      
      if (Array.isArray(topProducts)) {
        topProducts.forEach((product: any, index: number) => {
          const productNum = index + 1;
          if (productNum <= 5) {
            topProductsData[`topProduct${productNum}Name`] = product.productName || '';
            topProductsData[`topProduct${productNum}Units`] = product.unitsSold?.toString() || '';
            topProductsData[`topProduct${productNum}Revenue`] = product.revenue?.toString() || '';
          }
        });
      }

      // Populate form with loaded data
      setFormData({
        weekStartDate: week.week_start_date || '',
        weekEndDate: week.week_end_date || '',
        notes: week.notes || '',
        romansRecommendations: week.romans_recommendations || '',
        revenue: getMetricValue(overallMetrics, 'Revenue'),
        orders: getMetricValue(overallMetrics, 'Orders'),
        aov: getMetricValue(overallMetrics, 'AOV'),
        conversionRate: getMetricValue(overallMetrics, 'Conversion Rate'),
        sessions: getMetricValue(overallMetrics, 'Total Sessions'),
        googleAdsRevenue: getChannelMetric('Google Ads', 'Sales') || getChannelMetric('Google Ads', 'Revenue'),
        googleAdsSpend: getChannelMetric('Google Ads', 'Spend'),
        googleAdsClicks: getChannelMetric('Google Ads', 'Clicks'),
        googleAdsConversions: getChannelMetric('Google Ads', 'Conversions'),
        googleAdsSessions: getChannelMetric('Google Ads', 'Sessions'),
        googleAdsATC: getFunnelMetric('Google Ads', 'Add to Cart'),
        googleAdsCheckout: getFunnelMetric('Google Ads', 'Checkout'),
        googleAdsPurchases: getFunnelMetric('Google Ads', 'Purchases'),
        emailRevenue: getChannelMetric('Email & SMS', 'Revenue'),
        emailSpend: getChannelMetric('Email & SMS', 'Spend'),
        emailOpenRate: getChannelMetric('Email & SMS', 'Email open rate'),
        emailCTR: getChannelMetric('Email & SMS', 'CTR'),
        emailSessions: getChannelMetric('Email & SMS', 'Sessions'),
        emailATC: getFunnelMetric('Email & SMS', 'Add to Cart'),
        emailCheckout: getFunnelMetric('Email & SMS', 'Checkout'),
        emailPurchases: getFunnelMetric('Email & SMS', 'Purchases'),
        affiliatesRevenue: getChannelMetric('Affiliates', 'Revenue'),
        affiliatesSpend: getChannelMetric('Affiliates', 'Spend'),
        affiliatesClicks: getChannelMetric('Affiliates', 'Clicks'),
        affiliatesConversions: getChannelMetric('Affiliates', 'Conversions'),
        affiliatesSessions: getChannelMetric('Affiliates', 'Sessions'),
        affiliatesATC: getFunnelMetric('Affiliates', 'Add to Cart'),
        affiliatesCheckout: getFunnelMetric('Affiliates', 'Checkout'),
        affiliatesPurchases: getFunnelMetric('Affiliates', 'Purchases'),
        seoRevenue: getChannelMetric('SEO', 'Revenue'),
        seoImpressions: getChannelMetric('SEO', 'Impressions'),
        seoClicks: getChannelMetric('SEO', 'Clicks'),
        seoSessions: getChannelMetric('SEO', 'Sessions'),
        seoSpend: getChannelMetric('SEO', 'Spend'),
        seoATC: getFunnelMetric('SEO', 'Add to Cart'),
        seoCheckout: getFunnelMetric('SEO', 'Checkout'),
        seoPurchases: getFunnelMetric('SEO', 'Purchases'),
        socialRevenue: getChannelMetric('Social', 'Revenue'),
        socialSpend: getChannelMetric('Social', 'Spend'),
        socialSessions: getChannelMetric('Social', 'Sessions'),
        socialATC: getFunnelMetric('Social', 'Add to Cart'),
        socialCheckout: getFunnelMetric('Social', 'Checkout'),
        socialPurchases: getFunnelMetric('Social', 'Purchases'),
        productPageATCRate: getFunnelMetric('Product Page', '* Add-to-cart rate'),
        productPageTimeOnPage: getFunnelMetric('Product Page', '* Time on page'),
        productPageScrollDepth: getFunnelMetric('Product Page', '* Scroll depth'),
        cartShippingIssues: getFunnelMetric('Cart', '* Shipping issues'),
        cartAbandonment: getFunnelMetric('Cart', '* Abandonment rate'),
        ...topProductsData,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load week data');
    } finally {
      setIsLoadingWeekData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      weekStartDate: '',
      weekEndDate: '',
      notes: '',
      romansRecommendations: '',
      revenue: '',
      orders: '',
      aov: '',
      conversionRate: '',
      sessions: '',
      googleAdsRevenue: '',
      googleAdsSpend: '',
      googleAdsClicks: '',
      googleAdsConversions: '',
      googleAdsSessions: '',
      googleAdsATC: '',
      googleAdsCheckout: '',
      googleAdsPurchases: '',
      emailRevenue: '',
      emailSpend: '',
      emailOpenRate: '',
      emailCTR: '',
      emailSessions: '',
      emailATC: '',
      emailCheckout: '',
      emailPurchases: '',
      affiliatesRevenue: '',
      affiliatesSpend: '',
      affiliatesClicks: '',
      affiliatesConversions: '',
      affiliatesSessions: '',
      affiliatesATC: '',
      affiliatesCheckout: '',
      affiliatesPurchases: '',
      seoRevenue: '',
      seoImpressions: '',
      seoClicks: '',
      seoSessions: '',
      seoSpend: '',
      seoATC: '',
      seoCheckout: '',
      seoPurchases: '',
      socialRevenue: '',
      socialSpend: '',
      socialSessions: '',
      socialATC: '',
      socialCheckout: '',
      socialPurchases: '',
    productPageATCRate: '',
    productPageTimeOnPage: '',
    productPageScrollDepth: '',
    cartShippingIssues: '',
    cartAbandonment: '',
    topProduct1Name: '',
    topProduct1Units: '',
    topProduct1Revenue: '',
    topProduct2Name: '',
    topProduct2Units: '',
    topProduct2Revenue: '',
    topProduct3Name: '',
    topProduct3Units: '',
    topProduct3Revenue: '',
    topProduct4Name: '',
    topProduct4Units: '',
    topProduct4Revenue: '',
    topProduct5Name: '',
    topProduct5Units: '',
    topProduct5Revenue: '',
  });
  setError('');
  setSuccess('');
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.weekStartDate || !formData.weekEndDate) {
        throw new Error('Week dates are required');
      }

      // Build data structure as arrays first, then convert to objects
      const overallMetricsArray = [
        { metric: '* Revenue', value: parseFloat(formData.revenue) || 0 },
        { metric: '* Orders', value: parseFloat(formData.orders) || 0 },
        { metric: '* AOV', value: parseFloat(formData.aov) || 0 },
        { metric: '* Conversion Rate', value: parseFloat(formData.conversionRate) || 0 },
        { metric: '* Total Sessions', value: parseFloat(formData.sessions) || 0 },
      ].filter(item => item.value > 0);

      const marketingChannelsArray = [
        // Google Ads
        { channel: 'Google Ads', metric: '* Sales', value: parseFloat(formData.googleAdsRevenue) || 0 },
        { channel: 'Google Ads', metric: '* Spend', value: parseFloat(formData.googleAdsSpend) || 0 },
        { channel: 'Google Ads', metric: '* Clicks', value: parseFloat(formData.googleAdsClicks) || 0 },
        { channel: 'Google Ads', metric: '* Conversions', value: parseFloat(formData.googleAdsConversions) || 0 },
        { channel: 'Google Ads', metric: '* Sessions', value: parseFloat(formData.googleAdsSessions) || 0 },
        // Email & SMS
        { channel: 'Email & SMS', metric: '* Revenue', value: parseFloat(formData.emailRevenue) || 0 },
        { channel: 'Email & SMS', metric: '* Spend', value: parseFloat(formData.emailSpend) || 0 },
        { channel: 'Email & SMS', metric: '* Email open rate', value: parseFloat(formData.emailOpenRate) || 0 },
        { channel: 'Email & SMS', metric: '* CTR', value: parseFloat(formData.emailCTR) || 0 },
        // Affiliates
        { channel: 'Affiliates', metric: '* Revenue', value: parseFloat(formData.affiliatesRevenue) || 0 },
        { channel: 'Affiliates', metric: '* Spend', value: parseFloat(formData.affiliatesSpend) || 0 },
        { channel: 'Affiliates', metric: '* Clicks', value: parseFloat(formData.affiliatesClicks) || 0 },
        { channel: 'Affiliates', metric: '* Conversions', value: parseFloat(formData.affiliatesConversions) || 0 },
        // Social
        { channel: 'Social', metric: '* Revenue', value: parseFloat(formData.socialRevenue) || 0 },
        { channel: 'Social', metric: '* Spend', value: parseFloat(formData.socialSpend) || 0 },
        // SEO
        { channel: 'SEO', metric: '* Revenue', value: parseFloat(formData.seoRevenue) || 0 },
        { channel: 'SEO', metric: '* Spend', value: parseFloat(formData.seoSpend) || 0 },
        { channel: 'SEO', metric: '* Impressions', value: parseFloat(formData.seoImpressions) || 0 },
        { channel: 'SEO', metric: '* Clicks', value: parseFloat(formData.seoClicks) || 0 },
        { channel: 'SEO', metric: '* Sessions', value: parseFloat(formData.seoSessions) || 0 },
        { channel: 'SEO', metric: '* Conversions', value: parseFloat(formData.seoPurchases) || 0 },
      ].filter(item => item.value > 0);

      const funnelMetricsArray = [
        // Google Ads Funnel
        { stage: 'Google Ads', metric: 'Sessions', value: parseFloat(formData.googleAdsSessions) || 0 },
        { stage: 'Google Ads', metric: 'Add to Cart', value: parseFloat(formData.googleAdsATC) || 0 },
        { stage: 'Google Ads', metric: 'Checkout', value: parseFloat(formData.googleAdsCheckout) || 0 },
        { stage: 'Google Ads', metric: 'Purchases', value: parseFloat(formData.googleAdsPurchases) || 0 },
        // Email Funnel
        { stage: 'Email & SMS', metric: 'Sessions', value: parseFloat(formData.emailSessions) || 0 },
        { stage: 'Email & SMS', metric: 'Add to Cart', value: parseFloat(formData.emailATC) || 0 },
        { stage: 'Email & SMS', metric: 'Checkout', value: parseFloat(formData.emailCheckout) || 0 },
        { stage: 'Email & SMS', metric: 'Purchases', value: parseFloat(formData.emailPurchases) || 0 },
        // Affiliates Funnel
        { stage: 'Affiliates', metric: 'Sessions', value: parseFloat(formData.affiliatesSessions) || 0 },
        { stage: 'Affiliates', metric: 'Add to Cart', value: parseFloat(formData.affiliatesATC) || 0 },
        { stage: 'Affiliates', metric: 'Checkout', value: parseFloat(formData.affiliatesCheckout) || 0 },
        { stage: 'Affiliates', metric: 'Purchases', value: parseFloat(formData.affiliatesPurchases) || 0 },
        // SEO Funnel
        { stage: 'SEO', metric: 'Sessions', value: parseFloat(formData.seoSessions) || 0 },
        { stage: 'SEO', metric: 'Add to Cart', value: parseFloat(formData.seoATC) || 0 },
        { stage: 'SEO', metric: 'Checkout', value: parseFloat(formData.seoCheckout) || 0 },
        { stage: 'SEO', metric: 'Purchases', value: parseFloat(formData.seoPurchases) || 0 },
        // Social Funnel
        { stage: 'Social', metric: 'Sessions', value: parseFloat(formData.socialSessions) || 0 },
        { stage: 'Social', metric: 'Add to Cart', value: parseFloat(formData.socialATC) || 0 },
        { stage: 'Social', metric: 'Checkout', value: parseFloat(formData.socialCheckout) || 0 },
        { stage: 'Social', metric: 'Purchases', value: parseFloat(formData.socialPurchases) || 0 },
        // Product Page
        { stage: 'Product Page', metric: '* Add-to-cart rate', value: parseFloat(formData.productPageATCRate) || 0 },
        { stage: 'Product Page', metric: '* Time on page', value: parseFloat(formData.productPageTimeOnPage) || 0 },
        { stage: 'Product Page', metric: '* Scroll depth', value: parseFloat(formData.productPageScrollDepth) || 0 },
        // Cart
        { stage: 'Cart', metric: '* Shipping issues', value: parseFloat(formData.cartShippingIssues) || 0 },
        { stage: 'Cart', metric: '* Abandonment rate', value: parseFloat(formData.cartAbandonment) || 0 },
      ].filter(item => item.value > 0);

      // Convert arrays to object format expected by API
      const overallMetricsObj: { [key: string]: number } = {};
      overallMetricsArray.forEach((m: any) => {
        overallMetricsObj[m.metric] = m.value;
      });

      const marketingChannelsObj: { [channel: string]: { [metric: string]: number } } = {};
      marketingChannelsArray.forEach((m: any) => {
        if (!marketingChannelsObj[m.channel]) {
          marketingChannelsObj[m.channel] = {};
        }
        marketingChannelsObj[m.channel][m.metric] = m.value;
      });

      const funnelMetricsObj: { [stage: string]: { [metric: string]: number } } = {};
      funnelMetricsArray.forEach((m: any) => {
        if (!funnelMetricsObj[m.stage]) {
          funnelMetricsObj[m.stage] = {};
        }
        funnelMetricsObj[m.stage][m.metric] = m.value;
      });

      // Build top products array
      const topProducts = [];
      for (let i = 1; i <= 5; i++) {
        const name = formData[`topProduct${i}Name` as keyof FormData] as string;
        const units = formData[`topProduct${i}Units` as keyof FormData] as string;
        const revenue = formData[`topProduct${i}Revenue` as keyof FormData] as string;
        
        if (name && name.trim() && units && parseFloat(units) > 0) {
          topProducts.push({
            productName: name.trim(),
            unitsSold: parseInt(units) || 0,
            revenue: parseFloat(revenue) || 0,
          });
        }
      }

      const uploadData = {
        weekStartDate: formData.weekStartDate,
        weekEndDate: formData.weekEndDate,
        notes: formData.notes,
        romansRecommendations: formData.romansRecommendations,
        overallMetrics: overallMetricsObj,
        marketingChannels: marketingChannelsObj,
        funnelMetrics: funnelMetricsObj,
        topProducts: topProducts.length > 0 ? topProducts : undefined,
      };

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const isEditMode = selectedWeekId !== 'new';
      setSuccess(isEditMode ? 'Week data updated successfully! ✏️' : 'Data saved successfully! 🎉');
      
      // Refresh weeks list and reset to "new" mode after save
      const weeksResponse = await fetch('/api/weeks');
      const weeksData = await weeksResponse.json();
      setWeeks(weeksData.weeks || []);
      setSelectedWeekId('new');
      resetForm();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = selectedWeekId !== 'new';
  const selectedWeek = weeks.find(w => w.id.toString() === selectedWeekId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Week Selector */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditMode ? (
                <Edit className="h-5 w-5 text-blue-600" />
              ) : (
                <Plus className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {isEditMode ? 'Edit Existing Week' : 'Add New Week'}
                </CardTitle>
                <CardDescription>
                  {isEditMode 
                    ? `Editing: ${selectedWeek ? format(new Date(selectedWeek.week_start_date), 'MMM d') + ' - ' + format(new Date(selectedWeek.week_end_date), 'MMM d, yyyy') : ''}`
                    : 'Select a week to edit, or add a new week below'
                  }
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="weekSelector">Select Week</Label>
            <Select
              value={selectedWeekId}
              onValueChange={(value) => {
                setSelectedWeekId(value);
                setSuccess('');
                setError('');
              }}
              disabled={isLoadingWeekData}
            >
              <SelectTrigger id="weekSelector" className="w-full">
                <SelectValue placeholder="Select a week to edit or add new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>➕ Add New Week</span>
                  </div>
                </SelectItem>
                {weeks.map((week) => (
                  <SelectItem key={week.id} value={week.id.toString()}>
                    {format(new Date(week.week_start_date), 'MMM d')} - {format(new Date(week.week_end_date), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingWeekData && (
              <p className="text-xs text-muted-foreground">Loading week data...</p>
            )}
            {isEditMode && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>✏️ Edit Mode:</strong> All fields below are pre-filled with existing data. Make your changes and click "Save Data" to update.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week Info */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-600" />
            <div>
              <CardTitle>Week Information</CardTitle>
              <CardDescription>Enter the date range for this week's data. You can add historical weeks by selecting past dates.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Adding Historical Data:</strong> You can enter dates for any week (current or past). Historical weeks will appear in the week selector on the Overview page and will be used for context when generating insights.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekStartDate">Week Start Date *</Label>
              <Input
                id="weekStartDate"
                type="date"
                value={formData.weekStartDate}
                onChange={(e) => handleChange('weekStartDate', e.target.value)}
                required
                disabled={isEditMode}
                className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {isEditMode 
                  ? 'Dates cannot be changed when editing (week identifier)'
                  : 'Select the start date for this week (can be in the past)'
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekEndDate">Week End Date *</Label>
              <Input
                id="weekEndDate"
                type="date"
                value={formData.weekEndDate}
                onChange={(e) => handleChange('weekEndDate', e.target.value)}
                required
                disabled={isEditMode}
                className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {isEditMode 
                  ? 'Dates cannot be changed when editing (week identifier)'
                  : 'Select the end date for this week (can be in the past)'
                }
              </p>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="notes">Week Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="E.g., 'Black Friday sale week', 'New product launch', etc."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2 mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <Label htmlFor="romansRecommendations" className="flex items-center gap-2 text-amber-900 font-semibold">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Roman's Recommendations
            </Label>
            <Textarea
              id="romansRecommendations"
              placeholder="Enter Roman's insights and recommendations for this week..."
              value={formData.romansRecommendations}
              onChange={(e) => handleChange('romansRecommendations', e.target.value)}
              rows={5}
              className="border-amber-300 focus:border-amber-500 bg-white"
            />
            <div className="flex items-start gap-2 text-xs text-amber-800">
              <Sparkles className="h-3 w-3 mt-0.5 text-amber-600" />
              <p>These recommendations will be prominently displayed on the Overview page in a special amber-colored card.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Store Metrics */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Overall Store Metrics</CardTitle>
              <CardDescription>Total performance across all channels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                placeholder="6357.18"
                value={formData.revenue}
                onChange={(e) => handleChange('revenue', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orders">Total Orders</Label>
              <Input
                id="orders"
                type="number"
                placeholder="1947"
                value={formData.orders}
                onChange={(e) => handleChange('orders', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aov">Average Order Value ($)</Label>
              <Input
                id="aov"
                type="number"
                step="0.01"
                placeholder="108.83"
                value={formData.aov}
                onChange={(e) => handleChange('aov', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversionRate">Conversion Rate (%)</Label>
              <Input
                id="conversionRate"
                type="number"
                step="0.01"
                placeholder="2.49"
                value={formData.conversionRate}
                onChange={(e) => handleChange('conversionRate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessions">Total Sessions</Label>
              <Input
                id="sessions"
                type="number"
                placeholder="1484"
                value={formData.sessions}
                onChange={(e) => handleChange('sessions', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Channels */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Marketing Channels</CardTitle>
              <CardDescription>Performance and spend by channel (including funnel data)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Google Ads */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Google Ads</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="googleAdsRevenue">Revenue ($)</Label>
                <Input
                  id="googleAdsRevenue"
                  type="number"
                  step="0.01"
                  placeholder="858.06"
                  value={formData.googleAdsRevenue}
                  onChange={(e) => handleChange('googleAdsRevenue', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleAdsSpend">Spend ($)</Label>
                <Input
                  id="googleAdsSpend"
                  type="number"
                  step="0.01"
                  placeholder="666.69"
                  value={formData.googleAdsSpend}
                  onChange={(e) => handleChange('googleAdsSpend', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleAdsClicks">Clicks</Label>
                <Input
                  id="googleAdsClicks"
                  type="number"
                  placeholder="150"
                  value={formData.googleAdsClicks}
                  onChange={(e) => handleChange('googleAdsClicks', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleAdsConversions">Conversions</Label>
                <Input
                  id="googleAdsConversions"
                  type="number"
                  placeholder="8"
                  value={formData.googleAdsConversions}
                  onChange={(e) => handleChange('googleAdsConversions', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Funnel Metrics</p>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="googleAdsSessions">Sessions</Label>
                  <Input
                    id="googleAdsSessions"
                    type="number"
                    placeholder="107"
                    value={formData.googleAdsSessions}
                    onChange={(e) => handleChange('googleAdsSessions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleAdsATC">Add to Cart</Label>
                  <Input
                    id="googleAdsATC"
                    type="number"
                    placeholder="25"
                    value={formData.googleAdsATC}
                    onChange={(e) => handleChange('googleAdsATC', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleAdsCheckout">Checkout</Label>
                  <Input
                    id="googleAdsCheckout"
                    type="number"
                    placeholder="10"
                    value={formData.googleAdsCheckout}
                    onChange={(e) => handleChange('googleAdsCheckout', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleAdsPurchases">Purchases</Label>
                  <Input
                    id="googleAdsPurchases"
                    type="number"
                    placeholder="8"
                    value={formData.googleAdsPurchases}
                    onChange={(e) => handleChange('googleAdsPurchases', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email & SMS */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Email & SMS</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="emailRevenue">Revenue ($)</Label>
                <Input
                  id="emailRevenue"
                  type="number"
                  step="0.01"
                  placeholder="8000"
                  value={formData.emailRevenue}
                  onChange={(e) => handleChange('emailRevenue', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailSpend">Spend ($)</Label>
                <Input
                  id="emailSpend"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.emailSpend}
                  onChange={(e) => handleChange('emailSpend', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailOpenRate">Open Rate (%)</Label>
                <Input
                  id="emailOpenRate"
                  type="number"
                  step="0.01"
                  placeholder="52.5"
                  value={formData.emailOpenRate}
                  onChange={(e) => handleChange('emailOpenRate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailCTR">Click-Through Rate (%)</Label>
                <Input
                  id="emailCTR"
                  type="number"
                  step="0.01"
                  placeholder="0.801"
                  value={formData.emailCTR}
                  onChange={(e) => handleChange('emailCTR', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Funnel Metrics</p>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="emailSessions">Sessions</Label>
                  <Input
                    id="emailSessions"
                    type="number"
                    placeholder="500"
                    value={formData.emailSessions}
                    onChange={(e) => handleChange('emailSessions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailATC">Add to Cart</Label>
                  <Input
                    id="emailATC"
                    type="number"
                    placeholder="150"
                    value={formData.emailATC}
                    onChange={(e) => handleChange('emailATC', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailCheckout">Checkout</Label>
                  <Input
                    id="emailCheckout"
                    type="number"
                    placeholder="50"
                    value={formData.emailCheckout}
                    onChange={(e) => handleChange('emailCheckout', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPurchases">Purchases</Label>
                  <Input
                    id="emailPurchases"
                    type="number"
                    placeholder="30"
                    value={formData.emailPurchases}
                    onChange={(e) => handleChange('emailPurchases', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Affiliates */}
          <div className="border-l-4 border-amber-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Affiliates</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="affiliatesRevenue">Revenue ($)</Label>
                <Input
                  id="affiliatesRevenue"
                  type="number"
                  step="0.01"
                  placeholder="485.51"
                  value={formData.affiliatesRevenue}
                  onChange={(e) => handleChange('affiliatesRevenue', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliatesSpend">Spend ($)</Label>
                <Input
                  id="affiliatesSpend"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.affiliatesSpend}
                  onChange={(e) => handleChange('affiliatesSpend', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliatesClicks">Clicks</Label>
                <Input
                  id="affiliatesClicks"
                  type="number"
                  placeholder="45"
                  value={formData.affiliatesClicks}
                  onChange={(e) => handleChange('affiliatesClicks', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliatesConversions">Conversions</Label>
                <Input
                  id="affiliatesConversions"
                  type="number"
                  placeholder="6"
                  value={formData.affiliatesConversions}
                  onChange={(e) => handleChange('affiliatesConversions', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Funnel Metrics</p>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="affiliatesSessions">Sessions</Label>
                  <Input
                    id="affiliatesSessions"
                    type="number"
                    placeholder="100"
                    value={formData.affiliatesSessions}
                    onChange={(e) => handleChange('affiliatesSessions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliatesATC">Add to Cart</Label>
                  <Input
                    id="affiliatesATC"
                    type="number"
                    placeholder="20"
                    value={formData.affiliatesATC}
                    onChange={(e) => handleChange('affiliatesATC', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliatesCheckout">Checkout</Label>
                  <Input
                    id="affiliatesCheckout"
                    type="number"
                    placeholder="8"
                    value={formData.affiliatesCheckout}
                    onChange={(e) => handleChange('affiliatesCheckout', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliatesPurchases">Purchases</Label>
                  <Input
                    id="affiliatesPurchases"
                    type="number"
                    placeholder="6"
                    value={formData.affiliatesPurchases}
                    onChange={(e) => handleChange('affiliatesPurchases', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">SEO (Organic)</h3>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Channel Metrics</p>
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="seoRevenue">Revenue ($)</Label>
                  <Input
                    id="seoRevenue"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.seoRevenue}
                    onChange={(e) => handleChange('seoRevenue', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoSpend">Spend ($)</Label>
                  <Input
                    id="seoSpend"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData.seoSpend}
                    onChange={(e) => handleChange('seoSpend', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoImpressions">Impressions</Label>
                  <Input
                    id="seoImpressions"
                    type="number"
                    placeholder="6063"
                    value={formData.seoImpressions}
                    onChange={(e) => handleChange('seoImpressions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoClicks">Clicks</Label>
                  <Input
                    id="seoClicks"
                    type="number"
                    placeholder="418"
                    value={formData.seoClicks}
                    onChange={(e) => handleChange('seoClicks', e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Funnel Metrics</p>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="seoSessions">Sessions</Label>
                  <Input
                    id="seoSessions"
                    type="number"
                    placeholder="1484"
                    value={formData.seoSessions}
                    onChange={(e) => handleChange('seoSessions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoATC">Add to Cart</Label>
                  <Input
                    id="seoATC"
                    type="number"
                    placeholder="200"
                    value={formData.seoATC}
                    onChange={(e) => handleChange('seoATC', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoCheckout">Checkout</Label>
                  <Input
                    id="seoCheckout"
                    type="number"
                    placeholder="96"
                    value={formData.seoCheckout}
                    onChange={(e) => handleChange('seoCheckout', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoPurchases">Purchases</Label>
                  <Input
                    id="seoPurchases"
                    type="number"
                    placeholder="80"
                    value={formData.seoPurchases}
                    onChange={(e) => handleChange('seoPurchases', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="border-l-4 border-pink-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Social Media</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="socialRevenue">Revenue ($)</Label>
                <Input
                  id="socialRevenue"
                  type="number"
                  step="0.01"
                  placeholder="250.00"
                  value={formData.socialRevenue}
                  onChange={(e) => handleChange('socialRevenue', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialSpend">Spend ($)</Label>
                <Input
                  id="socialSpend"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.socialSpend}
                  onChange={(e) => handleChange('socialSpend', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Funnel Metrics</p>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="socialSessions">Sessions</Label>
                  <Input
                    id="socialSessions"
                    type="number"
                    placeholder="200"
                    value={formData.socialSessions}
                    onChange={(e) => handleChange('socialSessions', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialATC">Add to Cart</Label>
                  <Input
                    id="socialATC"
                    type="number"
                    placeholder="30"
                    value={formData.socialATC}
                    onChange={(e) => handleChange('socialATC', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialCheckout">Checkout</Label>
                  <Input
                    id="socialCheckout"
                    type="number"
                    placeholder="10"
                    value={formData.socialCheckout}
                    onChange={(e) => handleChange('socialCheckout', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialPurchases">Purchases</Label>
                  <Input
                    id="socialPurchases"
                    type="number"
                    placeholder="5"
                    value={formData.socialPurchases}
                    onChange={(e) => handleChange('socialPurchases', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website Experience */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-teal-600" />
            <div>
              <CardTitle>Website Experience</CardTitle>
              <CardDescription>Product page and cart metrics</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Product Page</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="productPageATCRate">Add-to-Cart Rate (%)</Label>
                  <Input
                    id="productPageATCRate"
                    type="number"
                    step="0.01"
                    placeholder="20.66"
                    value={formData.productPageATCRate}
                    onChange={(e) => handleChange('productPageATCRate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productPageTimeOnPage">Time on Page (min)</Label>
                  <Input
                    id="productPageTimeOnPage"
                    type="number"
                    step="0.1"
                    placeholder="6.0"
                    value={formData.productPageTimeOnPage}
                    onChange={(e) => handleChange('productPageTimeOnPage', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productPageScrollDepth">Scroll Depth (%)</Label>
                  <Input
                    id="productPageScrollDepth"
                    type="number"
                    step="0.1"
                    placeholder="50.0"
                    value={formData.productPageScrollDepth}
                    onChange={(e) => handleChange('productPageScrollDepth', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Cart</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cartShippingIssues">Shipping Issues (%)</Label>
                  <Input
                    id="cartShippingIssues"
                    type="number"
                    step="0.1"
                    placeholder="4.4"
                    value={formData.cartShippingIssues}
                    onChange={(e) => handleChange('cartShippingIssues', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cartAbandonment">Checkout Abandonment Rate (%)</Label>
                  <Input
                    id="cartAbandonment"
                    type="number"
                    step="0.1"
                    placeholder="65.0"
                    value={formData.cartAbandonment}
                    onChange={(e) => handleChange('cartAbandonment', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-pink-600" />
            <div>
              <CardTitle>Top 5 Selling Products</CardTitle>
              <CardDescription>Enter the top 5 products by units sold for this week</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="p-4 border-2 border-pink-200 rounded-lg bg-gradient-to-r from-white to-pink-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                    {num}
                  </div>
                  <h3 className="font-semibold text-pink-900">Product #{num}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`topProduct${num}Name`}>Product Name *</Label>
                    <Input
                      id={`topProduct${num}Name`}
                      type="text"
                      placeholder="e.g., Product Name"
                      value={formData[`topProduct${num}Name` as keyof FormData] as string}
                      onChange={(e) => handleChange(`topProduct${num}Name` as keyof FormData, e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`topProduct${num}Units`}>Units Sold *</Label>
                    <Input
                      id={`topProduct${num}Units`}
                      type="number"
                      placeholder="0"
                      value={formData[`topProduct${num}Units` as keyof FormData] as string}
                      onChange={(e) => handleChange(`topProduct${num}Units` as keyof FormData, e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`topProduct${num}Revenue`}>Revenue ($)</Label>
                    <Input
                      id={`topProduct${num}Revenue`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData[`topProduct${num}Revenue` as keyof FormData] as string}
                      onChange={(e) => handleChange(`topProduct${num}Revenue` as keyof FormData, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting || isLoadingWeekData}
          size="lg"
          className="min-w-[200px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting 
            ? 'Saving...' 
            : isEditMode 
              ? 'Update Week Data' 
              : 'Save Week Data'
          }
        </Button>
      </div>
    </form>
  );
}


