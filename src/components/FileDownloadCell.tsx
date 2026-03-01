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
      // Open window synchronously to avoid popup blocker (async breaks user gesture)
      let newWindow: Window | null = null;
      try {
        if (window.top && window.top !== window && typeof window.top.open === 'function') {
          newWindow = window.top.open('about:blank', '_blank', 'noopener,noreferrer');
        }
      } catch { /* cross-origin */ }
      if (!newWindow) {
        newWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
      }

      const signedUrl = await getSignedFileUrl(url);
      if (!signedUrl) {
        newWindow?.close();
        return;
      }

      if (newWindow) {
        newWindow.location.href = signedUrl;
      } else {
        // Fallback: use anchor element
        const a = document.createElement('a');
        a.href = signedUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
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
