import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Berkas } from '@/lib/data';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Proses', label: 'Proses' },
  { value: 'Validasi SU & Bidang', label: 'Validasi SU & Bidang' },
  { value: 'Validasi BT', label: 'Validasi BT' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

interface ExportExcelButtonProps {
  data: Berkas[];
  fileName: string;
  sheetName?: string;
}

function parseDate(dateStr: string) {
  const parts = dateStr.split('/');
  return new Date(+parts[2], +parts[1] - 1, +parts[0]);
}

export default function ExportExcelButton({ data, fileName, sheetName = 'Data' }: ExportExcelButtonProps) {
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportStatus, setExportStatus] = useState('all');

  const handleExport = () => {
    let filtered = data;

    // Filter by status
    if (exportStatus !== 'all') {
      filtered = filtered.filter(b => b.status === exportStatus);
    }

    // Filter by date range
    if (exportFrom || exportTo) {
      filtered = filtered.filter(b => {
        const d = parseDate(b.tanggalPengajuan);
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
      'Status': b.status,
      'Catatan Penolakan': b.catatanPenolakan || '-',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('File Excel berhasil diexport');
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
      <Button size="sm" variant="outline" className="gap-1 h-8" onClick={handleExport}>
        <Download className="w-3.5 h-3.5" /> Export
      </Button>
    </div>
  );
}
