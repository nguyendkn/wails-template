/**
 * User Types
 * Based on the API user schemas and database structure
 */



/**
 * User entity
 */
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  gender: string;
  roles: string[];
  scopes: string[];
  created_at: string;
  current_tenant_id: string;
  // Legacy fields for compatibility
  firstName?: string;
  lastName?: string;
  permissions?: string[];
  isActive?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  updatedAt?: string;
  // Profile fields
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

/**
 * User query parameters
 */
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
  isActive?: boolean;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
  isActive?: boolean;
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: UserPreferences;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * User list response
 */
export interface UserListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
