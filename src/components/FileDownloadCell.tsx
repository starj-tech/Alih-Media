import { FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FileDownloadCellProps {
  url?: string;
  label: string;
}

export default function FileDownloadCell({ url, label }: FileDownloadCellProps) {
  if (!url) return <span className="text-muted-foreground text-xs">-</span>;

  const handleClick = () => {
    try {
      if (window.top && window.top !== window && typeof window.top.open === 'function') {
        const w = window.top.open(url, '_blank', 'noopener,noreferrer');
        if (w) return;
      }
    } catch { /* cross-origin */ }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="text-primary hover:text-primary/80 transition-colors"
          aria-label={`Lihat ${label}`}
        >
          <FileText className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Lihat {label}</TooltipContent>
    </Tooltip>
  );
}
