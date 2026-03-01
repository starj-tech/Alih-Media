import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getSignedFileUrl } from '@/lib/data';

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
      if (!signedUrl) return;
      try {
        if (window.top && window.top !== window && typeof window.top.open === 'function') {
          const w = window.top.open(signedUrl, '_blank', 'noopener,noreferrer');
          if (w) return;
        }
      } catch { /* cross-origin */ }
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
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
