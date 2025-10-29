'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { Goal } from '@/types/goal';
import { calculateProgress } from '@/lib/utils/calculations';
import { useEffect, useState, useMemo } from 'react';

interface EnhancedProgressRingProps {
  goal: Goal;
  logs: any[];
  size?: number;
  strokeWidth?: number;
  showAnimation?: boolean;
}

export function EnhancedProgressRing({ 
  goal, 
  logs, 
  size = 200, 
  strokeWidth = 12,
  showAnimation = true
}: EnhancedProgressRingProps) {
  // Create a unique key based on logs data to detect changes FIRST
  const logsKey = useMemo(() => 
    logs.map(log => `${log.id}-${log.value}-${log.date}`).join(','), 
    [logs]
  );
  
  // Use useMemo to recalculate progress when logs change - include logsKey to detect data changes
  const progress = useMemo(() => {
    return calculateProgress(goal, logs);
  }, [goal, logs, logsKey]);
  
  // Calculate percentage directly from current and target values to ensure it updates correctly
  const percentageValue = useMemo(() => 
    progress.target > 0 
      ? Math.min((progress.current / progress.target) * 100, 100) 
      : 0,
    [progress.current, progress.target]
  );
  const percentage = Math.round(percentageValue);
  const percentageDecimal = useMemo(() => 
    progress.target > 0 
      ? Math.min(progress.current / progress.target, 1) 
      : 0,
    [progress.current, progress.target]
  );
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  
  // Initialize animated progress state - will be updated via useEffect
  const [animatedProgress, setAnimatedProgress] = useState(() => percentageDecimal);
  
  const springProgress = useSpring(animatedProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const strokeDashoffset = useTransform(
    springProgress,
    (value) => {
      const offset = circumference - (Math.max(0, Math.min(1, value)) * circumference);
      return offset;
    }
  );
  
  // Update animated progress whenever percentageDecimal changes (this triggers the animation)
  // Also watch logsKey to ensure we update when log values change
  useEffect(() => {
    setAnimatedProgress(percentageDecimal);
  }, [percentageDecimal, logsKey]);
  
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
          key={`enhanced-progress-${progress.current}-${progress.target}-${logsKey}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray,
            strokeDashoffset,
          }}
          className="drop-shadow-sm"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <motion.div
            className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 20,
              delay: 0.5 
            }}
          >
            {percentage}%
          </motion.div>
          
          <div className="text-sm text-muted-foreground mt-1">
            <div className="font-semibold">{progress.current}</div>
            <div>of {progress.target}</div>
          </div>
        </motion.div>
      </div>
      
      {/* Pulse effect when milestone reached */}
      {percentage >= 100 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
}
