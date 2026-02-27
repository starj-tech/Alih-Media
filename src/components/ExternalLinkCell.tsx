import { useMemo, useState } from 'react';
import { Copy, ExternalLink, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return null;
  }
};

const openExternalLink = (url: string) => {
  try {
    if (window.top && window.top !== window && typeof window.top.open === 'function') {
      const openedFromTop = window.top.open(url, '_blank', 'noopener,noreferrer');
      if (openedFromTop) {
        openedFromTop.opener = null;
        return true;
      }
    }
  } catch {
    // Ignore cross-origin/top-window restrictions and continue with local open.
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) {
    opened.opener = null;
    return true;
  }

  return false;
};

export default function ExternalLinkCell({ url }: ExternalLinkCellProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const normalizedUrl = useMemo(() => normalizeExternalUrl(url), [url]);

  if (!normalizedUrl) {
    return <span className="text-muted-foreground">-</span>;
  }

  const handleOpenLink = () => {
    const opened = openExternalLink(normalizedUrl);

    if (!opened) {
      navigator.clipboard.writeText(normalizedUrl);
      toast.error('Tab baru diblokir browser. Link disalin, silakan buka manual.');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(normalizedUrl);
    toast.success('Link disalin');
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <span className="max-w-[160px] truncate text-xs text-muted-foreground" title={normalizedUrl}>
          {normalizedUrl}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleOpenLink}
              className="text-primary hover:text-primary/80"
              aria-label="Buka link"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Buka link</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Lihat link lengkap"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Lihat lengkap</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Link Shareloc</DialogTitle>
            <DialogDescription>URL lengkap untuk dibuka atau disalin.</DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="break-all text-sm text-foreground">{normalizedUrl}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="gap-2" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
              Salin Link
            </Button>
            <Button type="button" className="gap-2" onClick={handleOpenLink}>
              <ExternalLink className="h-4 w-4" />
              Buka Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
