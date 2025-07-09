/**
 * Modal Types
 * Type definitions for modal components and state management
 */

/**
 * Modal size options
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Modal step data for multi-step modals
 */
export interface ModalStepData {
  title: string;
  content: React.ReactNode;
  canProceed?: boolean;
  isOptional?: boolean;
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: ModalSize;
  closable?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  steps?: ModalStepData[];
  currentStep?: number;
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  title?: string;
  content?: React.ReactNode;
  size?: ModalSize;
  closable?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}
