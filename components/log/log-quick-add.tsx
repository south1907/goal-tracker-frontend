'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils/calculations';
import { useAddLogMutation } from '@/lib/api/mutations';
import { Plus, Minus } from 'lucide-react';

interface LogQuickAddProps {
  goalId: string;
  defaultValue?: number;
  onSubmit?: () => void;
}

export function LogQuickAdd({ goalId, defaultValue = 1, onSubmit }: LogQuickAddProps) {
  const [value, setValue] = useState(defaultValue);
  const numericGoalId = parseInt(goalId);
  const addLogMutation = useAddLogMutation(numericGoalId);
  
  const handleSubmit = () => {
    if (value <= 0 || addLogMutation.isPending) return;
    
    addLogMutation.mutate({
      date: formatDate(new Date()),
      value,
    }, {
      onSuccess: () => {
        // Reset value to default after successful submission
        setValue(defaultValue);
        onSubmit?.();
      }
    });
  };
  
  const increment = () => setValue(prev => prev + 1);
  const decrement = () => setValue(prev => Math.max(1, prev - 1));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-medium border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Value Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={decrement}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center h-8"
            min="1"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={increment}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={addLogMutation.isPending}
          className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{addLogMutation.isPending ? 'Logging...' : 'Log'}</span>
        </Button>
      </div>
    </motion.div>
  );
}
