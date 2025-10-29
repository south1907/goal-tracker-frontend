'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGoalsQuery, useStatsOverviewQuery, useAllLogsQuery } from '@/lib/api/queries';
import { useAuthStore } from '@/lib/api/auth';
import { Goal as ApiGoal, GoalWithStats, Log as ApiLog } from '@/lib/types/api';
import { Goal as ComponentGoal, LogEntry as ComponentLogEntry } from '@/types/goal';
import { 
  calculateProgress, 
  calculatePace, 
  computeStreak 
} from '@/lib/utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverallActivityChart } from '@/components/charts/overall-activity-chart';
import { EnhancedHeatmapCalendar } from '@/components/charts/enhanced-heatmap-calendar';
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Target, 
  Calendar,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Adapter functions
function adaptApiGoalToComponentGoal(apiGoal: ApiGoal | GoalWithStats): ComponentGoal {
  return {
    id: apiGoal.id.toString(),
    name: apiGoal.name,
    description: apiGoal.description,
    emoji: apiGoal.emoji,
    type: apiGoal.goal_type,
    unit: apiGoal.unit,
    target: apiGoal.target || 0,
    timeframe: {
      type: apiGoal.timeframe_type,
      start: apiGoal.start_at,
      end: apiGoal.end_at,
      rollingDays: apiGoal.rolling_days,
      rrule: apiGoal.rrule,
    },
    privacy: apiGoal.privacy,
    status: apiGoal.status,
    settings: {
      milestones: apiGoal.settings_json?.milestones?.map((m: any) => ({
        label: m.label,
        threshold: m.threshold,
      })),
      unitPerSession: apiGoal.settings_json?.unitPerSession,
      streakRule: apiGoal.settings_json?.streakRule as "daily" | "x_per_week" | undefined,
      xPerWeek: apiGoal.settings_json?.xPerWeek,
    },
    createdAt: apiGoal.created_at,
    updatedAt: apiGoal.updated_at,
  };
}

function adaptApiLogToComponentLogEntry(apiLog: ApiLog): ComponentLogEntry {
  return {
    id: apiLog.id.toString(),
    goalId: apiLog.goal_id.toString(),
    date: apiLog.date,
    value: apiLog.value,
    note: apiLog.note,
    attachmentUrl: apiLog.attachment_url,
  };
}

export default function Stats() {
  const { isAuthenticated } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Fetch real data from API - only enable after hydration
  const { data: statsData, isLoading: statsLoading } = useStatsOverviewQuery();
  const { data: goalsData, isLoading: goalsLoading } = useGoalsQuery(
    isHydrated ? { include_stats: true } as any : undefined
  );
  const { data: allLogsData, isLoading: logsLoading } = useAllLogsQuery(
    isHydrated ? { page_size: 10000 } : undefined
  );
  
  const isLoading = !isHydrated || statsLoading || goalsLoading || logsLoading;
  
  // Convert API goals to component format
  const goals = useMemo(() => {
    if (!goalsData?.items) return [];
    return goalsData.items.map(adaptApiGoalToComponentGoal);
  }, [goalsData]);
  
  // Collect all logs from goals with stats (we'll need to fetch logs separately or use aggregated data)
  // For now, we'll calculate stats from GoalWithStats data
  const goalStats = useMemo(() => {
    if (!goalsData?.items) return [];
    
    return goalsData.items.map((apiGoal: ApiGoal | GoalWithStats) => {
      const isGoalWithStats = 'progress_pct' in apiGoal;
      const goal = adaptApiGoalToComponentGoal(apiGoal);
      
      if (isGoalWithStats) {
        const goalWithStats = apiGoal as GoalWithStats;
        return {
          goal,
          progress: goalWithStats.progress_pct / 100, // Convert to 0-1 range
          pace: goalWithStats.actual_pace,
          streak: goalWithStats.streak?.best || 0,
          currentStreak: goalWithStats.streak?.current || 0,
          logs: 0, // We don't have log count in GoalWithStats, will need separate query
        };
      }
      return {
        goal,
        progress: 0,
        pace: 0,
        streak: 0,
        currentStreak: 0,
        logs: 0,
      };
    });
  }, [goalsData]);
  
  // Calculate stats from API data
  const activeGoals = useMemo(() => {
    return goals.filter(goal => goal.status === 'active');
  }, [goals]);
  
  const completedGoals = useMemo(() => {
    return goalStats.filter(stat => stat.progress >= 1);
  }, [goalStats]);
  
  // Use stats from API
  const totalLogs = statsData?.total_logs || 0;
  const completionRate = statsData?.completion_rate || 0;
  
  // Calculate average per day (approximate)
  const daysSinceStart = useMemo(() => {
    if (!goals.length) return 30;
    const oldestGoal = goals.reduce((oldest, goal) => {
      const goalDate = new Date(goal.timeframe.start);
      const oldestDate = new Date(oldest.timeframe.start);
      return goalDate < oldestDate ? goal : oldest;
    });
    const start = new Date(oldestGoal.timeframe.start);
    const now = new Date();
    return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [goals]);
  
  const averagePerDay = daysSinceStart > 0 ? totalLogs / daysSinceStart : 0;
  
  // Find best performing goals from goalStats
  const bestProgressGoal = useMemo(() => {
    return goalStats.reduce((best, current) => 
      current.progress > best.progress ? current : best, 
      goalStats[0] || { goal: null, progress: 0, pace: 0, streak: 0, currentStreak: 0, logs: 0 }
    );
  }, [goalStats]);
  
  const longestStreakGoal = useMemo(() => {
    return goalStats.reduce((best, current) => 
      current.streak > best.streak ? current : best, 
      goalStats[0] || { goal: null, progress: 0, pace: 0, streak: 0, currentStreak: 0, logs: 0 }
    );
  }, [goalStats]);
  
  // For most active, we'll use the goal with highest actual pace
  const mostActiveGoal = useMemo(() => {
    return goalStats.reduce((best, current) => 
      current.pace > best.pace ? current : best, 
      goalStats[0] || { goal: null, progress: 0, pace: 0, streak: 0, currentStreak: 0, logs: 0 }
    );
  }, [goalStats]);
  
  // Format best day and week from stats
  const bestDayFormatted = useMemo(() => {
    if (!statsData?.best_day) return null;
    const date = new Date(statsData.best_day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [statsData]);
  
  const bestWeekFormatted = useMemo(() => {
    if (!statsData?.best_week) return null;
    const date = new Date(statsData.best_week);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [statsData]);
  
  // Convert all logs to component format for charts
  const allLogs = useMemo(() => {
    if (!allLogsData?.items) return [];
    return allLogsData.items.map(adaptApiLogToComponentLogEntry);
  }, [allLogsData]);
  
  // Show loading state (including while hydrating)
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }
  
  // Show login prompt if not authenticated (only after hydration)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-sky-100 to-teal-100 dark:from-sky-900 dark:to-teal-900 flex items-center justify-center">
            <Target className="h-12 w-12 text-sky-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Please log in
          </h3>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view statistics
          </p>
          <Link href="/login">
            <button className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg font-medium">
              Log In
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                )}
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
                    {statsData?.total_goals || goals.length}
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
                    {bestProgressGoal.goal.unit}
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
              {longestStreakGoal.goal && longestStreakGoal.streak > 0 ? (
                <Link 
                  href={`/goals/${longestStreakGoal.goal.id}`} 
                  className="block hover:opacity-80 transition-opacity"
                  prefetch={true}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{longestStreakGoal.goal.emoji}</span>
                      <span className="font-medium">{longestStreakGoal.goal.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {longestStreakGoal.streak} days
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Best streak • Current: {longestStreakGoal.currentStreak} days
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  {statsData?.longest_streak ? `${statsData.longest_streak} days across all goals` : 'No streak data'}
                </div>
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
              {mostActiveGoal.goal && mostActiveGoal.pace > 0 ? (
                <Link 
                  href={`/goals/${mostActiveGoal.goal.id}`} 
                  className="block hover:opacity-80 transition-opacity"
                  prefetch={true}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{mostActiveGoal.goal.emoji}</span>
                      <span className="font-medium">{mostActiveGoal.goal.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {mostActiveGoal.pace.toFixed(1)}/day
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Highest pace • {mostActiveGoal.goal.unit}
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">No active goals yet</div>
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
                <OverallActivityChart logs={allLogs} period={selectedPeriod} type="area" />
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
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Activity Heatmap</span>
                  {(bestDayFormatted || bestWeekFormatted) && (
                    <div className="text-xs text-muted-foreground font-normal">
                      {bestDayFormatted && `Best day: ${bestDayFormatted}`}
                      {bestDayFormatted && bestWeekFormatted && ' • '}
                      {bestWeekFormatted && `Best week: ${bestWeekFormatted}`}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allLogs.length > 0 ? (
                  <EnhancedHeatmapCalendar logs={allLogs} />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity data yet</p>
                    <p className="text-sm mt-2">Start logging to see your activity heatmap!</p>
                  </div>
                )}
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
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Streak</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goalStats.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No goals yet. Create your first goal to see statistics!
                        </td>
                      </tr>
                    ) : (
                      goalStats.map((stat) => (
                        <tr 
                          key={stat.goal.id} 
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/goals/${stat.goal.id}`}
                        >
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
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {stat.pace > 0 ? `${stat.pace.toFixed(1)}/day` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-600 dark:text-gray-400">
                              {stat.streak > 0 && (
                                <div className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  <span>{stat.streak} days</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stat.progress >= 1 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : stat.goal.status === 'ended'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {stat.progress >= 1 ? 'Completed' : stat.goal.status === 'ended' ? 'Ended' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
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
