/**
 * TanStack Query hooks for data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { 
  Goal, 
  Log, 
  ProgressStats, 
  ChartData, 
  HeatmapData, 
  OverviewStats,
  GoalFilters,
  LogFilters,
  PaginationParams,
  PaginatedResponse
} from '../types/api';

// Query keys
export const queryKeys = {
  goals: ['goals'] as const,
  goal: (id: number) => ['goals', id] as const,
  goalLogs: (id: number) => ['goals', id, 'logs'] as const,
  goalProgress: (id: number) => ['goals', id, 'progress'] as const,
  goalChart: (id: number, bucket: string, from: string, to: string) => 
    ['goals', id, 'chart', bucket, from, to] as const,
  goalHeatmap: (id: number, month: string) => 
    ['goals', id, 'heatmap', month] as const,
  stats: ['stats'] as const,
  user: ['user'] as const,
} as const;

// Goals queries
export function useGoalsQuery(filters?: GoalFilters & PaginationParams) {
  return useQuery({
    queryKey: [...queryKeys.goals, filters],
    queryFn: () => apiClient.getGoals(filters),
    enabled: apiClient.isAuthenticated(),
  });
}

export function useGoalQuery(goalId: number) {
  return useQuery({
    queryKey: queryKeys.goal(goalId),
    queryFn: () => apiClient.getGoal(goalId),
    enabled: !!goalId && apiClient.isAuthenticated(),
  });
}

// Logs queries
export function useGoalLogsQuery(goalId: number, filters?: LogFilters & PaginationParams) {
  return useQuery({
    queryKey: [...queryKeys.goalLogs(goalId), filters],
    queryFn: () => apiClient.getGoalLogs(goalId, filters),
    enabled: !!goalId && apiClient.isAuthenticated(),
  });
}

export function useAllLogsQuery(filters?: LogFilters & PaginationParams) {
  return useQuery({
    queryKey: ['logs', 'all', filters],
    queryFn: () => apiClient.getAllLogs(filters),
    enabled: apiClient.isAuthenticated(),
  });
}

// Progress queries
export function useGoalProgressQuery(goalId: number, window?: string, tz?: string) {
  return useQuery({
    queryKey: [...queryKeys.goalProgress(goalId), window, tz],
    queryFn: () => apiClient.getGoalProgress(goalId, window, tz),
    enabled: !!goalId && apiClient.isAuthenticated(),
  });
}

// Chart queries
export function useGoalChartQuery(goalId: number, bucket: string, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.goalChart(goalId, bucket, from, to),
    queryFn: () => apiClient.getGoalChart(goalId, bucket, from, to),
    enabled: !!goalId && !!bucket && !!from && !!to && apiClient.isAuthenticated(),
  });
}

// Heatmap queries
export function useGoalHeatmapQuery(goalId: number, month: string) {
  return useQuery({
    queryKey: queryKeys.goalHeatmap(goalId, month),
    queryFn: () => apiClient.getGoalHeatmap(goalId, month),
    enabled: !!goalId && !!month && apiClient.isAuthenticated(),
  });
}

// Stats queries
export function useStatsOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => apiClient.getStatsOverview(),
    enabled: apiClient.isAuthenticated(),
  });
}

// User queries
export function useUserQuery() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => apiClient.getCurrentUser(),
    enabled: apiClient.isAuthenticated(),
  });
}
