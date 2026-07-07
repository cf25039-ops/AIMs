import { useState, useMemo } from "react";

type UsePaginationResult<T> = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  paginated: T[];
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export function usePagination<T>(data: T[], initialPageSize = 10): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paginated = useMemo(() => {
    const from = (page - 1) * pageSize;
    return data.slice(from, from + pageSize);
  }, [data, page, pageSize]);

  const safeSetPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return {
    page,
    pageSize,
    total,
    totalPages,
    paginated,
    setPage: safeSetPage,
    setPageSize: (s: number) => {
      setPageSize(s);
      setPage(1);
    },
    nextPage: () => safeSetPage(page + 1),
    prevPage: () => safeSetPage(page - 1),
    isFirst: page === 1,
    isLast: page === totalPages,
  };
}
