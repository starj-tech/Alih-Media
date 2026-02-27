import { ReactNode, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T, index?: number) => ReactNode);
  className?: string;
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
  pageSize = 10,
  headerActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search || !searchKeys) return data;
    return data.filter(row =>
      searchKeys.some(key =>
        String(row[key]).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when search changes
  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

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
      {(title || searchable || headerActions) && (
        <div className="gentelella-panel-heading">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {headerActions}
          </div>
          {searchable && (
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pencarian..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>
          )}
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
