'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient?: string;
  delay?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  gradient = 'from-sky-500 to-teal-500',
  delay = 0,
  className
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn(
        'glass-card border-0 overflow-hidden group hover:shadow-medium transition-all duration-300',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r',
                  gradient,
                  'text-white shadow-sm'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground/70">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-baseline gap-2">
                <motion.div
                  className="text-2xl font-bold text-foreground"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: delay + 0.1 }}
                >
                  {value}
                </motion.div>
                
                {trend && trendValue && (
                  <motion.span
                    className={cn('text-sm font-medium', trendColors[trend])}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: delay + 0.2 }}
                  >
                    {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
