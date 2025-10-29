'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Goal as ApiGoal } from '@/lib/types/api';
import { Target, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryBarProps {
  goals: ApiGoal[];
  totalLogs?: number;
}

export function SummaryBar({ goals, totalLogs = 0 }: SummaryBarProps) {
  const activeGoals = goals.filter(goal => goal.status === 'active');
  
  // Completed: goals with progress >= 100% (achieved)
  const completedGoals = goals.filter(goal => {
    const isGoalWithStats = 'progress_pct' in goal;
    if (isGoalWithStats) {
      return (goal as any).achieved === true; // progress >= 100%
    }
    return false;
  });
  
  const stats = [
    {
      label: 'Total Goals',
      value: goals.length,
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active Goals',
      value: activeGoals.length,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Completed',
      value: completedGoals.length,
      icon: Trophy,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Total Logs',
      value: totalLogs,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-8"
    >
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className={cn("flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700")}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}