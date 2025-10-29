'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogEntry } from '@/types/goal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeleteLogMutation } from '@/lib/api/mutations';
import { Edit, Trash2, Calendar } from 'lucide-react';

interface LogListProps {
  goalId: string;
  logs: LogEntry[];
}

// Delete button component that handles the mutation for a specific log
function DeleteLogButton({ logId, goalId }: { logId: string; goalId: string }) {
  const numericLogId = parseInt(logId, 10);
  const numericGoalId = parseInt(goalId, 10);
  const isDeletingRef = useRef(false);
  const deleteLogMutation = useDeleteLogMutation(numericLogId, numericGoalId);
  
  // Skip delete if logId is not a valid number (might be temporary ID from optimistic update)
  if (isNaN(numericLogId) || numericLogId <= 0) {
    return null;
  }
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    // Prevent default and stop propagation to avoid multiple events
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate calls - check both ref and mutation state
    if (isDeletingRef.current || deleteLogMutation.isPending) {
      return;
    }
    
    if (confirm('Are you sure you want to delete this log entry?')) {
      // Double-check before setting flag (race condition protection)
      if (isDeletingRef.current || deleteLogMutation.isPending) {
        return;
      }
      
      isDeletingRef.current = true;
      deleteLogMutation.mutate(undefined, {
        onSettled: () => {
          // Reset the flag after mutation completes (success or error)
          setTimeout(() => {
            isDeletingRef.current = false;
          }, 1000);
        }
      });
    }
  }, [deleteLogMutation]);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleteLogMutation.isPending || isDeletingRef.current}
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

export function LogList({ goalId, logs }: LogListProps) {
  const [editingLog, setEditingLog] = useState<string | null>(null);
  
  const formatLogDate = (date: string) => {
    const logDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (logDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (logDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return logDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };
  
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No log entries yet</p>
        <p className="text-sm">Start logging your progress to see it here!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="hover:shadow-soft transition-shadow duration-200 bg-card dark:bg-gray-900/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      +{log.value}
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatLogDate(log.date)}
                      </div>
                      {log.note && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {log.note}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(log.date).toLocaleDateString()}
                    </Badge>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLog(log.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <DeleteLogButton logId={log.id} goalId={goalId} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
