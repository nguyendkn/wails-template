/**
 * Form Types
 * Type definitions for form handling and validation
 */

/**
 * Form field error
 */
export interface FormFieldError {
  message: string;
  type?: string;
}

/**
 * Form state
 */
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touched: Record<string, boolean>;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validate?: (value: any) => string | undefined;
}
