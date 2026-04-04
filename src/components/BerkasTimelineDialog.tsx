import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getBerkasTimeline, TimelineEntry, Berkas } from '@/lib/data';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

interface Props {
  berkas: Berkas | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'Validasi SU & Bidang': return 'Verifikasi BT/SU';
    case 'Validasi BT': return 'Validasi SU & Bidang';
    case 'Selesai': return 'Validasi Buku Tanah';
    case 'Ditolak': return 'Ditolak';
    default: return action;
  }
}

function getActionVerb(action: string): string {
  if (action === 'Ditolak') return 'ditolak oleh';
  if (action === 'Selesai') return 'divalidasi oleh';
  return 'diverifikasi oleh';
}

function getActionIcon(action: string) {
  if (action === 'Ditolak') return <XCircle className="w-5 h-5 text-destructive" />;
  if (action === 'Selesai') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  return <Clock className="w-5 h-5 text-primary" />;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function BerkasTimelineDialog({ berkas, open, onOpenChange }: Props) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && berkas) {
      setLoading(true);
      getBerkasTimeline(berkas.id).then(data => {
        setTimeline(data);
        setLoading(false);
      });
    }
  }, [open, berkas?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Detail Perjalanan Berkas</DialogTitle>
        </DialogHeader>

        {berkas && (
          <div className="text-sm space-y-1 pb-3 border-b">
            <p><span className="text-muted-foreground">Nama:</span> <span className="font-medium">{berkas.namaPemegangHak}</span></p>
            <p><span className="text-muted-foreground">No Hak:</span> <span className="font-medium">{berkas.noHak}</span> <span className="text-muted-foreground ml-2">Jenis Hak:</span> <span className="font-medium">{berkas.jenisHak}</span></p>
            <p><span className="text-muted-foreground">No.SU/Tahun:</span> <span className="font-medium">{berkas.noSuTahun}</span></p>
            <p><span className="text-muted-foreground">Desa:</span> <span className="font-medium">{berkas.desa}</span></p>
            {berkas.namaPemilikSertifikat && (
              <p><span className="text-muted-foreground">Nama Pemilik Sertipikat:</span> <span className="font-medium">{berkas.namaPemilikSertifikat}</span></p>
            )}
            <p><span className="text-muted-foreground">No HP Pemohon (Online):</span> <span className="font-medium">{berkas.noWaPemohon || berkas.noTelepon || '-'}</span></p>
            {berkas.namaPemilikSertifikat && (
              <p><span className="text-muted-foreground">No HP Pemilik Sertifikat (Offline):</span> <span className="font-medium">{berkas.noTelepon || '-'}</span></p>
            )}
            <p><span className="text-muted-foreground">IP Server Pengajuan:</span> <span className="font-medium">{berkas.ipAddress || '-'}</span></p>
            <p><span className="text-muted-foreground">IP Perangkat Pengajuan:</span> <span className="font-medium">{berkas.deviceIpAddress || '-'}</span></p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada riwayat validasi</p>
        ) : (
          <div className="space-y-0 relative">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-border" />

            {timeline.map((entry, i) => (
              <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="relative z-10 mt-0.5 flex-shrink-0 bg-background rounded-full">
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{getActionLabel(entry.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    Sudah {getActionVerb(entry.action)} Admin <span className="font-medium text-foreground">{entry.adminName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp)} <span className="text-muted-foreground/60">({entry.ipAddress})</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
