import { ReactNode, useState } from 'react';
import { Search } from 'lucide-react';
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
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  searchable = true,
  searchKeys,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  const filteredData = search && searchKeys
    ? data.filter(row =>
        searchKeys.some(key =>
          String(row[key]).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  return (
    <div className="gentelella-panel">
      {(title || searchable) && (
        <div className="gentelella-panel-heading">
          {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {searchable && (
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pencarian..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
            {filteredData.map((row, i) => (
              <tr key={i} className={`border-b border-border transition-colors hover:bg-muted/40 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                {columns.map((col, j) => (
                  <td key={j} className={`px-3 py-2.5 text-center text-foreground ${col.className || ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row, i)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Footer with count */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
        Menampilkan {filteredData.length} dari {data.length} data
      </div>
    </div>
  );
}
