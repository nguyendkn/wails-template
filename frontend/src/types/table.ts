/**
 * Generic table state
 */
export interface TableState<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sorting: {
    field: string;
    direction: "asc" | "desc";
  };
  filters: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
}
