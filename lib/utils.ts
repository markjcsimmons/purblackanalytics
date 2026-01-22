import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility functions for formatting and data manipulation
 */

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Get a metric value from an array of metrics by name
 * Supports exact match, asterisk prefix, and flexible matching
 */
export function getMetricValue(metrics: any[], metricName: string): number {
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
}

/**
 * Sum funnel metrics across all stages by metric name
 */
export function getFunnelMetricSum(funnelMetrics: any[], metricName: string): number {
  if (!funnelMetrics || !Array.isArray(funnelMetrics)) return 0;
  return funnelMetrics
    .filter(m => m.metric_name === metricName)
    .reduce((sum, m) => sum + (m.metric_value || 0), 0);
}

/**
 * Get total Add to Cart across all stages
 * Handles different metric name formats
 */
export function getTotalAddToCart(funnelMetrics: any[], overallMetrics: any[]): number {
  if (!funnelMetrics || !Array.isArray(funnelMetrics)) return 0;
  
  // Try to find 'Sessions → Add to Cart' first
  const sessionsToATC = getMetricValue(funnelMetrics, 'Sessions → Add to Cart');
  if (sessionsToATC > 0) {
    return sessionsToATC;
  }
  
  // Try to calculate from Add-to-cart rate
  const atcRate = getMetricValue(funnelMetrics, 'Add-to-cart rate');
  if (atcRate > 0 && overallMetrics) {
    const totalSessions = getMetricValue(overallMetrics, 'Total Sessions');
    if (totalSessions > 0) {
      return (atcRate * totalSessions) / 100;
    }
  }
  
  // Fallback: sum all 'Add to Cart' metrics
  return funnelMetrics
    .filter(m => m.metric_name === 'Add to Cart' || m.metric_name === 'Add-to-cart rate')
    .reduce((sum, m) => {
      if (m.metric_name === 'Add-to-cart rate' && overallMetrics) {
        const totalSessions = getMetricValue(overallMetrics, 'Total Sessions');
        return sum + (totalSessions > 0 ? (m.metric_value * totalSessions) / 100 : 0);
      }
      return sum + (m.metric_value || 0);
    }, 0);
}

/**
 * Get comparison funnel metric value
 */
export function getComparisonFunnelMetric(funnelMetrics: any[], metricName: string): number {
  return getFunnelMetricSum(funnelMetrics, metricName);
}
