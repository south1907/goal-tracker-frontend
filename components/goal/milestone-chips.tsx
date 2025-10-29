'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Milestone } from '@/types/goal';
import { Badge } from '@/components/ui/badge';
import { Confetti } from '@/components/ui/confetti';

interface MilestoneChipsProps {
  milestones: Milestone[];
  currentProgress: number;
}

export function MilestoneChips({ milestones, currentProgress }: MilestoneChipsProps) {
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [reachedMilestones, setReachedMilestones] = useState<string[]>([]);
  
  useEffect(() => {
    const newlyReached = milestones
      .filter(milestone => currentProgress >= milestone.threshold)
      .map(milestone => milestone.label);
    
    const hasNewMilestone = newlyReached.some(milestone => !reachedMilestones.includes(milestone));
    
    if (hasNewMilestone) {
      setTriggerConfetti(true);
      setReachedMilestones(newlyReached);
    }
  }, [currentProgress, milestones, reachedMilestones]);
  
  const sortedMilestones = [...milestones].sort((a, b) => a.threshold - b.threshold);
  
  return (
    <>
      <Confetti trigger={triggerConfetti} onComplete={() => setTriggerConfetti(false)} />
      <div className="flex flex-wrap gap-2">
        {sortedMilestones.map((milestone, index) => {
          const isReached = currentProgress >= milestone.threshold;
          const isNext = !isReached && index === sortedMilestones.findIndex(m => currentProgress < m.threshold);
          
          return (
            <motion.div
              key={milestone.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Badge
                variant={isReached ? 'default' : 'secondary'}
                className={`transition-all duration-300 ${
                  isReached
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm'
                    : isNext
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {milestone.label}
                {isReached && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="ml-1"
                  >
                    ✓
                  </motion.span>
                )}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
