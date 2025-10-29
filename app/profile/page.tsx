'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUserQuery, useStatsOverviewQuery, useGoalsQuery } from '@/lib/api/queries';
import { useAuthStore } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar, 
  Target,
  Trophy,
  TrendingUp,
  BarChart3,
  Edit,
  LogOut,
  Loader2,
  UserCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout, isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Redirect if not authenticated (only after hydration)
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);
  
  // Fetch data only after hydration
  const { data: user, isLoading: userLoading, error: userError } = useUserQuery();
  const { data: statsData, isLoading: statsLoading } = useStatsOverviewQuery();
  const { data: goalsData, isLoading: goalsLoading } = useGoalsQuery(
    isHydrated ? {} : undefined
  );
  
  const isLoading = !isHydrated || userLoading || statsLoading || goalsLoading;
  const displayUser = user || authUser;
  
  // Show loading state (including while hydrating)
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  // Don't render if not authenticated (redirect is in progress)
  if (!isAuthenticated) {
    return null;
  }
  
  // Error state
  if (userError && !displayUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <User className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Failed to load profile
          </h3>
          <p className="text-muted-foreground mb-6">
            There was an error loading your profile information.
          </p>
          <Button onClick={() => router.push('/')} variant="outline">
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }
  
  const memberSince = displayUser?.created_at 
    ? new Date(displayUser.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Unknown';
  
  const totalGoals = goalsData?.total || 0;
  const activeGoals = statsData?.active_goals || 0;
  const completedGoals = statsData?.completed_goals || 0;
  const totalLogs = statsData?.total_logs || 0;
  const completionRate = statsData?.completion_rate || 0;
  const longestStreak = statsData?.longest_streak || 0;
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your account information.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1 flex"
          >
            <Card className="glass-card border-0 w-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <UserCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-xl">
                  {displayUser?.display_name || 'User'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium truncate">{displayUser?.email || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-muted-foreground">Member since</div>
                      <div className="font-medium">{memberSince}</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                  <div className="text-xs text-muted-foreground mb-2">User ID</div>
                  <div className="text-sm font-mono text-muted-foreground">
                    #{displayUser?.id || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* Overview Stats */}
              <Card className="glass-card border-0 flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Goals</div>
                        <div className="text-2xl font-bold">{totalGoals}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Active Goals</div>
                        <div className="text-2xl font-bold">{activeGoals}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                        <div className="text-2xl font-bold">{completedGoals}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Logs</div>
                        <div className="text-2xl font-bold">{totalLogs}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Achievements */}
              <Card className="glass-card border-0 flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {completionRate.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-muted-foreground">Longest Streak</span>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {longestStreak} days
                      </Badge>
                    </div>
                    
                    {statsData?.best_day && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-muted-foreground mb-1">Best Day</div>
                        <div className="text-sm font-medium">
                          {new Date(statsData.best_day).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                    
                    {statsData?.best_week && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-muted-foreground mb-1">Best Week</div>
                        <div className="text-sm font-medium">
                          {new Date(statsData.best_week).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

