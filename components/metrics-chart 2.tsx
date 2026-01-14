'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MetricsChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  type?: 'bar' | 'line';
  color?: string;
  yAxisLabel?: string;
}

export function MetricsChart({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  type = 'bar',
  color = '#8884d8',
  yAxisLabel
}: MetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={data} margin={{ left: yAxisLabel ? 80 : 10, right: 10, top: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey}
                interval={0}
              />
              <YAxis 
                width={yAxisLabel ? 80 : 50}
                label={yAxisLabel ? { 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'left',
                  style: { textAnchor: 'middle' }
                } : undefined} 
              />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill={color} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ left: yAxisLabel ? 80 : 10, right: 10, top: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey}
                interval={0}
              />
              <YAxis 
                width={yAxisLabel ? 80 : 50}
                label={yAxisLabel ? { 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'left',
                  style: { textAnchor: 'middle' }
                } : undefined} 
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}



