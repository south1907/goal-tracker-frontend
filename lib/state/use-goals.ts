import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Goal, LogEntry } from '@/types/goal';
import { generateId, formatDateTime } from '@/lib/utils/calculations';

interface GoalsState {
  goals: Goal[];
  logs: LogEntry[];
  
  // Actions
  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  addLog: (log: Omit<LogEntry, 'id'>) => void;
  editLog: (logId: string, updates: Partial<LogEntry>) => void;
  deleteLog: (logId: string) => void;
  
  // Selectors
  getGoalById: (id: string) => Goal | undefined;
  getLogsByGoal: (goalId: string) => LogEntry[];
  getLogsByDate: (date: string) => LogEntry[];
  
  // Derived data
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getExpiredGoals: () => Goal[];
}

// Seed data
const seedGoals: Goal[] = [
  {
    id: "g1",
    name: "Read 20 Books in 2025",
    emoji: "📚",
    type: "count",
    unit: "books",
    target: 20,
    timeframe: { type: "fixed", start: "2025-01-01", end: "2025-12-31" },
    privacy: "private",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    settings: { 
      milestones: [
        { label: "25%", threshold: 0.25 },
        { label: "50%", threshold: 0.5 },
        { label: "75%", threshold: 0.75 },
        { label: "100%", threshold: 1 }
      ]
    }
  },
  {
    id: "g2",
    name: "Run 200 km in October",
    emoji: "🏃‍♂️",
    type: "sum",
    unit: "km",
    target: 200,
    timeframe: { type: "fixed", start: "2025-10-01", end: "2025-10-31" },
    privacy: "unlisted",
    createdAt: "2025-10-01T00:00:00.000Z",
    updatedAt: "2025-10-01T00:00:00.000Z"
  },
  {
    id: "g3",
    name: "Daily Meditation Streak",
    emoji: "🧘‍♀️",
    type: "streak",
    unit: "days",
    target: 30,
    timeframe: { type: "rolling", rollingDays: 30 },
    privacy: "private",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: "g4",
    name: "Learn Spanish",
    emoji: "🇪🇸",
    type: "milestone",
    unit: "levels",
    target: 10,
    timeframe: { type: "fixed", start: "2025-01-01", end: "2025-12-31" },
    privacy: "public",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    settings: { 
      milestones: [
        { label: "Beginner", threshold: 0.2 },
        { label: "Intermediate", threshold: 0.5 },
        { label: "Advanced", threshold: 0.8 },
        { label: "Fluent", threshold: 1 }
      ]
    }
  }
];

const seedLogs: LogEntry[] = [
  { id: "l1", goalId: "g1", date: "2025-01-15", value: 1, note: "Finished 'Atomic Habits'" },
  { id: "l2", goalId: "g1", date: "2025-02-03", value: 1, note: "Completed 'The Lean Startup'" },
  { id: "l3", goalId: "g1", date: "2025-02-20", value: 1, note: "Read 'Deep Work'" },
  { id: "l4", goalId: "g1", date: "2025-03-10", value: 1, note: "Finished 'Thinking Fast and Slow'" },
  { id: "l5", goalId: "g1", date: "2025-03-25", value: 1, note: "Completed 'The Power of Now'" },
  
  { id: "l6", goalId: "g2", date: "2025-10-03", value: 10 },
  { id: "l7", goalId: "g2", date: "2025-10-07", value: 12 },
  { id: "l8", goalId: "g2", date: "2025-10-10", value: 8 },
  { id: "l9", goalId: "g2", date: "2025-10-14", value: 15 },
  { id: "l10", goalId: "g2", date: "2025-10-18", value: 11 },
  { id: "l11", goalId: "g2", date: "2025-10-22", value: 9 },
  
  { id: "l12", goalId: "g3", date: "2025-01-01", value: 1 },
  { id: "l13", goalId: "g3", date: "2025-01-02", value: 1 },
  { id: "l14", goalId: "g3", date: "2025-01-03", value: 1 },
  { id: "l15", goalId: "g3", date: "2025-01-04", value: 1 },
  { id: "l16", goalId: "g3", date: "2025-01-05", value: 1 },
  { id: "l17", goalId: "g3", date: "2025-01-06", value: 1 },
  { id: "l18", goalId: "g3", date: "2025-01-07", value: 1 },
  { id: "l19", goalId: "g3", date: "2025-01-08", value: 1 },
  { id: "l20", goalId: "g3", date: "2025-01-09", value: 1 },
  { id: "l21", goalId: "g3", date: "2025-01-10", value: 1 },
  
  { id: "l22", goalId: "g4", date: "2025-01-05", value: 1, note: "Completed Level 1" },
  { id: "l23", goalId: "g4", date: "2025-01-12", value: 1, note: "Completed Level 2" },
  { id: "l24", goalId: "g4", date: "2025-01-20", value: 1, note: "Completed Level 3" },
  { id: "l25", goalId: "g4", date: "2025-02-01", value: 1, note: "Completed Level 4" },
  { id: "l26", goalId: "g4", date: "2025-02-15", value: 1, note: "Completed Level 5" }
];

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: seedGoals,
      logs: seedLogs,
      
      createGoal: (goalData) => {
        const now = formatDateTime(new Date());
        const newGoal: Goal = {
          ...goalData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },
      
      updateGoal: (goalId, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === goalId
              ? { ...goal, ...updates, updatedAt: formatDateTime(new Date()) }
              : goal
          ),
        }));
      },
      
      deleteGoal: (goalId) => {
        set((state) => ({
          goals: state.goals.filter((goal) => goal.id !== goalId),
          logs: state.logs.filter((log) => log.goalId !== goalId),
        }));
      },
      
      addLog: (logData) => {
        const newLog: LogEntry = {
          ...logData,
          id: generateId(),
        };
        
        set((state) => ({
          logs: [...state.logs, newLog],
        }));
      },
      
      editLog: (logId, updates) => {
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === logId ? { ...log, ...updates } : log
          ),
        }));
      },
      
      deleteLog: (logId) => {
        set((state) => ({
          logs: state.logs.filter((log) => log.id !== logId),
        }));
      },
      
      getGoalById: (id) => {
        return get().goals.find((goal) => goal.id === id);
      },
      
      getLogsByGoal: (goalId) => {
        return get().logs
          .filter((log) => log.goalId === goalId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      
      getLogsByDate: (date) => {
        return get().logs.filter((log) => log.date.startsWith(date));
      },
      
      getActiveGoals: () => {
        const { goals, logs } = get();
        return goals.filter((goal) => {
          const window = getActiveWindow(goal);
          const now = new Date();
          return now <= window.end && !isGoalCompleted(goal, logs);
        });
      },
      
      getCompletedGoals: () => {
        const { goals, logs } = get();
        return goals.filter((goal) => isGoalCompleted(goal, logs));
      },
      
      getExpiredGoals: () => {
        const { goals, logs } = get();
        return goals.filter((goal) => {
          const window = getActiveWindow(goal);
          const now = new Date();
          return now > window.end && !isGoalCompleted(goal, logs);
        });
      },
    }),
    {
      name: 'goals-storage',
      partialize: (state) => ({ goals: state.goals, logs: state.logs }),
    }
  )
);

// Import the calculation functions we need
import { getActiveWindow, isGoalCompleted } from '@/lib/utils/calculations';
