import { ReactNode, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index?: number) => ReactNode);
  className?: string;
  searchKey?: keyof T;
}

export interface ServerPagination {
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  headerActions?: ReactNode;
  serverPagination?: ServerPagination;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  searchable = true,
  searchKeys,
  pageSize: defaultPageSize = 10,
  headerActions,
  serverPagination,
}: DataTableProps<T>) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const isServerPaginated = !!serverPagination;

  // Derive searchable columns from searchKeys
  const searchableColumns = useMemo(() => {
    if (!searchKeys) return [];
    return columns.filter(col => {
      if (typeof col.accessor === 'string' && searchKeys.includes(col.accessor as keyof T)) return true;
      if (col.searchKey && searchKeys.includes(col.searchKey)) return true;
      return false;
    }).map(col => ({
      key: String(col.searchKey || col.accessor),
      header: col.header,
    }));
  }, [columns, searchKeys]);

  const filteredData = useMemo(() => {
    let result = data;

    // Skip client-side filtering when server handles search
    if (isServerPaginated && serverPagination.onSearchChange) {
      return result;
    }

    // Apply per-column filters (client-side, works on current page data)
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply global search (client-side, works on current page data)
    if (globalSearch && searchKeys) {
      result = result.filter(row =>
        searchKeys.some(key =>
          String(row[key]).toLowerCase().includes(globalSearch.toLowerCase())
        )
      );
    }

    return result;
  }, [data, columnFilters, globalSearch, searchKeys, isServerPaginated, serverPagination]);

  const handleColumnFilter = (key: string, val: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: val }));
    if (!isServerPaginated) setCurrentPage(1);
  };

  const clearColumnFilter = (key: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (!isServerPaginated) setCurrentPage(1);
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleGlobalSearch = useCallback((val: string) => {
    setGlobalSearch(val);
    if (isServerPaginated && serverPagination?.onSearchChange) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        serverPagination.onSearchChange!(val);
      }, 400);
    } else if (!isServerPaginated) {
      setCurrentPage(1);
    }
  }, [isServerPaginated, serverPagination]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Pagination values
  const activePage = isServerPaginated ? serverPagination.currentPage : currentPage;
  const activePageSize = isServerPaginated ? serverPagination.perPage : pageSize;
  const totalItems = isServerPaginated ? serverPagination.total : filteredData.length;
  const totalPages = isServerPaginated ? serverPagination.totalPages : Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = isServerPaginated ? filteredData : filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Index offset for row numbering
  const indexOffset = (activePage - 1) * activePageSize;

  const handlePageChange = (page: number) => {
    if (isServerPaginated) {
      serverPagination.onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isServerPaginated && serverPagination.onPerPageChange) {
      serverPagination.onPerPageChange(newSize);
    } else {
      setPageSize(newSize);
      setCurrentPage(1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (activePage > 3) pages.push('...');
      for (let i = Math.max(2, activePage - 1); i <= Math.min(totalPages - 1, activePage + 1); i++) {
        pages.push(i);
      }
      if (activePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const showFrom = totalItems > 0 ? indexOffset + 1 : 0;
  const showTo = isServerPaginated
    ? Math.min(activePage * activePageSize, totalItems)
    : Math.min(currentPage * pageSize, filteredData.length);

  return (
    <div className="gentelella-panel">
      {(title || headerActions) && (
        <div className="gentelella-panel-heading">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {headerActions}
          </div>
        </div>
      )}

      {/* Top bar: page size + column filters + global search */}
      {searchable && (
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Menampilkan</span>
            <select
              value={activePageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              className="h-7 text-xs border border-border rounded px-1.5 bg-background text-foreground"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Per-column filter chips - only show for client-side pagination */}
            {!isServerPaginated && searchableColumns.map(col => (
              <div key={col.key} className="flex items-center border border-border rounded bg-background">
                <Input
                  placeholder={col.header}
                  value={columnFilters[col.key] || ''}
                  onChange={e => handleColumnFilter(col.key, e.target.value)}
                  className="h-7 text-xs border-0 w-32 px-2 focus-visible:ring-0 shadow-none"
                />
                {columnFilters[col.key] && (
                  <button
                    onClick={() => clearColumnFilter(col.key)}
                    className="px-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Cari:</span>
            <Input
              value={globalSearch}
              onChange={e => handleGlobalSearch(e.target.value)}
              className="h-7 text-xs w-44 bg-background"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto relative">
        {isServerPaginated && serverPagination.loading && (
          <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {columns.map((col, i) => (
                <th key={i} className={`px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => {
              const globalIndex = indexOffset + i;
              return (
                <tr key={i} className={`border-b border-border transition-colors hover:bg-muted/40 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                  {columns.map((col, j) => (
                    <td key={j} className={`px-3 py-2.5 text-center text-foreground ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row, globalIndex)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Footer with pagination */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Menampilkan {showFrom}–{showTo} dari {totalItems} data
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(1)} disabled={activePage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => handlePageChange(Math.max(1, activePage - 1))} disabled={activePage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers().map((page, i) => (
            page === '...' ? (
              <span key={`dots-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[28px] h-7 rounded text-xs font-medium transition-colors ${
                  activePage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {page}
              </button>
            )
          ))}
          <button onClick={() => handlePageChange(Math.min(totalPages, activePage + 1))} disabled={activePage === totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={activePage === totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
