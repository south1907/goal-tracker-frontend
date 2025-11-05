/**
 * API Types - Mirrors backend Pydantic schemas
 */

export interface User {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Goal Types
export type GoalType = 'count' | 'sum' | 'streak' | 'milestone' | 'open';
export type TimeframeType = 'fixed' | 'rolling' | 'recurring';
export type PrivacyLevel = 'public' | 'unlisted' | 'private';
export type GoalStatus = 'draft' | 'active' | 'ended';

export interface Milestone {
  label: string;
  threshold: number;
}

export interface GoalSettings {
  milestones?: Milestone[];
  unitPerSession?: number;
  streakRule?: string;
  xPerWeek?: number;
}

export interface Goal {
  id: number;
  owner_id: number;
  name: string;
  description?: string;
  emoji: string;
  goal_type: GoalType;
  unit: string;
  target?: number;
  timeframe_type: TimeframeType;
  start_at: string;
  end_at?: string;
  rolling_days?: number;
  rrule?: string;
  privacy: PrivacyLevel;
  status: GoalStatus;
  settings_json?: GoalSettings;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalWithStats extends Goal {
  progress_pct: number;
  achieved: boolean;
  achieved_value: number;
  required_pace: number;
  actual_pace: number;
  streak: StreakData;
}

export interface GoalCreate {
  name: string;
  description?: string;
  emoji: string;
  goal_type: GoalType;
  unit: string;
  target?: number;
  timeframe_type: TimeframeType;
  start_at: string;
  end_at?: string;
  rolling_days?: number;
  rrule?: string;
  privacy: PrivacyLevel;
  settings_json?: GoalSettings;
}

export interface GoalUpdate {
  name?: string;
  description?: string;
  emoji?: string;
  target?: number;
  end_at?: string;
  privacy?: PrivacyLevel;
  settings_json?: GoalSettings;
}

// Log Types
export interface Log {
  id: number;
  goal_id: number;
  user_id: number;
  date: string;
  value: number;
  note?: string;
  attachment_url?: string;
  created_at: string;
}

export interface LogCreate {
  value: number;
  note?: string;
  date?: string;
}

export interface LogUpdate {
  value?: number;
  note?: string;
}

// Progress & Stats Types
export interface StreakData {
  current: number;
  best: number;
}

export interface ProgressStats {
  progress_pct: number;
  achieved: boolean;
  achieved_value: number;
  target: number;
  unit: string;
  required_pace: number;
  actual_pace: number;
  streak: StreakData;
}

export interface ChartData {
  date: string;
  value: number;
  cumulative: number;
}

export interface HeatmapData {
  date: string;
  value: number;
  intensity: number;
}

export interface OverviewStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  total_logs: number;
  best_day?: string;
  best_week?: string;
  longest_streak: number;
  completion_rate: number;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

// Filter Types
export interface GoalFilters {
  status?: GoalStatus;
  goal_type?: GoalType;
  privacy?: PrivacyLevel;
  q?: string;
}

export interface LogFilters {
  from_date?: string;
  to_date?: string;
  order?: 'asc' | 'desc';
}

// Error Types
export interface ErrorDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  fields?: Record<string, string[]>;
}

// Health Check
export interface HealthCheck {
  status: string;
  version: string;
  database: string;
  timestamp: string;
}
