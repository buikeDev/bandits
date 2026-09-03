// Shared types and interfaces
// This package contains types used across frontend and backend

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
