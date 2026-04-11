import { BerkasStatus } from '@/lib/data';

const statusStyles: Record<BerkasStatus, string> = {
  'Proses': 'bg-info/15 text-info border border-info/30',
  'Validasi SU & Bidang': 'bg-accent/15 text-accent border border-accent/30',
  'Validasi BT': 'bg-warning/15 text-warning border border-warning/30',
  'Selesai Belum Diinfokan': 'bg-orange-100 text-orange-700 border border-orange-300',
  'Selesai': 'bg-success/15 text-success border border-success/30',
  'Ditolak': 'bg-destructive/15 text-destructive border border-destructive/30',
};

export default function StatusBadge({ status }: { status: BerkasStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
