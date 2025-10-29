'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { LogEntry } from '@/types/goal';

interface OverallActivityChartProps {
  logs: LogEntry[];
  period?: 'week' | 'month' | 'year';
  type?: 'bar' | 'line' | 'area';
}

export function OverallActivityChart({ logs, period = 'month', type = 'area' }: OverallActivityChartProps) {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Determine date range based on period
    const now = new Date();
    let startDate: Date;
    let days: number;
    
    switch (period) {
      case 'week':
        days = 7;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'year':
        days = 365;
        startDate = new Date(now.getFullYear(), 0, 1);
        // Group by month or week for year view
        break;
      case 'month':
      default:
        days = 30;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        break;
    }
    
    // Initialize data structure
    const dataMap: { [key: string]: { date: string; total: number; count: number; formattedDate: string } } = {};
    
    // Create all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      let formattedDate: string;
      if (period === 'year') {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short' });
      } else {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      dataMap[dateStr] = {
        date: dateStr,
        total: 0,
        count: 0,
        formattedDate,
      };
    }
    
    // Aggregate logs by date
    logs.forEach(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      if (dataMap[logDate]) {
        dataMap[logDate].total += log.value;
        dataMap[logDate].count += 1;
      }
    });
    
    // Convert to array and sort
    const data = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
    
    // For year period, group by month/week
    if (period === 'year') {
      const monthlyData: { [key: string]: { date: string; total: number; count: number; formattedDate: string } } = {};
      
      data.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: monthKey,
            total: 0,
            count: 0,
            formattedDate: monthLabel,
          };
        }
        
        monthlyData[monthKey].total += item.total;
        monthlyData[monthKey].count += item.count;
      });
      
      return Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return data;
  }, [logs, period]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {data.formattedDate}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Total: {data.total.toFixed(1)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Entries: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="mb-2">No activity data available</p>
          <p className="text-sm">Start logging to see your activity!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#8884d8" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              fill="url(#activityGradient)"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: period === 'year' ? 3 : 4 }}
            />
          </AreaChart>
        ) : type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

