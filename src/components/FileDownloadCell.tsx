import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getSignedFileUrl } from '@/lib/data';
import { toast } from 'sonner';

interface FileDownloadCellProps {
  url?: string;
  label: string;
}

export default function FileDownloadCell({ url, label }: FileDownloadCellProps) {
  const [loading, setLoading] = useState(false);

  if (!url) return <span className="text-muted-foreground text-xs">-</span>;

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await getSignedFileUrl(url);

      if (!result) {
        toast.error(`File ${label} tidak ditemukan di server. Kemungkinan file sudah dihapus atau path berubah.`);
        return;
      }

      const a = document.createElement('a');
      a.href = result;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (result.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(result), 60000);
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('sesi tidak valid') || msg.includes('unauthorized')) {
        toast.error('Sesi login sudah berakhir. Silakan login kembali.');
      } else {
        toast.error(`Gagal membuka file ${label}. Coba lagi nanti.`);
      }
      console.error('Error opening file:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="text-primary hover:text-primary/80 transition-colors"
          aria-label={`Lihat ${label}`}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>Lihat {label}</TooltipContent>
    </Tooltip>
  );
}
