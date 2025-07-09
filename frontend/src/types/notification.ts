/**
 * Notification types
 */
export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  progress?: number;
  indeterminate?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}
