'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Goal } from '@/types/goal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getDaysRemaining } from '@/lib/utils/calculations';
import { useGoalProgressQuery } from '@/lib/api/queries';
import { ProgressStats } from '@/lib/types/api';
import { TrendingUp, TrendingDown, Clock, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedGoalCardProps {
  goal: Goal;
  onClick?: () => void;
  index?: number;
  progressStats?: ProgressStats; // Optional: progress stats from parent
}

export function EnhancedGoalCard({ goal, onClick, index = 0, progressStats: propProgressStats }: EnhancedGoalCardProps) {
  // Only fetch progress stats if not provided as prop (for backward compatibility)
  const numericGoalId = parseInt(goal.id, 10);
  const shouldFetch = !propProgressStats;
  const { data: fetchedProgressStats } = useGoalProgressQuery(
    shouldFetch ? numericGoalId : 0, 
    'last_30d', 
    'Asia/Bangkok'
  );
  
  // Use prop stats if available, otherwise use fetched stats
  const progressStats = propProgressStats || fetchedProgressStats;
  
  // Use API progress data or fallback to calculated values
  const progress = useMemo(() => {
    if (progressStats) {
      return {
        percentage: progressStats.progress_pct / 100, // Convert to 0-1 range
        current: Number(progressStats.achieved_value),
        target: Number(progressStats.target),
        remaining: Math.max(Number(progressStats.target) - Number(progressStats.achieved_value), 0),
      };
    }
    // Fallback when data is loading
    return {
      percentage: 0,
      current: 0,
      target: goal.target,
      remaining: goal.target,
    };
  }, [progressStats, goal.target]);
  
  const pace = useMemo(() => {
    if (progressStats) {
      return {
        delta: progressStats.actual_pace - progressStats.required_pace,
        current: progressStats.actual_pace,
        required: progressStats.required_pace,
      };
    }
    return { delta: 0, current: 0, required: 0 };
  }, [progressStats]);
  
  const streak = useMemo(() => {
    if (progressStats?.streak) {
      return {
        current: progressStats.streak.current || 0,
        longest: progressStats.streak.best || 0,
      };
    }
    return { current: 0, longest: 0 };
  }, [progressStats]);
  
  const daysRemaining = getDaysRemaining(goal);
  
  const progressPercentage = Math.round(progress.percentage * 100);
  
  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'streak': return Target;
      case 'count': return Zap;
      case 'sum': return TrendingUp;
      case 'milestone': return Target;
      default: return Target;
    }
  };
  
  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case 'streak': return 'from-orange-400 to-red-500';
      case 'count': return 'from-blue-400 to-indigo-500';
      case 'sum': return 'from-green-400 to-emerald-500';
      case 'milestone': return 'from-purple-400 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };
  
  const TypeIcon = getGoalTypeIcon(goal.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          'glass-card border-0 cursor-pointer group overflow-hidden',
          'hover:shadow-large transition-all duration-300',
          progressPercentage >= 100 && 'ring-2 ring-green-400/50'
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                className="text-3xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                {goal.emoji}
              </motion.div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {goal.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {goal.type === 'streak' ? 'Daily streak' : `${goal.unit}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <motion.div 
                className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                {progressPercentage}%
              </motion.div>
              <div className="text-sm text-muted-foreground">
                {progress.current} / {progress.target}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-gray-200 dark:bg-gray-700"
            />
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r',
                getGoalTypeColor(goal.type),
                'text-white'
              )}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {goal.type === 'streak' ? streak.current : progress.current}
                </div>
                <div className="text-xs text-muted-foreground">
                  {goal.type === 'streak' ? 'day streak' : 'current'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {daysRemaining}
                </div>
                <div className="text-xs text-muted-foreground">
                  days left
                </div>
              </div>
            </div>
          </div>
          
          {/* Pace Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pace.delta >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn(
                'text-sm font-medium',
                pace.delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {pace.delta >= 0 ? '+' : ''}{pace.delta.toFixed(1)}/day
              </span>
            </div>
            
            <Badge 
              variant={progressPercentage >= 100 ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                progressPercentage >= 100 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                  : 'bg-gradient-to-r from-blue-400 to-sky-500 text-white'
              )}
            >
              {progressPercentage >= 100 ? 'Completed' : 'Active'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
