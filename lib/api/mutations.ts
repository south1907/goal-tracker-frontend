/**
 * TanStack Query mutation hooks with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, ApiError } from './client';
import { queryKeys } from './queries';
import type { 
  Goal, 
  GoalCreate, 
  GoalUpdate, 
  Log, 
  LogCreate, 
  LogUpdate 
} from '../types/api';

// Goal mutations
export function useCreateGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: GoalCreate) => apiClient.createGoal(goal),
    onSuccess: (newGoal) => {
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      
      toast.success('Goal created successfully!', {
        description: `"${newGoal.name}" has been added to your goals.`,
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError 
        ? error.detail 
        : 'Failed to create goal. Please try again.';
      
      toast.error('Failed to create goal', {
        description: message,
      });
    },
  });
}

export function useUpdateGoalMutation(goalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: GoalUpdate) => apiClient.updateGoal(goalId, updates),
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goal(goalId) });

      // Snapshot previous value
      const previousGoal = queryClient.getQueryData<Goal>(queryKeys.goal(goalId));

      // Optimistically update
      if (previousGoal) {
        queryClient.setQueryData<Goal>(queryKeys.goal(goalId), {
          ...previousGoal,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousGoal };
    },
    onSuccess: (updatedGoal) => {
      // Update the cache with server response
      queryClient.setQueryData(queryKeys.goal(goalId), updatedGoal);
      
      // Invalidate goals list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      
      toast.success('Goal updated successfully!', {
        description: `"${updatedGoal.name}" has been updated.`,
      });
    },
    onError: (error, updates, context) => {
      // Rollback optimistic update
      if (context?.previousGoal) {
        queryClient.setQueryData(queryKeys.goal(goalId), context.previousGoal);
      }
      
      const message = error instanceof ApiError 
        ? error.detail 
        : 'Failed to update goal. Please try again.';
      
      toast.error('Failed to update goal', {
        description: message,
      });
    },
  });
}

export function useDeleteGoalMutation(goalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.deleteGoal(goalId),
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.goal(goalId) });
      
      // Invalidate goals list
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      
      toast.success('Goal deleted successfully!', {
        description: 'The goal has been removed from your list.',
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError 
        ? error.detail 
        : 'Failed to delete goal. Please try again.';
      
      toast.error('Failed to delete goal', {
        description: message,
      });
    },
  });
}

// Log mutations
export function useAddLogMutation(goalId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (log: LogCreate) => apiClient.addLog(goalId, log),
    onMutate: async (newLog) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.goalLogs(goalId) });

      // Snapshot previous logs
      const previousLogs = queryClient.getQueryData(queryKeys.goalLogs(goalId));

      // Create temporary ID for optimistic update
      const tempId = Date.now();
      
      // Create optimistic log entry
      const optimisticLog: Log = {
        id: tempId, // Temporary ID
        goal_id: goalId,
        user_id: 1, // Will be replaced by server
        date: newLog.date || new Date().toISOString(),
        value: newLog.value,
        note: newLog.note,
        created_at: new Date().toISOString(),
      };

      // Optimistically update logs
      queryClient.setQueryData(queryKeys.goalLogs(goalId), (old: any) => {
        if (!old) return { items: [optimisticLog], total: 1 };
        return {
          ...old,
          items: [optimisticLog, ...old.items],
          total: old.total + 1,
        };
      });

      return { previousLogs, tempId };
    },
    onSuccess: (newLog, variables, context) => {
      // Update cache with server response, replacing the optimistic log
      queryClient.setQueryData(queryKeys.goalLogs(goalId), (old: any) => {
        if (!old) return { items: [newLog], total: 1 };
        // Replace optimistic log (with tempId) with real log from server
        const items = old.items.map((log: Log) => 
          log.id === context?.tempId ? newLog : log
        );
        return {
          ...old,
          items,
        };
      });

      // Invalidate logs, progress and chart data to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.goalLogs(goalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(goalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goalChart(goalId, '', '', '') });
      
      toast.success('Log added successfully!', {
        description: `Added ${newLog.value} to your progress.`,
        action: {
          label: 'Undo',
          onClick: () => {
            // TODO: Implement undo functionality
            console.log('Undo log addition');
          },
        },
      });
    },
    onError: (error, newLog, context) => {
      // Rollback optimistic update
      if (context?.previousLogs) {
        queryClient.setQueryData(queryKeys.goalLogs(goalId), context.previousLogs);
      }
      
      const message = error instanceof ApiError 
        ? error.detail 
        : 'Failed to add log entry. Please try again.';
      
      toast.error('Failed to add log entry', {
        description: message,
      });
    },
  });
}

export function useEditLogMutation(logId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: LogUpdate) => apiClient.updateLog(logId, updates),
    onSuccess: (updatedLog) => {
      // Find and update the log in all relevant caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.goalLogs(updatedLog.goal_id) },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((log: Log) => 
              log.id === logId ? updatedLog : log
            ),
          };
        }
      );

      // Invalidate logs query to ensure fresh data for progress calculation
      queryClient.invalidateQueries({ queryKey: queryKeys.goalLogs(updatedLog.goal_id) });
      // Invalidate progress and chart data to update circle border
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(updatedLog.goal_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goalChart(updatedLog.goal_id, '', '', '') });
      
      toast.success('Log updated successfully!', {
        description: 'Your log entry has been updated.',
      });
    },
    onError: (error) => {
      const message = error instanceof ApiError 
        ? error.detail 
        : 'Failed to update log entry. Please try again.';
      
      toast.error('Failed to update log entry', {
        description: message,
      });
    },
  });
}

export function useDeleteLogMutation(logId: number, goalId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [`delete-log`, logId], // Add mutation key for deduplication
    mutationFn: () => apiClient.deleteLog(logId),
    onMutate: async () => {
      // Cancel outgoing refetches for this goal if goalId provided
      if (goalId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.goalLogs(goalId) });
        await queryClient.cancelQueries({ queryKey: queryKeys.goalProgress(goalId) });
      }

      // Snapshot previous logs data
      const previousLogs = goalId 
        ? queryClient.getQueryData(queryKeys.goalLogs(goalId))
        : null;
      return { previousLogs, goalId };
    },
    onSuccess: (_, __, context) => {
      // Use unique toast ID to prevent duplicates - call this first before any async operations
      const toastId = `delete-log-${logId}`;
      
      if (context?.goalId) {
        const goalId = context.goalId;
        
        // Optimistically remove from logs cache
        queryClient.setQueryData(queryKeys.goalLogs(goalId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((log: Log) => log.id !== logId),
            total: Math.max(0, old.total - 1),
          };
        });

        // Invalidate logs, progress and chart data for this goal
        queryClient.invalidateQueries({ queryKey: queryKeys.goalLogs(goalId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(goalId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.goalChart(goalId, '', '', '') });
      } else {
        // Fallback: invalidate all logs queries if goalId not provided
        // Use predicate to match all goal logs queries
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key.length >= 3 && key[0] === 'goals' && key[2] === 'logs';
          }
        });
      }
      
      // Also invalidate general queries
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      
      // Show toast with unique ID to prevent duplicates
      toast.success('Log deleted successfully!', {
        description: 'The log entry has been removed.',
        id: toastId,
      });
    },
    onError: (error, _, context) => {
      // If log not found (404), treat it as a soft success - log is already gone
      if (error instanceof ApiError && (error.detail?.includes('not found') || error.status === 404)) {
        // Log is already deleted, just refresh the list and show info message
        if (context?.goalId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.goalLogs(context.goalId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(context.goalId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.goalChart(context.goalId, '', '', '') });
        }
        
        // Show info toast instead of error - log is already gone
        toast.info('Log already removed', {
          description: 'This log entry has already been deleted.',
          id: `delete-log-info-${logId}`,
        });
        return;
      }
      
      // Rollback optimistic update for actual errors
      if (context?.previousLogs && context?.goalId) {
        queryClient.setQueryData(queryKeys.goalLogs(context.goalId), context.previousLogs);
      }
      
      // Show error for real failures
      const message = error instanceof ApiError 
        ? (error.detail || 'Failed to delete log entry. Please try again.')
        : 'Failed to delete log entry. Please try again.';
      
      toast.error('Failed to delete log entry', {
        description: message,
        id: `delete-log-error-${logId}`,
      });
    },
  });
}
