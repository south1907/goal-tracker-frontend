'use client';

import { useMemo } from 'react';
import { LogEntry } from '@/types/goal';
import { cn } from '@/lib/utils';

interface HeatmapCalendarProps {
  logs: LogEntry[];
  year?: number;
}

export function HeatmapCalendar({ logs, year = new Date().getFullYear() }: HeatmapCalendarProps) {
  const heatmapData = useMemo(() => {
    const data: { [key: string]: number } = {};
    
    // Initialize all days of the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 0;
    }
    
    // Count logs per day
    logs.forEach(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      if (logDate.startsWith(year.toString())) {
        data[logDate] = (data[logDate] || 0) + log.value;
      }
    });
    
    return data;
  }, [logs, year]);
  
  const getIntensityClass = (value: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (value === 1) return 'bg-green-200 dark:bg-green-900';
    if (value <= 3) return 'bg-green-300 dark:bg-green-800';
    if (value <= 5) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-600';
  };
  
  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      startDay: new Date(year, index, 1).getDay(),
      daysInMonth: new Date(year, index + 1, 0).getDate()
    }));
  };
  
  const monthData = getMonthLabels();
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Activity Heatmap - {year}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 3, 5, 8].map((value) => (
              <div
                key={value}
                className={cn(
                  'w-3 h-3 rounded-sm',
                  getIntensityClass(value)
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2">
            {monthData.map((month, index) => (
              <div
                key={index}
                className="text-xs text-gray-600 dark:text-gray-400"
                style={{ width: `${(month.daysInMonth + month.startDay) * 12}px` }}
              >
                {month.month}
              </div>
            ))}
          </div>
          
          {/* Days of week labels */}
          <div className="flex mb-2">
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">S</div>
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">M</div>
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">T</div>
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">W</div>
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">T</div>
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">F</div>
            <div className="w-6 text-xs text-gray-600 dark:text-gray-400">S</div>
          </div>
          
          {/* Calendar grid */}
          <div className="flex flex-wrap gap-1">
            {monthData.map((month, monthIndex) => (
              <div key={monthIndex} className="flex flex-wrap gap-1">
                {/* Empty cells for month start */}
                {Array.from({ length: month.startDay }).map((_, index) => (
                  <div key={`empty-${monthIndex}-${index}`} className="w-3 h-3" />
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: month.daysInMonth }).map((_, dayIndex) => {
                  const day = dayIndex + 1;
                  const date = new Date(year, monthIndex, day);
                  const dateStr = date.toISOString().split('T')[0];
                  const value = heatmapData[dateStr] || 0;
                  
                  return (
                    <div
                      key={`${monthIndex}-${dayIndex}`}
                      className={cn(
                        'w-3 h-3 rounded-sm cursor-pointer hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-700 transition-all duration-200',
                        getIntensityClass(value)
                      )}
                      title={`${dateStr}: ${value} activities`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
