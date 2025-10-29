'use client';

import { motion } from 'framer-motion';
import { Goal } from '@/types/goal';
import { LogEntry } from '@/types/goal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatDate } from '@/lib/utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EnhancedChartProgressProps {
  goal: Goal;
  logs: LogEntry[];
}

export function EnhancedChartProgress({ goal, logs }: EnhancedChartProgressProps) {
  // Group logs by date and calculate cumulative progress
  const chartData = logs
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc, log) => {
      const date = formatDate(log.date);
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.value += log.value;
      } else {
        acc.push({
          date,
          value: log.value,
          cumulative: 0
        });
      }
      
      return acc;
    }, [] as Array<{ date: string; value: number; cumulative: number }>)
    .map((item, index, array) => {
      const cumulative = array.slice(0, index + 1).reduce((sum, d) => sum + d.value, 0);
      return {
        ...item,
        cumulative: Math.min(cumulative, goal.target)
      };
    });

  // Calculate trend
  const trend = chartData.length > 1 
    ? chartData[chartData.length - 1].cumulative - chartData[0].cumulative
    : 0;
  
  const isPositiveTrend = trend >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="h-80"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9"/>
              <stop offset="100%" stopColor="#14b8a6"/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, goal.target]}
          />
          
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {label}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-500 to-teal-500"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Progress: <span className="font-semibold">{payload[0].value}</span>
                      </p>
                    </div>
                  </motion.div>
                );
              }
              return null;
            }}
          />
          
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            fill="url(#progressGradient)"
            dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Trend Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-center gap-2 mt-4"
      >
        {isPositiveTrend ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${
          isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {isPositiveTrend ? 'On track' : 'Behind schedule'}
        </span>
      </motion.div>
    </motion.div>
  );
}
