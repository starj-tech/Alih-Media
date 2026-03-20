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
      const signedUrl = await getSignedFileUrl(url);
      if (!signedUrl) {
        toast.error('Gagal membuka file. File tidak ditemukan di storage.');
        return;
      }

      const isBlobUrl = signedUrl.startsWith('blob:');
      const a = document.createElement('a');
      a.href = signedUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (isBlobUrl) {
        window.setTimeout(() => URL.revokeObjectURL(signedUrl), 60000);
      }
    } catch (err) {
      console.error('Error opening file:', err);
      toast.error('Gagal membuka file. Terjadi kesalahan.');
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
