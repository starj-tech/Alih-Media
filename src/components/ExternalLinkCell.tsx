import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ExternalLinkCellProps {
  url?: string | null;
}

const normalizeExternalUrl = (rawUrl?: string | null) => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
};

export default function ExternalLinkCell({ url }: ExternalLinkCellProps) {
  const normalizedUrl = useMemo(() => normalizeExternalUrl(url), [url]);

  if (!normalizedUrl) {
    return <span className="text-muted-foreground">-</span>;
  }

  const handleClick = () => {
    // Copy to clipboard first as reliable fallback
    navigator.clipboard.writeText(normalizedUrl);

    // Try opening via top window (escapes iframe sandbox)
    try {
      if (window.top && window.top !== window && typeof window.top.open === 'function') {
        const w = window.top.open(normalizedUrl, '_blank', 'noopener,noreferrer');
        if (w) { w.opener = null; return; }
      }
    } catch { /* cross-origin */ }

    // Fallback: regular window.open
    const w = window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    if (w) { w.opener = null; return; }

    // If all blocked, notify user link was copied
    toast.info('Link disalin ke clipboard, silakan buka manual.');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="text-primary hover:text-primary/80 transition-colors"
          aria-label="Buka link"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{normalizedUrl}</TooltipContent>
    </Tooltip>
  );
}