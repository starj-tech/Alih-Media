import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { getAllBerkas, Berkas } from '@/lib/data';
import { ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

export default function AdminInformasi() {
  const [berkas, setBerkas] = useState<Berkas[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { getAllBerkas().then(setBerkas); }, []);

  const filteredBerkas = statusFilter === 'all' ? berkas : berkas.filter(b => b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informasi Alihmedia</h1>
        <p className="text-muted-foreground">Monitoring seluruh berkas alihmedia</p>
      </div>

      <DataTable<Berkas>
        title="Verifikasi Arsip"
        searchKeys={['noHak', 'noSuTahun', 'desa']}
        headerActions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-48">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        columns={[
          { header: 'No', accessor: (_, i) => (i ?? 0) + 1 } as any,
          { header: 'Tgl Pengajuan', accessor: 'tanggalPengajuan' },
          { header: 'Nama', accessor: 'namaPemegangHak' },
          { header: 'No.SU/Tahun', accessor: 'noSuTahun', searchKey: 'noSuTahun' },
          { header: 'No Hak', accessor: 'noHak', searchKey: 'noHak' },
          { header: 'Jenis Hak', accessor: 'jenisHak' },
          { header: 'Desa', accessor: 'desa', searchKey: 'desa' },
          { header: 'Kecamatan', accessor: 'kecamatan' },
          { header: 'Link', accessor: (row) => row.linkShareloc ? (
            <div className="flex items-center gap-1 justify-center">
              <button onClick={() => window.open(row.linkShareloc!, '_blank', 'noopener,noreferrer')} className="text-primary hover:text-primary/80">
                <ExternalLink className="w-4 h-4" />
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => { navigator.clipboard.writeText(row.linkShareloc!); toast.success('Link disalin'); }} className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Salin link</TooltipContent>
              </Tooltip>
            </div>
          ) : <span className="text-muted-foreground">-</span> },
          { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
          { header: 'Catatan', accessor: (row) => <span className="text-xs text-muted-foreground">{row.catatanPenolakan || '-'}</span> },
        ]}
        data={filteredBerkas}
      />
    </div>
  );
}
