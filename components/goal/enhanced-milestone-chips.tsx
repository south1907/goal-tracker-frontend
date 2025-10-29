'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Milestone } from '@/types/goal';
import { Badge } from '@/components/ui/badge';
// import { Confetti } from '@/components/ui/confetti';
import { cn } from '@/lib/utils';

interface EnhancedMilestoneChipsProps {
  milestones: Milestone[];
  currentProgress: number;
}

export function EnhancedMilestoneChips({ milestones, currentProgress }: EnhancedMilestoneChipsProps) {
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [reachedMilestones, setReachedMilestones] = useState<string[]>([]);
  
  useEffect(() => {
    if (!milestones || !Array.isArray(milestones)) return;
    
    const newlyReached = milestones
      .filter(milestone => currentProgress >= milestone.threshold)
      .map(milestone => milestone.label);
    
    const hasNewMilestone = newlyReached.some(milestone => !reachedMilestones.includes(milestone));
    
    if (hasNewMilestone) {
      setTriggerConfetti(true);
      setReachedMilestones(newlyReached);
    }
  }, [currentProgress, milestones, reachedMilestones]);
  
  const sortedMilestones = [...(milestones || [])].sort((a, b) => a.threshold - b.threshold);
  
  const getMilestoneGradient = (milestone: Milestone, isReached: boolean, isNext: boolean) => {
    if (isReached) {
      return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg';
    }
    if (isNext) {
      return 'bg-gradient-to-r from-blue-400 to-sky-500 text-white ring-2 ring-blue-300 dark:ring-blue-700 shadow-md';
    }
    return 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-400';
  };
  
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No milestones defined for this goal</p>
      </div>
    );
  }

  return (
    <>
      {/* <Confetti trigger={triggerConfetti} onComplete={() => setTriggerConfetti(false)} /> */}
      <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {sortedMilestones.map((milestone, index) => {
            const isReached = currentProgress >= milestone.threshold;
            const isNext = !isReached && index === sortedMilestones.findIndex(m => currentProgress < m.threshold);
            
            return (
              <motion.div
                key={milestone.label}
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 200
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant="secondary"
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full border-0 transition-all duration-300',
                    getMilestoneGradient(milestone, isReached, isNext),
                    isReached && 'animate-pulse shadow-lg',
                    isNext && 'animate-pulse-glow'
                  )}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  >
                    {milestone.label}
                  </motion.span>
                  
                  {isReached && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1 + 0.3,
                        type: 'spring',
                        stiffness: 200
                      }}
                      className="ml-2"
                    >
                      ✨
                    </motion.span>
                  )}
                  
                  {isNext && (
                    <motion.span
                      className="ml-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🎯
                    </motion.span>
                  )}
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
