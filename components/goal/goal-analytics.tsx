'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Flame,
  Trophy,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import type { Goal as ApiGoal, ProgressStats } from '@/lib/types/api';
import type { LogEntry } from '@/types/goal';

interface GoalAnalyticsProps {
  goal: ApiGoal;
  progressData?: ProgressStats;
  logs: LogEntry[];
}

export function GoalAnalytics({ goal, progressData, logs }: GoalAnalyticsProps) {
  // Calculate progress overview
  const progressOverview = useMemo(() => {
    const target = Number(goal.target) || 0;
    const current = progressData?.achieved_value || 0;
    const remaining = Math.max(0, target - current);
    const progressPct = progressData?.progress_pct || 0;
    
    return {
      target,
      current,
      remaining,
      progressPct,
    };
  }, [goal.target, progressData]);

  // Calculate progress by time periods
  const progressByTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    
    logs.forEach(log => {
      const logDate = new Date(log.date);
      const logValue = Number(log.value) || 0;
      
      if (logDate >= today) {
        todayTotal += logValue;
      }
      if (logDate >= weekAgo) {
        weekTotal += logValue;
      }
      if (logDate >= monthAgo) {
        monthTotal += logValue;
      }
    });
    
    return {
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
    };
  }, [logs]);

  // Get recent activity (last 10 logs)
  const recentActivity = useMemo(() => {
    return logs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [logs]);

  // Calculate milestone progress
  const milestoneProgress = useMemo(() => {
    if (!goal.settings_json?.milestones) {
      return [];
    }
    
    const progressPct = progressData?.progress_pct || 0;
    
    return goal.settings_json.milestones.map((milestone: any) => ({
      label: milestone.label,
      threshold: milestone.threshold,
      reached: progressPct >= milestone.threshold,
      current: progressPct,
    }));
  }, [goal.settings_json, progressData?.progress_pct]);

  // Format date
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  // Format time ago
  const formatTimeAgo = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Target</div>
                <div className="text-2xl font-bold">
                  {progressOverview.target.toLocaleString()} {goal.unit}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Current</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {progressOverview.current.toLocaleString()} {goal.unit}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {progressOverview.remaining.toLocaleString()} {goal.unit}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-medium">{Math.round(progressOverview.progressPct)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progressOverview.progressPct)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress by Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Progress by Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Today"
                value={`${progressByTime.today.toLocaleString()} ${goal.unit}`}
                icon={Zap}
              />
              <StatCard
                title="This Week"
                value={`${progressByTime.week.toLocaleString()} ${goal.unit}`}
                icon={Calendar}
              />
              <StatCard
                title="This Month"
                value={`${progressByTime.month.toLocaleString()} ${goal.unit}`}
                icon={TrendingUp}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak Information */}
      {progressData?.streak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Streak Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                      {progressData.streak.current || 0}
                    </div>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {progressData.streak.best || 0}
                    </div>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
              </div>
              {progressData.streak.current > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Keep it up! You're on a {progressData.streak.current} day streak! 🔥
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Milestone Progress */}
      {milestoneProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Milestone Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestoneProgress.map((milestone, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{milestone.label}</span>
                        {milestone.reached && (
                          <Badge className="bg-yellow-500 text-white">
                            <Trophy className="h-3 w-3 mr-1" />
                            Reached
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(milestone.current)}% / {milestone.threshold}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          milestone.reached
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(100, (milestone.current / milestone.threshold) * 100)}%` 
                        }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity yet. Start logging your progress!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {Number(log.value).toLocaleString()} {goal.unit}
                        </div>
                        {log.note && (
                          <div className="text-sm text-muted-foreground truncate">
                            {log.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right ml-4">
                      <div className="text-sm font-medium">
                        {formatDate(log.date)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(log.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

