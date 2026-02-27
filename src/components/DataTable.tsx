import { ReactNode, useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index?: number) => ReactNode);
  className?: string;
  searchKey?: keyof T;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  headerActions?: ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  searchable = true,
  searchKeys,
  pageSize: defaultPageSize = 10,
  headerActions,
}: DataTableProps<T>) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

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

    // Apply per-column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row =>
          String(row[key]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply global search
    if (globalSearch && searchKeys) {
      result = result.filter(row =>
        searchKeys.some(key =>
          String(row[key]).toLowerCase().includes(globalSearch.toLowerCase())
        )
      );
    }

    return result;
  }, [data, columnFilters, globalSearch, searchKeys]);

  const handleColumnFilter = (key: string, val: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const clearColumnFilter = (key: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCurrentPage(1);
  };

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="h-7 text-xs border border-border rounded px-1.5 bg-background text-foreground"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Per-column filter chips */}
            {searchableColumns.map(col => (
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

      <div className="overflow-x-auto">
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
              const globalIndex = (currentPage - 1) * pageSize + i;
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
          Menampilkan {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length} data
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers().map((page, i) => (
            page === '...' ? (
              <span key={`dots-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[28px] h-7 rounded text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {page}
              </button>
            )
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
