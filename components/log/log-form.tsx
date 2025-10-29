'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoalsStore } from '@/lib/state/use-goals';
import { formatDate } from '@/lib/utils/calculations';
import { LogEntry } from '@/types/goal';
import { Save, X } from 'lucide-react';

interface LogFormProps {
  goalId: string;
  log?: LogEntry;
  onSave?: () => void;
  onCancel?: () => void;
}

export function LogForm({ goalId, log, onSave, onCancel }: LogFormProps) {
  const [value, setValue] = useState(log?.value || 1);
  const [note, setNote] = useState(log?.note || '');
  const [date, setDate] = useState(log?.date || formatDate(new Date()));
  
  const addLog = useGoalsStore((state) => state.addLog);
  const editLog = useGoalsStore((state) => state.editLog);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (value <= 0) return;
    
    if (log) {
      // Editing existing log
      editLog(log.id, {
        value,
        note: note.trim() || undefined,
        date,
      });
    } else {
      // Creating new log
      addLog({
        goalId,
        value,
        note: note.trim() || undefined,
        date,
      });
    }
    
    onSave?.();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {log ? 'Edit Log Entry' : 'Add Log Entry'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            {/* Value */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Value
              </label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                required
              />
            </div>
            
            {/* Note */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Note (optional)
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about your progress..."
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {log ? 'Update' : 'Save'}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="px-4"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
