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
    <div className="glass-card rounded-xl shadow-lg overflow-hidden animate-fade-in">
      {(title || searchable) && (
        <div className="p-5 flex items-center justify-between border-b border-border">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {searchable && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pencarian..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col, i) => (
                <th key={i} className={`px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-3 text-sm text-foreground text-center ${col.className || ''}`}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row, i)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada data ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
