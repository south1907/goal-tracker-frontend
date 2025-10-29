'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Goal, LogEntry } from '@/types/goal';
import { getActiveWindow } from '@/lib/utils/calculations';

interface ChartProgressProps {
  goal: Goal;
  logs: LogEntry[];
  type?: 'line' | 'area';
}

export function ChartProgress({ goal, logs, type = 'area' }: ChartProgressProps) {
  const chartData = useMemo(() => {
    const window = getActiveWindow(goal);
    const days = Math.ceil((window.end.getTime() - window.start.getTime()) / (24 * 60 * 60 * 1000));
    
    // Create array of all days in the window
    const data = [];
    let cumulativeTotal = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(window.start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find logs for this date
      const dayLogs = logs.filter(log => log.date.startsWith(dateStr));
      const dayTotal = dayLogs.reduce((sum, log) => sum + log.value, 0);
      
      cumulativeTotal += dayTotal;
      
      data.push({
        date: dateStr,
        day: i + 1,
        daily: dayTotal,
        cumulative: cumulativeTotal,
        target: goal.target,
        targetProgress: (goal.target * (i + 1)) / days,
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  }, [goal, logs]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-medium border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {data.formattedDate}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Daily: {data.daily} {goal.unit}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Total: {data.cumulative} {goal.unit}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Target: {data.targetProgress.toFixed(1)} {goal.unit}
          </p>
        </div>
      );
    }
    return null;
  };
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No data to display</p>
      </div>
    );
  }
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="targetProgress"
              stroke="#10b981"
              fill="transparent"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="targetProgress"
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
