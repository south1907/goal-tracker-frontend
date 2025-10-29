'use client';

import { motion } from 'framer-motion';
import { LogEntry } from '@/types/goal';
import { formatDate } from '@/lib/utils/calculations';
import { cn } from '@/lib/utils';

interface EnhancedHeatmapCalendarProps {
  logs: LogEntry[];
}

export function EnhancedHeatmapCalendar({ logs }: EnhancedHeatmapCalendarProps) {
  // Generate last 90 days
  const today = new Date();
  const days = Array.from({ length: 90 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (89 - i));
    return date;
  });

  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    const dateStr = formatDate(log.date);
    acc[dateStr] = (acc[dateStr] || 0) + log.value;
    return acc;
  }, {} as Record<string, number>);

  // Calculate intensity levels
  const maxValue = Math.max(...Object.values(logsByDate), 1);
  const getIntensity = (value: number) => {
    if (value === 0) return 0;
    return Math.min(Math.ceil((value / maxValue) * 4), 4);
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-gray-100 dark:bg-gray-800';
      case 1: return 'bg-green-200 dark:bg-green-900';
      case 2: return 'bg-green-300 dark:bg-green-800';
      case 3: return 'bg-green-400 dark:bg-green-700';
      case 4: return 'bg-green-500 dark:bg-green-600';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  // Group days by weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Last 90 days
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((intensity) => (
                <div
                  key={intensity}
                  className={cn(
                    'w-3 h-3 rounded-sm',
                    getIntensityColor(intensity)
                  )}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-fit">
            {weeks.map((week, weekIndex) => (
              <motion.div
                key={weekIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: weekIndex * 0.05 }}
                className="flex flex-col gap-1"
              >
                {week.map((day, dayIndex) => {
                  const dateStr = formatDate(day);
                  const value = logsByDate[dateStr] || 0;
                  const intensity = getIntensity(value);
                  const isToday = day.toDateString() === today.toDateString();
                  
                  return (
                    <motion.div
                      key={dayIndex}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative group"
                    >
                      <div
                        className={cn(
                          'w-3 h-3 rounded-sm cursor-pointer transition-all duration-200',
                          getIntensityColor(intensity),
                          isToday && 'ring-2 ring-blue-500 ring-offset-1',
                          value > 0 && 'hover:shadow-md'
                        )}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                        <div className="font-medium">{day.toLocaleDateString()}</div>
                        <div>{value} {value === 1 ? 'entry' : 'entries'}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {Object.keys(logsByDate).length}
            </div>
            <div className="text-xs text-muted-foreground">Active days</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {Object.values(logsByDate).reduce((sum, val) => sum + val, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total entries</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {Math.round((Object.keys(logsByDate).length / 90) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Consistency</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
