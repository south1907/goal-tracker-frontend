'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Goal as ApiGoal, Log as ApiLog, ProgressStats } from '@/lib/types/api';
import { Goal as ComponentGoal, LogEntry as ComponentLogEntry } from '@/types/goal';
import { apiClient } from '@/lib/api/client';
import { EnhancedProgressRing } from '@/components/goal/enhanced-progress-ring';
import { EnhancedMilestoneChips } from '@/components/goal/enhanced-milestone-chips';
import { GoalAnalytics } from '@/components/goal/goal-analytics';
import { EnhancedChartProgress } from '@/components/charts/enhanced-chart-progress';
import { EnhancedHeatmapCalendar } from '@/components/charts/enhanced-heatmap-calendar';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Trophy,
  Zap,
  Flame,
  Share2
} from 'lucide-react';
import Link from 'next/link';

// Adapter function to convert API Log to Component LogEntry
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

// Adapter function to convert API Goal to Component Goal
function adaptApiGoalToComponentGoal(apiGoal: ApiGoal): ComponentGoal {
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
    settings: {
      milestones: apiGoal.settings_json?.milestones?.map(m => ({
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

export default function SharedGoalView() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<ApiGoal | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [progressData, setProgressData] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shareToken = params?.token as string;

  useEffect(() => {
    if (shareToken) {
      loadSharedGoal();
    }
  }, [shareToken]);

  const loadSharedGoal = async () => {
    if (!shareToken) return;

    setLoading(true);
    setError(null);
    try {
      // Load goal, logs, and progress in parallel
      const [sharedGoal, logsResponse, progress] = await Promise.all([
        apiClient.getGoalByShareToken(shareToken),
        apiClient.getSharedGoalLogs(shareToken, 1, 100), // Get logs (max 100 per page)
        apiClient.getSharedGoalProgress(shareToken, 'all'),
      ]);
      
      setGoal(sharedGoal);
      // For display, we use the logs from the response
      // Progress data already includes accurate calculations based on all logs
      setLogs(logsResponse.items || []);
      setProgressData(progress);
    } catch (err: any) {
      console.error('Error loading shared goal:', err);
      setError(err.detail || 'Failed to load shared goal');
    } finally {
      setLoading(false);
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'streak': return Flame;
      case 'count': return Zap;
      case 'sum': return TrendingUp;
      case 'milestone': return Trophy;
      default: return Target;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ended': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading shared goal...</p>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Target className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Goal not found
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || 'The shared goal could not be found or is no longer available.'}
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const componentGoal = adaptApiGoalToComponentGoal(goal);
  // Convert API logs to component logs
  const componentLogs: ComponentLogEntry[] = logs.map(adaptApiLogToComponentLogEntry);

  const GoalTypeIcon = getGoalTypeIcon(goal.goal_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="h-5 w-5 text-sky-500" />
                  <span className="text-sm text-muted-foreground">Shared Goal</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent">
                  {goal.name}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {goal.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(goal.status)}>
                {goal.status}
              </Badge>
              <Badge variant="outline">
                {goal.privacy}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <GoalAnalytics
            goal={goal}
            progressData={progressData || undefined}
            logs={componentLogs}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass-card border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <EnhancedProgressRing
                      goal={componentGoal}
                      logs={componentLogs}
                      size={200}
                      strokeWidth={12}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedMilestoneChips
                    milestones={(goal.settings_json?.milestones as Array<{ label: string; threshold: number }>) || []}
                    currentProgress={progressData?.progress_pct || 0}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Goal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Type</div>
                    <div className="flex items-center gap-2">
                      <GoalTypeIcon className="h-4 w-4" />
                      <span className="font-medium capitalize">{goal.goal_type}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Target</div>
                    <div className="font-medium">
                      {goal.target ? Number(goal.target).toLocaleString() : 'N/A'} {goal.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Start Date</div>
                    <div className="font-medium">
                      {new Date(goal.start_at).toLocaleDateString()}
                    </div>
                  </div>
                  {goal.end_at && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">End Date</div>
                      <div className="font-medium">
                        {new Date(goal.end_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

