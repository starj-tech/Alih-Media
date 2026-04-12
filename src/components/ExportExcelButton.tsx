import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Berkas, fetchBerkasPaginated } from '@/lib/data';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai Belum Diinfokan', label: 'Selesai Belum Diinfokan' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

interface ExportExcelButtonProps {
  data: Berkas[];
  fileName: string;
  sheetName?: string;
  /** Optional: current status filter from parent, used to fetch all matching data */
  statusFilter?: string;
  /** Optional: current search from parent */
  searchFilter?: string;
}

export default function ExportExcelButton({ data, fileName, sheetName = 'Data', statusFilter: parentStatusFilter, searchFilter }: ExportExcelButtonProps) {
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportStatus, setExportStatus] = useState('all');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Determine which status to use for fetching
      const effectiveStatus = exportStatus !== 'all' ? exportStatus : (parentStatusFilter && parentStatusFilter !== 'all' ? parentStatusFilter : undefined);

      // Fetch ALL data matching current filters (bypass pagination)
      let allData: Berkas[] = [];
      let page = 1;
      const perPage = 100;
      while (true) {
        const result = await fetchBerkasPaginated({
          status: effectiveStatus,
          page,
          perPage,
          search: searchFilter || undefined,
        });
        allData = allData.concat(result.data);
        if (page >= result.last_page) break;
        page++;
      }

      let filtered = allData;

      // Apply date range filter client-side
      if (exportFrom || exportTo) {
        filtered = filtered.filter(b => {
          const parts = b.tanggalPengajuan.split('/');
          const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
          if (exportFrom) {
            const fromParts = exportFrom.split('-');
            const from = new Date(+fromParts[0], +fromParts[1] - 1, +fromParts[2]);
            if (d < from) return false;
          }
          if (exportTo) {
            const toParts = exportTo.split('-');
            const to = new Date(+toParts[0], +toParts[1] - 1, +toParts[2], 23, 59, 59);
            if (d > to) return false;
          }
          return true;
        });
      }

      if (filtered.length === 0) {
        toast.error('Tidak ada data untuk diexport');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(filtered.map((b, i) => ({
        'No': i + 1,
        'Tgl Pengajuan': b.tanggalPengajuan,
        'Nama Pemohon': b.namaPemegangHak,
        'Nama Pemilik Sertifikat': b.namaPemilikSertifikat || '-',
        'No.SU/Tahun': b.noSuTahun,
        'No Hak': b.noHak,
        'Jenis Hak': b.jenisHak,
        'Desa': b.desa,
        'Kecamatan': b.kecamatan,
        'No HP Pemohon': b.noWaPemohon || b.noTelepon || '-',
        'No HP Pemilik Sertifikat': b.namaPemilikSertifikat ? (b.noTelepon || '-') : '-',
        'Link Shareloc': b.linkShareloc || '-',
        'Pengguna': b.profilePengguna || '-',
        'Status': b.status,
        'Catatan Penolakan': b.catatanPenolakan || '-',
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${filtered.length} data berhasil diexport`);
    } catch (err) {
      toast.error('Gagal mengexport data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={exportStatus} onValueChange={setExportStatus}>
        <SelectTrigger className="h-8 text-xs w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="h-8 text-xs w-36" />
      <Input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="h-8 text-xs w-36" />
      <Button size="sm" variant="outline" className="gap-1 h-8" onClick={handleExport} disabled={exporting}>
        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {exporting ? 'Exporting...' : 'Export'}
      </Button>
    </div>
  );
}
