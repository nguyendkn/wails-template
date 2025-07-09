/**
 * Window with gtag for analytics
 */
export interface WindowWithGtag {
  gtag: (
    command: string,
    action: string,
    parameters: Record<string, unknown>
  ) => void;
}
