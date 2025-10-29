'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoalsQuery } from '@/lib/api/queries';
import { useAuthStore } from '@/lib/api/auth';
import { EnhancedGoalCard } from '@/components/goal/enhanced-goal-card';
import { SummaryBar } from '@/components/dashboard/summary-bar';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Target, 
  CheckCircle, 
  Clock, 
  Plus,
  Grid3X3,
  List,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { GoalFilters, Goal as ApiGoal } from '@/lib/types/api';
import type { Goal as ComponentGoal } from '@/types/goal';

type FilterType = 'all' | 'active' | 'completed' | 'expired';
type ViewType = 'grid' | 'list';

// Adapter function to convert API goal to component goal
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
    status: apiGoal.status,
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

export function EnhancedDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewType, setViewType] = useState<ViewType>('grid');
  
  const { isAuthenticated, user } = useAuthStore();
  
  // Build filters for API query
  const apiFilters: GoalFilters = {
    ...(filter !== 'all' && { status: filter as any }),
    ...(searchTerm && { q: searchTerm }),
  };
  
  const { data: goalsData, isLoading, error } = useGoalsQuery(apiFilters);
  
  const apiGoals = goalsData?.items || [];
  const goals = apiGoals.map(adaptApiGoalToComponentGoal);
  
  const activeGoals = goals.filter((goal: ComponentGoal) => goal.status === 'active');
  const completedGoals = goals.filter((goal: ComponentGoal) => goal.status === 'ended');
  
  const filterTabs = [
    { id: 'all' as FilterType, label: 'All Goals', icon: Target, count: goals.length },
    { id: 'active' as FilterType, label: 'Active', icon: Clock, count: activeGoals.length },
    { id: 'completed' as FilterType, label: 'Completed', icon: CheckCircle, count: completedGoals.length },
  ];
  
  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-sky-100 to-teal-100 dark:from-sky-900 dark:to-teal-900 flex items-center justify-center">
            <Target className="h-12 w-12 text-sky-500" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent mb-4">
            Welcome to GoalTracker
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to start tracking your goals and building better habits
          </p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Target className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Failed to load goals
          </h1>
          <p className="text-muted-foreground mb-8">
            There was an error loading your goals. Please try again.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 bg-clip-text text-transparent">
                Welcome back, {user?.display_name}
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your progress and achieve your goals
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewType(viewType === 'grid' ? 'list' : 'grid')}
                className="glass-card border-0"
              >
                {viewType === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-card border-0"
              />
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = filter === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    'relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200',
                    'flex items-center gap-2',
                    isActive 
                      ? 'text-white bg-gradient-to-r from-sky-500 to-teal-500 shadow-md' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-gray-800/50'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'ml-1 text-xs',
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </Badge>
                  
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500"
                      layoutId="activeTab"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        
        {/* Summary Bar */}
        <SummaryBar goals={apiGoals} logs={[]} />
        
        {/* Goals Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-sky-100 to-teal-100 dark:from-sky-900 dark:to-teal-900 flex items-center justify-center">
                <Target className="h-12 w-12 text-sky-500" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? 'No goals found' : 'No goals yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first goal to get started'
                }
              </p>
              {!searchTerm && (
                <Link href="/goals/new">
                  <Button className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className={cn(
              'grid gap-6',
              viewType === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            )}>
              <AnimatePresence mode="popLayout">
                {goals.map((goal: ComponentGoal, index: number) => (
                  <EnhancedGoalCard
                    key={goal.id}
                    goal={goal}
                    index={index}
                    onClick={() => window.location.href = `/goals/${goal.id}`}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
        
        {/* Floating Action Button */}
        <FloatingActionButton 
          onClick={() => window.location.href = '/goals/new'}
        />
      </div>
    </div>
  );
}
