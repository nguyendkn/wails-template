/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
}
