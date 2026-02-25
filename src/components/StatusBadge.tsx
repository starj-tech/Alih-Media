import { BerkasStatus } from '@/lib/data';

const statusStyles: Record<BerkasStatus, string> = {
  'Proses': 'bg-info/20 text-info',
  'Validasi BT': 'bg-warning/20 text-warning',
  'Validasi SU & Bidang': 'bg-accent/20 text-accent',
  'Selesai': 'bg-success/20 text-success',
  'Ditolak': 'bg-destructive/20 text-destructive',
};

export default function StatusBadge({ status }: { status: BerkasStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
      {status}
    </span>
  );
}
