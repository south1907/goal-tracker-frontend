'use client';

import { motion } from 'framer-motion';
import { Goal } from '@/types/goal';
import { calculateProgress } from '@/lib/utils/calculations';
import { useMemo } from 'react';

interface GoalProgressRingProps {
  goal: Goal;
  logs: any[];
  size?: number;
  strokeWidth?: number;
}

export function GoalProgressRing({ 
  goal, 
  logs, 
  size = 120, 
  strokeWidth = 8 
}: GoalProgressRingProps) {
  // Use useMemo to recalculate progress when logs change
  const progress = useMemo(() => calculateProgress(goal, logs), [goal, logs]);
  
  // Calculate percentage directly from current and target values to ensure it updates correctly
  const percentageValue = progress.target > 0 
    ? Math.min((progress.current / progress.target) * 100, 100) 
    : 0;
  const percentage = Math.round(percentageValue);
  const percentageDecimal = progress.target > 0 
    ? Math.min(progress.current / progress.target, 1) 
    : 0;
  
  // Create a unique key based on logs data to detect changes
  const logsKey = useMemo(() => 
    logs.map(log => `${log.id}-${log.value}-${log.date}`).join(','), 
    [logs]
  );
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentageDecimal * circumference);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          key={`progress-${progress.current}-${progress.target}-${logsKey}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className="text-blue-500 dark:text-blue-400"
          style={{
            strokeDasharray,
            strokeDashoffset,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (percentageDecimal * circumference) }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-gray-100"
        >
          {percentage}%
        </motion.div>
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          <div>{progress.current}</div>
          <div>of {progress.target}</div>
        </div>
      </div>
    </div>
  );
}
