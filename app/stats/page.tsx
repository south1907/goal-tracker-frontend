'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGoalsStore } from '@/lib/state/use-goals';
import { Goal, LogEntry } from '@/types/goal';
import { 
  calculateProgress, 
  calculatePace, 
  computeStreak, 
  getGoalStatus 
} from '@/lib/utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartProgress } from '@/components/charts/chart-progress';
import { HeatmapCalendar } from '@/components/charts/heatmap-calendar';
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Target, 
  Calendar,
  Clock,
  Zap
} from 'lucide-react';

export default function Stats() {
  const { goals, logs } = useGoalsStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const activeGoals = goals.filter(goal => getGoalStatus(goal, logs) === 'active');
  const completedGoals = goals.filter(goal => getGoalStatus(goal, logs) === 'completed');
  
  // Calculate overall stats
  const totalLogs = logs.length;
  const totalValue = logs.reduce((sum, log) => sum + log.value, 0);
  const averagePerDay = totalLogs > 0 ? totalValue / 30 : 0; // Rough estimate
  
  // Find best performing goals
  const goalStats = goals.map(goal => {
    const goalLogs = logs.filter(log => log.goalId === goal.id);
    const progress = calculateProgress(goal, goalLogs);
    const pace = calculatePace(goal, goalLogs);
    const streak = computeStreak(goal, goalLogs);
    
    return {
      goal,
      progress: progress.percentage,
      pace: pace.actual,
      streak: streak.best,
      logs: goalLogs.length
    };
  });
  
  const bestProgressGoal = goalStats.reduce((best, current) => 
    current.progress > best.progress ? current : best, goalStats[0] || { progress: 0 });
  
  const longestStreakGoal = goalStats.reduce((best, current) => 
    current.streak > best.streak ? current : best, goalStats[0] || { streak: 0 });
  
  const mostActiveGoal = goalStats.reduce((best, current) => 
    current.logs > best.logs ? current : best, goalStats[0] || { logs: 0 });
  
  // Calculate completion rate by period
  const completionRate = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Statistics & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your overall progress and performance across all goals.
            </p>
          </motion.div>
        </div>
        
        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>
        
        {/* Overall Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {goals.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Goals</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.round(completionRate)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalLogs}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Logs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {averagePerDay.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg/Day</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Best Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Best Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bestProgressGoal.goal ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{bestProgressGoal.goal.emoji}</span>
                    <span className="font-medium">{bestProgressGoal.goal.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(bestProgressGoal.progress * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {bestProgressGoal.logs} logs
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">No data available</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Longest Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              {longestStreakGoal.goal ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{longestStreakGoal.goal.emoji}</span>
                    <span className="font-medium">{longestStreakGoal.goal.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {longestStreakGoal.streak} days
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Best streak
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">No data available</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Most Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mostActiveGoal.goal ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{mostActiveGoal.goal.emoji}</span>
                    <span className="font-medium">{mostActiveGoal.goal.name}</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {mostActiveGoal.logs} logs
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Most logged
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Activity chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapCalendar logs={logs} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Goal Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Goal Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Goal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Progress</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Logs</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalStats.map((stat) => (
                      <tr key={stat.goal.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span>{stat.goal.emoji}</span>
                            <span className="font-medium">{stat.goal.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {Math.round(stat.progress * 100)}%
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-600 dark:text-gray-400">
                            {stat.logs}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stat.progress >= 1 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {stat.progress >= 1 ? 'Completed' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
