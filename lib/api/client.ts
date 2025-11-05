/**
 * API Client with JWT authentication and error handling
 */

import { config } from '../config';
import type { 
  AuthTokens, 
  LoginRequest, 
  RegisterRequest, 
  RefreshTokenRequest,
  ErrorDetail,
  PaginatedResponse,
  Goal,
  GoalWithStats,
  GoalCreate,
  GoalUpdate,
  Log,
  LogCreate,
  LogUpdate,
  ProgressStats,
  ChartData,
  HeatmapData,
  OverviewStats,
  GoalFilters,
  LogFilters,
  PaginationParams,
  User,
  HealthCheck
} from '../types/api';

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public fields?: Record<string, string[]>
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    
    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.loadTokens();
    }
  }

  private loadTokens() {
    try {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    } catch (error) {
      console.warn('Failed to load tokens from localStorage:', error);
    }
  }

  private saveTokens(tokens: AuthTokens) {
    try {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
  }

  private clearTokens() {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.warn('Failed to clear tokens from localStorage:', error);
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (response.ok) {
        const tokens: AuthTokens = await response.json();
        this.saveTokens(tokens);
        return true;
      } else {
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearTokens();
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    // Add authorization header if we have an access token and auth is required
    if (requireAuth && this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, requestOptions);

    // Handle 401 Unauthorized - try to refresh token (only if auth is required)
    if (requireAuth && response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...requestOptions, headers });
      } else {
        // Refresh failed, redirect to login
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Authentication failed');
      }
    }

    // Handle 204 No Content (successful delete with no body) - check before reading body
    if (response.status === 204) {
      // 204 responses have no body, so we can't read it
      return {} as T;
    }

    if (!response.ok) {
      let errorDetail: string;
      let fields: Record<string, string[]> | undefined;

      try {
        const errorData: ErrorDetail = await response.json();
        errorDetail = errorData.detail || errorData.title || 'An error occurred';
        fields = errorData.fields;
      } catch {
        errorDetail = response.statusText || 'An error occurred';
      }

      throw new ApiError(response.status, errorDetail, fields);
    }
    
    // Handle JSON responses (only if status is not 204)
    if (response.status !== 204) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        return text ? JSON.parse(text) : ({} as T);
      }
    }
    
    return {} as T;
  }

  // HTTP method helpers
  async get<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, requireAuth);
  }

  async post<T>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth);
  }

  async patch<T>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth);
  }

  async delete<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    const result = await this.request<T>(endpoint, { method: 'DELETE' }, requireAuth);
    // For void return types (like deleteGoal), return undefined
    return result ?? (undefined as any);
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthTokens> {
    const tokens = await this.post<AuthTokens>('/auth/login', credentials, false);
    this.saveTokens(tokens);
    return tokens;
  }

  async register(userData: RegisterRequest): Promise<User> {
    return this.post<User>('/auth/register', userData, false);
  }

  async refresh(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new ApiError(401, 'No refresh token available');
    }
    const tokens = await this.post<AuthTokens>('/auth/refresh', {
      refresh_token: this.refreshToken,
    });
    this.saveTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    this.clearTokens();
  }

  async getCurrentUser(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  // Goal methods
  async getGoals(filters?: GoalFilters & PaginationParams & { include_stats?: boolean }): Promise<PaginatedResponse<GoalWithStats | Goal>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.get<PaginatedResponse<Goal | GoalWithStats>>(`/goals${query ? `?${query}` : ''}`);
  }

  async getGoal(goalId: number): Promise<Goal> {
    return this.get<Goal>(`/goals/${goalId}`);
  }

  async getGoalByShareToken(shareToken: string): Promise<Goal> {
    // Public endpoint - no auth required
    return this.request<Goal>(`/goals/share/${shareToken}`, { method: 'GET' }, false);
  }

  async getSharedGoalLogs(shareToken: string, page: number = 1, pageSize: number = 100): Promise<PaginatedResponse<Log>> {
    // Public endpoint - no auth required
    return this.request<PaginatedResponse<Log>>(
      `/goals/share/${shareToken}/logs?page=${page}&page_size=${pageSize}`,
      { method: 'GET' },
      false
    );
  }

  async getSharedGoalProgress(shareToken: string, window: string = 'all'): Promise<ProgressStats> {
    // Public endpoint - no auth required
    return this.request<ProgressStats>(
      `/goals/share/${shareToken}/progress?window=${window}`,
      { method: 'GET' },
      false
    );
  }

  async generateShareToken(goalId: number): Promise<{ share_token: string }> {
    return this.post<{ share_token: string }>(`/goals/${goalId}/generate-share-token`);
  }

  async createGoal(goal: GoalCreate): Promise<Goal> {
    return this.post<Goal>('/goals', goal);
  }

  async updateGoal(goalId: number, updates: GoalUpdate): Promise<Goal> {
    return this.patch<Goal>(`/goals/${goalId}`, updates);
  }

  async deleteGoal(goalId: number): Promise<void> {
    return this.delete<void>(`/goals/${goalId}`);
  }

  async getGoalProgress(goalId: number, window?: string, tz?: string): Promise<ProgressStats> {
    const params = new URLSearchParams();
    if (window) params.append('window', window);
    if (tz) params.append('tz', tz);
    const query = params.toString();
    return this.get<ProgressStats>(`/goals/${goalId}/progress${query ? `?${query}` : ''}`);
  }

  async getGoalChart(goalId: number, bucket: string, from: string, to: string): Promise<ChartData[]> {
    const params = new URLSearchParams({ bucket, from, to });
    return this.get<ChartData[]>(`/goals/${goalId}/chart?${params}`);
  }

  async getGoalHeatmap(goalId: number, month: string): Promise<HeatmapData[]> {
    return this.get<HeatmapData[]>(`/goals/${goalId}/heatmap?month=${month}`);
  }

  // Log methods
  async getAllLogs(filters?: LogFilters & PaginationParams): Promise<PaginatedResponse<Log>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.get<PaginatedResponse<Log>>(`/logs/all${query ? `?${query}` : ''}`);
  }

  async getGoalLogs(goalId: number, filters?: LogFilters & PaginationParams): Promise<PaginatedResponse<Log>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return this.get<PaginatedResponse<Log>>(`/goals/${goalId}/logs${query ? `?${query}` : ''}`);
  }

  async addLog(goalId: number, log: LogCreate): Promise<Log> {
    return this.post<Log>(`/goals/${goalId}/logs`, log);
  }

  async updateLog(logId: number, updates: LogUpdate): Promise<Log> {
    return this.patch<Log>(`/logs/${logId}`, updates);
  }

  async deleteLog(logId: number): Promise<void> {
    return this.delete<void>(`/logs/${logId}`);
  }

  // Stats methods
  async getStatsOverview(): Promise<OverviewStats> {
    return this.get<OverviewStats>('/stats/overview');
  }

  // Health check
  async getHealth(): Promise<HealthCheck> {
    return this.get<HealthCheck>('/health');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Create singleton instance
export const apiClient = new ApiClient(config.API_BASE_URL);
export { ApiError };
