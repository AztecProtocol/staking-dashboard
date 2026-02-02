/**
 * Common API Response Types
 */

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

export interface ErrorResponse {
  error: string;
  details?: string;
}
