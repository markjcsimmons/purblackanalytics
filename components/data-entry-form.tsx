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
  Instagram,
  Sparkles,
  Save,
  Calendar,
  Edit
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
  checkoutAbandonmentRate: string;
  
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
  affiliatesSignedUp: string;
  affiliatesSessions: string;
  affiliatesATC: string;
  affiliatesCheckout: string;
  affiliatesPurchases: string;
  
  // SEO
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

  // Instagram (Social Media)
  igStoriesViews: string;
  igStoriesReposts: string;
  igStoriesInteractions: string;
  igStoriesReach: string;

  igReelsViews: string;
  igReelsReposts: string;
  igReelsInteractions: string;
  igReelsReach: string;

  igPostsViews: string;
  igPostsReposts: string;
  igPostsInteractions: string;
  igPostsReach: string;

  igAccountSubscribers: string;
  igAccountViews: string;
  igAccountInteractions: string;
  
  // Top Selling Products
  products: Array<{ name: string; orders: string }>;
}

export function DataEntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  
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
    checkoutAbandonmentRate: '',
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
    affiliatesSignedUp: '',
    affiliatesSessions: '',
    affiliatesATC: '',
    affiliatesCheckout: '',
    affiliatesPurchases: '',
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

    igStoriesViews: '',
    igStoriesReposts: '',
    igStoriesInteractions: '',
    igStoriesReach: '',

    igReelsViews: '',
    igReelsReposts: '',
    igReelsInteractions: '',
    igReelsReach: '',

    igPostsViews: '',
    igPostsReposts: '',
    igPostsInteractions: '',
    igPostsReach: '',

    igAccountSubscribers: '',
    igAccountViews: '',
    igAccountInteractions: '',
    products: [{ name: '', orders: '' }],
  });

  // Fetch weeks on mount
  useEffect(() => {
    fetch('/api/weeks')
      .then(res => res.json())
      .then(data => setWeeks(data.weeks || []))
      .catch(err => console.error('Error fetching weeks:', err));
  }, []);

  // Load week data when selected
  const loadWeekData = async (weekId: number) => {
    setIsLoadingWeek(true);
    try {
      const response = await fetch(`/api/weeks/${weekId}`);
      const data = await response.json();
      
      if (data.week) {
        // Populate week info
        setFormData(prev => ({
          ...prev,
          weekStartDate: data.week.week_start_date || '',
          weekEndDate: data.week.week_end_date || '',
          notes: data.week.notes || '',
          romansRecommendations: data.week.romans_recommendations || data.week.romansRecommendations || '',
        }));

        // Populate overall metrics
        if (data.overallMetrics) {
          const metrics = data.overallMetrics.reduce((acc: any, m: any) => {
            acc[m.metric_name] = m.metric_value;
            return acc;
          }, {});
          
          setFormData(prev => ({
            ...prev,
            revenue: metrics['* Revenue']?.toString() || '',
            orders: metrics['* Orders']?.toString() || '',
            aov: metrics['* AOV']?.toString() || '',
            conversionRate: metrics['* Conversion Rate']?.toString() || '',
            sessions: metrics['* Total Sessions']?.toString() || '',
            checkoutAbandonmentRate: metrics['* Checkout Abandonment Rate']?.toString() || '',
          }));

          // Extract products
          const products = Object.entries(metrics)
            .filter(([key]) => key.startsWith('/products/'))
            .map(([key, value]) => ({
              name: key.replace('/products/', ''),
              orders: (value as number).toString()
            }));
          
          if (products.length > 0) {
            setFormData(prev => ({ ...prev, products }));
          }
        }

        // Populate marketing channels
        if (data.marketingChannels) {
          const channels = data.marketingChannels.reduce((acc: any, m: any) => {
            if (!acc[m.channel_name]) acc[m.channel_name] = {};
            acc[m.channel_name][m.metric_name] = m.metric_value;
            return acc;
          }, {});

          setFormData(prev => ({
            ...prev,
            // Google Ads
            googleAdsRevenue: channels['Google Ads']?.['* Sales']?.toString() || '',
            googleAdsSpend: channels['Google Ads']?.['* Spend']?.toString() || '',
            googleAdsClicks: channels['Google Ads']?.['* Clicks']?.toString() || '',
            googleAdsConversions: channels['Google Ads']?.['* Conversions']?.toString() || '',
            googleAdsSessions: channels['Google Ads']?.['* Sessions']?.toString() || '',
            // Email & SMS
            emailRevenue: channels['Email & SMS']?.['* Revenue']?.toString() || '',
            emailSpend: channels['Email & SMS']?.['* Spend']?.toString() || '',
            emailOpenRate: channels['Email & SMS']?.['* Email open rate']?.toString() || '',
            emailCTR: channels['Email & SMS']?.['* CTR']?.toString() || '',
            // Affiliates
            affiliatesRevenue: channels['Affiliates']?.['* Revenue']?.toString() || '',
            affiliatesSpend: channels['Affiliates']?.['* Spend']?.toString() || '',
            affiliatesClicks: channels['Affiliates']?.['* Clicks']?.toString() || '',
            affiliatesConversions: channels['Affiliates']?.['* Conversions']?.toString() || '',
            affiliatesSignedUp: channels['Affiliates']?.['* Affiliates signed up']?.toString() || '',
            // SEO
            seoImpressions: channels['SEO']?.['* Impressions']?.toString() || '',
            seoClicks: channels['SEO']?.['* Clicks']?.toString() || '',
            seoSessions: channels['SEO']?.['* Sessions']?.toString() || '',
            seoSpend: channels['SEO']?.['* Spend']?.toString() || '',
            // Social
            socialRevenue: channels['Social']?.['* Revenue']?.toString() || '',
            socialSpend: channels['Social']?.['* Spend']?.toString() || '',
          }));
        }

        // Populate funnel metrics
        if (data.funnelMetrics) {
          const funnels = data.funnelMetrics.reduce((acc: any, m: any) => {
            if (!acc[m.stage_name]) acc[m.stage_name] = {};
            acc[m.stage_name][m.metric_name] = m.metric_value;
            return acc;
          }, {});

          setFormData(prev => ({
            ...prev,
            // Google Ads Funnel
            googleAdsSessions: funnels['Google Ads']?.['Sessions']?.toString() || '',
            googleAdsATC: funnels['Google Ads']?.['Add to Cart']?.toString() || '',
            googleAdsCheckout: funnels['Google Ads']?.['Checkout']?.toString() || '',
            googleAdsPurchases: funnels['Google Ads']?.['Purchases']?.toString() || '',
            // Email Funnel
            emailSessions: funnels['Email & SMS']?.['Sessions']?.toString() || '',
            emailATC: funnels['Email & SMS']?.['Add to Cart']?.toString() || '',
            emailCheckout: funnels['Email & SMS']?.['Checkout']?.toString() || '',
            emailPurchases: funnels['Email & SMS']?.['Purchases']?.toString() || '',
            // Affiliates Funnel
            affiliatesSessions: funnels['Affiliates']?.['Sessions']?.toString() || '',
            affiliatesATC: funnels['Affiliates']?.['Add to Cart']?.toString() || '',
            affiliatesCheckout: funnels['Affiliates']?.['Checkout']?.toString() || '',
            affiliatesPurchases: funnels['Affiliates']?.['Purchases']?.toString() || '',
            // SEO Funnel
            seoSessions: funnels['SEO']?.['Sessions']?.toString() || '',
            seoATC: funnels['SEO']?.['Add to Cart']?.toString() || '',
            seoCheckout: funnels['SEO']?.['Checkout']?.toString() || '',
            seoPurchases: funnels['SEO']?.['Purchases']?.toString() || '',
            // Social Funnel
            socialSessions: funnels['Social']?.['Sessions']?.toString() || '',
            socialATC: funnels['Social']?.['Add to Cart']?.toString() || '',
            socialCheckout: funnels['Social']?.['Checkout']?.toString() || '',
            socialPurchases: funnels['Social']?.['Purchases']?.toString() || '',
          }));
        }

        // Populate Instagram (social media) metrics
        if (data.socialMediaMetrics && Array.isArray(data.socialMediaMetrics)) {
          const sm = data.socialMediaMetrics.reduce((acc: any, m: any) => {
            const key = `${m.platform}|${m.content_type}|${m.metric_name}`;
            acc[key] = m.metric_value;
            return acc;
          }, {});

          const getSM = (platform: string, contentType: string, metric: string) =>
            sm[`${platform}|${contentType}|${metric}`];

          setFormData(prev => ({
            ...prev,
            igStoriesViews: getSM('Instagram', 'Stories', 'Views')?.toString() || '',
            igStoriesReposts: getSM('Instagram', 'Stories', 'Reposts')?.toString() || '',
            igStoriesInteractions: getSM('Instagram', 'Stories', 'Interactions')?.toString() || '',
            igStoriesReach: getSM('Instagram', 'Stories', 'Reach')?.toString() || '',

            igReelsViews: getSM('Instagram', 'Reels', 'Views')?.toString() || '',
            igReelsReposts: getSM('Instagram', 'Reels', 'Reposts')?.toString() || '',
            igReelsInteractions: getSM('Instagram', 'Reels', 'Interactions')?.toString() || '',
            igReelsReach: getSM('Instagram', 'Reels', 'Reach')?.toString() || '',

            igPostsViews: getSM('Instagram', 'Posts', 'Views')?.toString() || '',
            igPostsReposts: getSM('Instagram', 'Posts', 'Reposts')?.toString() || '',
            igPostsInteractions: getSM('Instagram', 'Posts', 'Interactions')?.toString() || '',
            igPostsReach: getSM('Instagram', 'Posts', 'Reach')?.toString() || '',

            igAccountSubscribers: getSM('Instagram', 'Account', 'Subscribers')?.toString() || '',
            igAccountViews: getSM('Instagram', 'Account', 'Views')?.toString() || '',
            igAccountInteractions: getSM('Instagram', 'Account', 'Interactions')?.toString() || '',
          }));
        }
      }
    } catch (err: any) {
      setError(`Failed to load week data: ${err.message}`);
    } finally {
      setIsLoadingWeek(false);
    }
  };

  const handleWeekChange = (weekId: string) => {
    if (weekId === 'new') {
      setSelectedWeekId(null);
      // Reset form to empty
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
        checkoutAbandonmentRate: '',
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
        affiliatesSignedUp: '',
        affiliatesSessions: '',
        affiliatesATC: '',
        affiliatesCheckout: '',
        affiliatesPurchases: '',
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

        igStoriesViews: '',
        igStoriesReposts: '',
        igStoriesInteractions: '',
        igStoriesReach: '',

        igReelsViews: '',
        igReelsReposts: '',
        igReelsInteractions: '',
        igReelsReach: '',

        igPostsViews: '',
        igPostsReposts: '',
        igPostsInteractions: '',
        igPostsReach: '',

        igAccountSubscribers: '',
        igAccountViews: '',
        igAccountInteractions: '',
        products: [{ name: '', orders: '' }],
      });
    } else {
      const id = parseInt(weekId);
      setSelectedWeekId(id);
      loadWeekData(id);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

      // Build data structure matching your database schema
      // Transform arrays to objects as expected by saveWeekData
      const overallMetricsObj: { [key: string]: number } = {};
      const overallMetricsArray = [
          { metric: '* Revenue', value: parseFloat(formData.revenue) || 0 },
          { metric: '* Orders', value: parseFloat(formData.orders) || 0 },
          { metric: '* AOV', value: parseFloat(formData.aov) || 0 },
          { metric: '* Conversion Rate', value: parseFloat(formData.conversionRate) || 0 },
          { metric: '* Total Sessions', value: parseFloat(formData.sessions) || 0 },
          { metric: '* Checkout Abandonment Rate', value: parseFloat(formData.checkoutAbandonmentRate) || 0 },
        // Add top selling products
          ...formData.products
            .filter(p => p.name.trim() && parseFloat(p.orders) > 0)
            .map(p => ({
              metric: `/products/${p.name.trim()}`,
              value: parseFloat(p.orders) || 0
            })),
      ];
      overallMetricsArray.forEach(item => {
        if (item.value > 0) {
          overallMetricsObj[item.metric] = item.value;
        }
      });

      const marketingChannelsObj: { [channel: string]: { [metric: string]: number } } = {};
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
          { channel: 'Affiliates', metric: '* Affiliates signed up', value: parseFloat(formData.affiliatesSignedUp) || 0 },
          // Social
          { channel: 'Social', metric: '* Revenue', value: parseFloat(formData.socialRevenue) || 0 },
          { channel: 'Social', metric: '* Spend', value: parseFloat(formData.socialSpend) || 0 },
          // SEO
          { channel: 'SEO', metric: '* Revenue', value: (parseFloat(formData.seoPurchases) || 0) * (parseFloat(formData.aov) || 0) },
          { channel: 'SEO', metric: '* Spend', value: parseFloat(formData.seoSpend) || 0 },
          { channel: 'SEO', metric: '* Impressions', value: parseFloat(formData.seoImpressions) || 0 },
          { channel: 'SEO', metric: '* Clicks', value: parseFloat(formData.seoClicks) || 0 },
          { channel: 'SEO', metric: '* Sessions', value: parseFloat(formData.seoSessions) || 0 },
          { channel: 'SEO', metric: '* Conversions', value: parseFloat(formData.seoPurchases) || 0 },
      ];
      marketingChannelsArray.forEach(item => {
        if (item.value > 0) {
          if (!marketingChannelsObj[item.channel]) {
            marketingChannelsObj[item.channel] = {};
          }
          marketingChannelsObj[item.channel][item.metric] = item.value;
        }
      });

      const funnelMetricsObj: { [stage: string]: { [metric: string]: number } } = {};
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
      ];
      funnelMetricsArray.forEach(item => {
        if (item.value > 0) {
          if (!funnelMetricsObj[item.stage]) {
            funnelMetricsObj[item.stage] = {};
          }
          funnelMetricsObj[item.stage][item.metric] = item.value;
        }
      });

      // Social media (Instagram) metrics
      const instagram: any = {};
      const setIG = (contentType: string, metricName: string, valueStr: string) => {
        const v = parseFloat(valueStr) || 0;
        if (v > 0) {
          if (!instagram[contentType]) instagram[contentType] = {};
          instagram[contentType][metricName] = v;
        }
      };

      setIG('Stories', 'Views', formData.igStoriesViews);
      setIG('Stories', 'Reposts', formData.igStoriesReposts);
      setIG('Stories', 'Interactions', formData.igStoriesInteractions);
      setIG('Stories', 'Reach', formData.igStoriesReach);

      setIG('Reels', 'Views', formData.igReelsViews);
      setIG('Reels', 'Reposts', formData.igReelsReposts);
      setIG('Reels', 'Interactions', formData.igReelsInteractions);
      setIG('Reels', 'Reach', formData.igReelsReach);

      setIG('Posts', 'Views', formData.igPostsViews);
      setIG('Posts', 'Reposts', formData.igPostsReposts);
      setIG('Posts', 'Interactions', formData.igPostsInteractions);
      setIG('Posts', 'Reach', formData.igPostsReach);

      setIG('Account', 'Subscribers', formData.igAccountSubscribers);
      setIG('Account', 'Views', formData.igAccountViews);
      setIG('Account', 'Interactions', formData.igAccountInteractions);

      const socialMediaObj: any = {};
      if (Object.keys(instagram).length > 0) {
        socialMediaObj['Instagram'] = instagram;
      }

        const uploadData = {
          weekStartDate: formData.weekStartDate,
          weekEndDate: formData.weekEndDate,
          notes: formData.notes,
          romansRecommendations: formData.romansRecommendations,
          overallMetrics: overallMetricsObj,
          marketingChannels: marketingChannelsObj,
          funnelMetrics: funnelMetricsObj,
          socialMedia: socialMediaObj,
          weekId: selectedWeekId || undefined,
      };

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      setSuccess(selectedWeekId ? 'Week updated successfully! 🎉' : 'Data saved successfully! 🎉');
      
      // Reset form only if creating new week
      if (!selectedWeekId) {
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
        checkoutAbandonmentRate: '',
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
        affiliatesSignedUp: '',
        affiliatesSessions: '',
        affiliatesATC: '',
        affiliatesCheckout: '',
        affiliatesPurchases: '',
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

        igStoriesViews: '',
        igStoriesReposts: '',
        igStoriesInteractions: '',
        igStoriesReach: '',

        igReelsViews: '',
        igReelsReposts: '',
        igReelsInteractions: '',
        igReelsReach: '',

        igPostsViews: '',
        igPostsReposts: '',
        igPostsInteractions: '',
        igPostsReach: '',

        igAccountSubscribers: '',
        igAccountViews: '',
        igAccountInteractions: '',
        products: [{ name: '', orders: '' }],
      });
        setSelectedWeekId(null);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Week Selector */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Select Week to Edit</CardTitle>
              <CardDescription>Choose an existing week to edit, or select "Create New Week" to add a new week</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="week-selector">Week</Label>
            <Select
              value={selectedWeekId?.toString() || 'new'}
              onValueChange={handleWeekChange}
              disabled={isLoadingWeek}
            >
              <SelectTrigger id="week-selector" className="w-full">
                <SelectValue placeholder="Select a week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">➕ Create New Week</SelectItem>
                {weeks.map((week) => (
                  <SelectItem key={week.id} value={week.id.toString()}>
                    {format(new Date(week.week_start_date), 'MMM d')} - {format(new Date(week.week_end_date), 'MMM d, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingWeek && (
              <p className="text-xs text-muted-foreground">Loading week data...</p>
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
              />
              <p className="text-xs text-muted-foreground">Select the start date for this week (can be in the past)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekEndDate">Week End Date *</Label>
              <Input
                id="weekEndDate"
                type="date"
                value={formData.weekEndDate}
                onChange={(e) => handleChange('weekEndDate', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Select the end date for this week (can be in the past)</p>
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
          <div className="space-y-2 mt-4">
            <Label htmlFor="romansRecommendations">Roman&apos;s Recommendations (Optional)</Label>
            <Textarea
              id="romansRecommendations"
              placeholder="Enter Roman's recommendations and insights for this week..."
              value={formData.romansRecommendations}
              onChange={(e) => handleChange('romansRecommendations', e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Use <strong>**bold text**</strong> for emphasis in your recommendations.
            </p>
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
            <div className="space-y-2">
              <Label htmlFor="checkoutAbandonmentRate">Checkout Abandonment Rate (%)</Label>
              <Input
                id="checkoutAbandonmentRate"
                type="number"
                step="0.01"
                placeholder="46.25"
                value={formData.checkoutAbandonmentRate}
                onChange={(e) => handleChange('checkoutAbandonmentRate', e.target.value)}
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
              <div className="space-y-2">
                <Label htmlFor="affiliatesSignedUp">Affiliates signed up</Label>
                <Input
                  id="affiliatesSignedUp"
                  type="number"
                  placeholder="0"
                  value={formData.affiliatesSignedUp}
                  onChange={(e) => handleChange('affiliatesSignedUp', e.target.value)}
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
              <div className="grid gap-4 md:grid-cols-3 mb-4">
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

      {/* Social Media (Instagram) */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center gap-3">
            <Instagram className="h-5 w-5 text-pink-600" />
            <div>
              <CardTitle>Social Media (Instagram)</CardTitle>
              <CardDescription>Weekly Instagram performance by content type</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Stories */}
          <div className="border-l-4 border-pink-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Stories</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="igStoriesViews">Views</Label>
                <Input
                  id="igStoriesViews"
                  type="number"
                  placeholder="0"
                  value={formData.igStoriesViews}
                  onChange={(e) => handleChange('igStoriesViews', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igStoriesReposts">Reposts</Label>
                <Input
                  id="igStoriesReposts"
                  type="number"
                  placeholder="0"
                  value={formData.igStoriesReposts}
                  onChange={(e) => handleChange('igStoriesReposts', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igStoriesInteractions">Interactions</Label>
                <Input
                  id="igStoriesInteractions"
                  type="number"
                  placeholder="0"
                  value={formData.igStoriesInteractions}
                  onChange={(e) => handleChange('igStoriesInteractions', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igStoriesReach">Reach</Label>
                <Input
                  id="igStoriesReach"
                  type="number"
                  placeholder="0"
                  value={formData.igStoriesReach}
                  onChange={(e) => handleChange('igStoriesReach', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Reels */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Reels</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="igReelsViews">Views</Label>
                <Input
                  id="igReelsViews"
                  type="number"
                  placeholder="0"
                  value={formData.igReelsViews}
                  onChange={(e) => handleChange('igReelsViews', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igReelsReposts">Reposts</Label>
                <Input
                  id="igReelsReposts"
                  type="number"
                  placeholder="0"
                  value={formData.igReelsReposts}
                  onChange={(e) => handleChange('igReelsReposts', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igReelsInteractions">Interactions</Label>
                <Input
                  id="igReelsInteractions"
                  type="number"
                  placeholder="0"
                  value={formData.igReelsInteractions}
                  onChange={(e) => handleChange('igReelsInteractions', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igReelsReach">Reach</Label>
                <Input
                  id="igReelsReach"
                  type="number"
                  placeholder="0"
                  value={formData.igReelsReach}
                  onChange={(e) => handleChange('igReelsReach', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="border-l-4 border-amber-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Posts</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="igPostsViews">Views</Label>
                <Input
                  id="igPostsViews"
                  type="number"
                  placeholder="0"
                  value={formData.igPostsViews}
                  onChange={(e) => handleChange('igPostsViews', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igPostsReposts">Reposts</Label>
                <Input
                  id="igPostsReposts"
                  type="number"
                  placeholder="0"
                  value={formData.igPostsReposts}
                  onChange={(e) => handleChange('igPostsReposts', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igPostsInteractions">Interactions</Label>
                <Input
                  id="igPostsInteractions"
                  type="number"
                  placeholder="0"
                  value={formData.igPostsInteractions}
                  onChange={(e) => handleChange('igPostsInteractions', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igPostsReach">Reach</Label>
                <Input
                  id="igPostsReach"
                  type="number"
                  placeholder="0"
                  value={formData.igPostsReach}
                  onChange={(e) => handleChange('igPostsReach', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="border-l-4 border-slate-500 pl-4">
            <h3 className="font-semibold text-lg mb-4">Account</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="igAccountSubscribers">Subscribers</Label>
                <Input
                  id="igAccountSubscribers"
                  type="number"
                  placeholder="0"
                  value={formData.igAccountSubscribers}
                  onChange={(e) => handleChange('igAccountSubscribers', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igAccountViews">Views</Label>
                <Input
                  id="igAccountViews"
                  type="number"
                  placeholder="0"
                  value={formData.igAccountViews}
                  onChange={(e) => handleChange('igAccountViews', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igAccountInteractions">Interactions</Label>
                <Input
                  id="igAccountInteractions"
                  type="number"
                  placeholder="0"
                  value={formData.igAccountInteractions}
                  onChange={(e) => handleChange('igAccountInteractions', e.target.value)}
                />
              </div>
            </div>
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
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Week Data'}
        </Button>
      </div>
    </form>
  );
}


