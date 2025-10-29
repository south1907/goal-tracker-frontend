export type GoalType = "count" | "sum" | "streak" | "milestone" | "open";
export type TimeframeType = "fixed" | "rolling" | "recurring";

export type Timeframe = {
  type: TimeframeType;
  start?: string;     // ISO date
  end?: string;       // ISO date
  rollingDays?: number; // e.g., 7 | 30 | 90
  rrule?: string;       // for recurring (future use)
};

export type Milestone = { 
  label: string; 
  threshold: number; 
}; // 0.25, 0.5, 0.75, 1

export type Goal = {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  type: GoalType;
  unit: string;          // "times", "km", "hours", "pages"...
  target: number;        // required for count/sum/milestone
  timeframe: Timeframe;
  privacy: "public" | "unlisted" | "private";
  status?: "draft" | "active" | "ended"; // Add status field
  settings?: {
    unitPerSession?: number; // e.g., 1 session = 30 min
    streakRule?: "daily" | "x_per_week";
    xPerWeek?: number;       // for streak rule
    milestones?: Milestone[];
  };
  createdAt: string;
  updatedAt: string;
};

export type LogEntry = {
  id: string;
  goalId: string;
  date: string;     // ISO date or datetime
  value: number;    // +1 or +X
  note?: string;
  attachmentUrl?: string;
};

export type CycleSummary = {
  goalId: string;
  cycleIndex: number;
  start: string;
  end: string;
  total: number;
  achieved: boolean;
  streakMax?: number;
};

export type StreakData = {
  current: number;
  best: number;
};

export type ProgressData = {
  percentage: number;
  current: number;
  target: number;
  remaining: number;
};

export type PaceData = {
  required: number;
  actual: number;
  delta: number; // positive = ahead, negative = behind
};
