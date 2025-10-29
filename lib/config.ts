/**
 * Environment configuration for the Goal Tracker app
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

// Validate API base URL
if (!API_BASE_URL.startsWith('http') && !API_BASE_URL.startsWith('/')) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL must be a valid HTTP URL or path');
}

export const config = {
  API_BASE_URL,
  APP_NAME: 'Goal Tracker',
  VERSION: '1.0.0',
} as const;

export default config;
