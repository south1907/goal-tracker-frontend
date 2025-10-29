'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Goal } from '@/types/goal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateProgress, calculatePace, computeStreak, getDaysRemaining } from '@/lib/utils/calculations';
import { useGoalsStore } from '@/lib/state/use-goals';
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const logs = useGoalsStore((state) => state.logs);
  
  const goalLogs = useMemo(() => 
    logs.filter((log) => log.goalId === goal.id),
    [logs, goal.id]
  );
  
  const progress = calculateProgress(goal, goalLogs);
  const pace = calculatePace(goal, goalLogs);
  const streak = computeStreak(goal, goalLogs);
  const daysRemaining = getDaysRemaining(goal);
  
  const progressPercentage = Math.round(progress.percentage * 100);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="cursor-pointer hover:shadow-medium transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{goal.emoji}</div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {goal.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.type === 'streak' ? 'Daily streak' : `${goal.unit}`}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {progressPercentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {progress.current} / {progress.target}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-gray-200 dark:bg-gray-700"
            />
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {goal.type === 'streak' && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {streak.current} day streak
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {daysRemaining} days left
                </span>
              </div>
            </div>
            
            {/* Pace Indicator */}
            <div className="flex items-center gap-1">
              {pace.delta >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                pace.delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {pace.delta >= 0 ? '+' : ''}{pace.delta.toFixed(1)}/day
              </span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="mt-3 flex justify-end">
            <Badge 
              variant={progressPercentage >= 100 ? 'default' : 'secondary'}
              className={`text-xs ${
                progressPercentage >= 100 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}
            >
              {progressPercentage >= 100 ? 'Completed' : 'Active'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
