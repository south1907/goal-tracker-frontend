import { Goal, LogEntry, Timeframe, StreakData, ProgressData, PaceData } from '@/types/goal';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString();
}

export function getActiveWindow(goal: Goal): { start: Date; end: Date } {
  const now = new Date();
  
  switch (goal.timeframe.type) {
    case 'fixed':
      return {
        start: new Date(goal.timeframe.start!),
        end: new Date(goal.timeframe.end!)
      };
    
    case 'rolling':
      const rollingDays = goal.timeframe.rollingDays || 30;
      return {
        start: new Date(now.getTime() - rollingDays * 24 * 60 * 60 * 1000),
        end: now
      };
    
    case 'recurring':
      // For now, treat as rolling 30 days
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      };
    
    default:
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now
      };
  }
}

export function sumInWindow(goal: Goal, logs: LogEntry[]): number {
  const window = getActiveWindow(goal);
  return logs
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate >= window.start && logDate <= window.end;
    })
    .reduce((sum, log) => sum + log.value, 0);
}

export function calculateProgress(goal: Goal, logs: LogEntry[]): ProgressData {
  const current = sumInWindow(goal, logs);
  const target = goal.target;
  const percentage = Math.min(current / target, 1);
  const remaining = Math.max(target - current, 0);
  
  return {
    percentage,
    current,
    target,
    remaining
  };
}

export function calculateRequiredPace(goal: Goal): number {
  const window = getActiveWindow(goal);
  const totalDays = Math.ceil((window.end.getTime() - window.start.getTime()) / (24 * 60 * 60 * 1000));
  return goal.target / totalDays;
}

export function calculateActualPace(goal: Goal, logs: LogEntry[]): number {
  const window = getActiveWindow(goal);
  const totalDays = Math.ceil((window.end.getTime() - window.start.getTime()) / (24 * 60 * 60 * 1000));
  const total = sumInWindow(goal, logs);
  return total / totalDays;
}

export function calculatePace(goal: Goal, logs: LogEntry[]): PaceData {
  const required = calculateRequiredPace(goal);
  const actual = calculateActualPace(goal, logs);
  const delta = actual - required;
  
  return {
    required,
    actual,
    delta
  };
}

export function computeStreak(goal: Goal, logs: LogEntry[]): StreakData {
  if (goal.type !== 'streak') {
    return { current: 0, best: 0 };
  }
  
  const sortedLogs = logs
    .filter(log => log.goalId === goal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sortedLogs.length === 0) {
    return { current: 0, best: 0 };
  }
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  // Check if there's a log today or yesterday to start counting
  const hasRecentLog = sortedLogs.some(log => {
    const logDate = new Date(log.date);
    return logDate.toDateString() === today.toDateString() || 
           logDate.toDateString() === yesterday.toDateString();
  });
  
  if (!hasRecentLog) {
    return { current: 0, best: 0 };
  }
  
  // Calculate streaks
  let lastDate: Date | null = null;
  
  for (const log of sortedLogs) {
    const logDate = new Date(log.date);
    const logDateStr = logDate.toDateString();
    
    if (lastDate === null) {
      lastDate = logDate;
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor((lastDate.getTime() - logDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 1) {
        tempStreak++;
      } else if (daysDiff > 1) {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    lastDate = logDate;
  }
  
  bestStreak = Math.max(bestStreak, tempStreak);
  
  // Calculate current streak
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();
  
  if (sortedLogs.some(log => new Date(log.date).toDateString() === todayStr)) {
    currentStreak = tempStreak;
  } else if (sortedLogs.some(log => new Date(log.date).toDateString() === yesterdayStr)) {
    currentStreak = tempStreak - 1;
  }
  
  return {
    current: Math.max(currentStreak, 0),
    best: bestStreak
  };
}

export function getMilestonesReached(goal: Goal, progress: number): string[] {
  if (!goal.settings?.milestones) return [];
  
  return goal.settings.milestones
    .filter(milestone => progress >= milestone.threshold)
    .map(milestone => milestone.label);
}

export function getDaysRemaining(goal: Goal): number {
  const window = getActiveWindow(goal);
  const now = new Date();
  const remainingMs = window.end.getTime() - now.getTime();
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

export function isGoalCompleted(goal: Goal, logs: LogEntry[]): boolean {
  const progress = calculateProgress(goal, logs);
  return progress.percentage >= 1;
}

export function getGoalStatus(goal: Goal, logs: LogEntry[]): 'active' | 'completed' | 'expired' {
  if (isGoalCompleted(goal, logs)) return 'completed';
  
  const window = getActiveWindow(goal);
  const now = new Date();
  
  if (now > window.end) return 'expired';
  return 'active';
}
