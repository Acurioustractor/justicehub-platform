// Common API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  total: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  inviteToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Basic request/response types that will be enhanced later
export interface BasicCreateRequest {
  [key: string]: any;
}

export interface BasicUpdateRequest {
  [key: string]: any;
}

export interface BasicSearchRequest {
  query?: string;
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

export interface BasicSearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// File upload types
export interface FileUploadRequest {
  file: File;
  type: 'profile_picture' | 'story_media' | 'document' | 'logo';
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

export interface WebhookResponse {
  received: boolean;
  processed?: boolean;
  error?: string;
}

// Analytics types
export interface AnalyticsRequest {
  organizationId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  metrics?: string[];
  groupBy?: string;
}

export interface AnalyticsResponse {
  metrics: Record<string, number>;
  trends: TrendData[];
  insights: AnalyticsInsight[];
  period: {
    start: string;
    end: string;
  };
}

export interface TrendData {
  date: string;
  value: number;
  metric: string;
}

export interface AnalyticsInsight {
  type: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionable: boolean;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Batch operation types
export interface BatchRequest<T> {
  operations: BatchOperation<T>[];
}

export interface BatchOperation<T> {
  method: 'CREATE' | 'UPDATE' | 'DELETE';
  id?: string;
  data: T;
}

export interface BatchResponse<T> {
  results: BatchResult<T>[];
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  operation: BatchOperation<T>;
}

// Real-time types
export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  organizationId?: string;
}

export interface RealtimeSubscription {
  channel: string;
  events: string[];
  filters?: Record<string, any>;
}