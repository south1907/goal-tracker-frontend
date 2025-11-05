'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { Goal as ApiGoal, Log as ApiLog } from '@/lib/types/api';
import { Goal as ComponentGoal, LogEntry as ComponentLogEntry } from '@/types/goal';
import { useGoalQuery, useGoalLogsQuery, useGoalProgressQuery } from '@/lib/api/queries';
import { useDeleteGoalMutation, useAddLogMutation } from '@/lib/api/mutations';
import { useAuthStore } from '@/lib/api/auth';
import { EnhancedProgressRing } from '@/components/goal/enhanced-progress-ring';
import { EnhancedMilestoneChips } from '@/components/goal/enhanced-milestone-chips';
import { GoalAnalytics } from '@/components/goal/goal-analytics';
import { EditGoalDialog } from '@/components/goal/edit-goal-dialog';
import { ShareGoalDialog } from '@/components/goal/share-goal-dialog';
import { LogQuickAdd } from '@/components/log/log-quick-add';
import { LogList } from '@/components/log/log-list';
import { EnhancedChartProgress } from '@/components/charts/enhanced-chart-progress';
import { EnhancedHeatmapCalendar } from '@/components/charts/enhanced-heatmap-calendar';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Share2,
  Plus, 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Trophy,
  Zap,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
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

export default function EnhancedGoalDetail() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  // Parse goalId and validate - use useMemo to ensure it updates when params change
  const { goalId, isValidGoalId } = useMemo(() => {
    const goalIdParam = params?.id as string;
    const id = goalIdParam ? parseInt(goalIdParam, 10) : 0;
    const isValid = !isNaN(id) && id > 0;
    return { goalId: id, isValidGoalId: isValid };
  }, [params?.id]);
  
  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // API queries - only enable if goalId is valid and after hydration
  const { data: goal, isLoading: goalLoading, error: goalError } = useGoalQuery(
    isValidGoalId && isHydrated ? goalId : 0
  );
  const { data: logsData, isLoading: logsLoading } = useGoalLogsQuery(
    isValidGoalId && isHydrated ? goalId : 0
  );
  const { data: progressData, isLoading: progressLoading } = useGoalProgressQuery(
    isValidGoalId && isHydrated ? goalId : 0, 
    'last_30d', 
    'Asia/Bangkok'
  );
  
  // Mutations - only create if goalId is valid
  const deleteGoalMutation = useDeleteGoalMutation(isValidGoalId && goalId > 0 ? goalId : 0);
  const addLogMutation = useAddLogMutation(isValidGoalId && goalId > 0 ? goalId : 0);
  
  const logs = logsData?.items || [];
  
  // Convert API Goal to Component Goal
  const componentGoal = goal ? adaptApiGoalToComponentGoal(goal) : null;
  
  // Convert API Logs to Component LogEntries - use useMemo to ensure new reference when logs change
  const componentLogs = useMemo(() => {
    return logs.map(adaptApiLogToComponentLogEntry);
  }, [logs]);
  
  // Create a key based on logs to force progress ring to update when logs change
  const logsUpdateKey = useMemo(() => 
    logs.map(log => `${log.id}-${log.value}-${log.date}`).join('|'), 
    [logs]
  );
  
  // Redirect if not authenticated (only after hydration)
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);
  
  // Show error if goalId is invalid
  if (isHydrated && !isValidGoalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Target className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid Goal ID
          </h1>
          <p className="text-muted-foreground mb-8">
            The goal ID in the URL is invalid.
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Show loading while hydrating or if not authenticated
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (goalLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isHydrated && (goalError || (!goalLoading && !goal))) {
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
            The goal you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const handleDelete = async () => {
    if (!goal || !isValidGoalId || goalId <= 0) {
      toast.error('Invalid goal', {
        description: 'Cannot delete an invalid goal.',
      });
      return;
    }

    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        deleteGoalMutation.mutate(undefined, {
          onSuccess: () => {
            console.log('Delete mutation succeeded, navigating...');
            // Small delay to ensure cache is updated before navigation
            setTimeout(() => {
              router.push('/');
            }, 200);
          },
          onError: (error) => {
            // Error is already handled by the mutation, just log for debugging
            console.error('Delete goal error in handleDelete:', error);
          },
          onSettled: () => {
            console.log('Delete mutation settled');
          }
        });
      } catch (error) {
        console.error('Error calling delete mutation:', error);
        toast.error('Failed to delete goal', {
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    }
  };
  
  const handleQuickLog = (value: number, note?: string) => {
    addLogMutation.mutate({ value, note }, {
      onSuccess: () => {
        toast.success('Progress logged!', {
          description: 'Keep up the great work! 🎉',
        });
      }
    });
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
  
  if (!goal) {
    return null; // Should not happen due to earlier checks, but TypeScript needs this
  }

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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDelete}
                disabled={deleteGoalMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <GoalAnalytics
            goal={goal}
            progressData={progressData}
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
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="glass-card border-0">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <EnhancedProgressRing
                      key={`progress-ring-${logsUpdateKey}`}
                      goal={componentGoal!}
                      logs={componentLogs}
                      size={200}
                      strokeWidth={12}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Milestones */}
            {goal.settings_json?.milestones && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
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
                      milestones={goal.settings_json.milestones}
                      currentProgress={progressData?.progress_pct || 0}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Progress Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedChartProgress
                    logs={componentLogs}
                    goal={componentGoal!}
                  />
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Activity Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedHeatmapCalendar
                    logs={componentLogs}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Add */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-sky-500" />
                    Quick Add
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LogQuickAdd
                    goalId={goalId.toString()}
                  />
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatCard
                    title="Progress"
                    value={`${Math.round(progressData?.progress_pct || 0)}%`}
                    icon={TrendingUp}
                  />
                  <StatCard
                    title="Current Streak"
                    value={`${progressData?.streak?.current || 0} days`}
                    icon={Flame}
                  />
                  <StatCard
                    title="Best Streak"
                    value={`${progressData?.streak?.best || 0} days`}
                    icon={Trophy}
                  />
                  <StatCard
                    title="Total Logs"
                    value={`${logs.length}`}
                    icon={Clock}
                  />
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Recent Logs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-500" />
                    Recent Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LogList
                    logs={componentLogs.slice(0, 5)}
                    goalId={goalId.toString()}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Edit Goal Dialog */}
      <EditGoalDialog
        goal={goal}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
      
      {/* Share Goal Dialog */}
      <ShareGoalDialog
        goal={goal}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </div>
  );
}