import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Loader2, Navigation, Building2, Wifi } from 'lucide-react';

interface IpLocationData {
  ip: string;
  country: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  status: string;
  message?: string;
}

interface Props {
  ip: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IpLocationDialog({ ip, open, onOpenChange }: Props) {
  const [data, setData] = useState<IpLocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    if (!ip) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
      const json = await res.json();
      if (json.status === 'fail') {
        setError(json.message || 'Gagal mendapatkan lokasi IP');
      } else {
        setData({ ...json, ip });
      }
    } catch {
      setError('Gagal menghubungi layanan geolokasi');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (v && ip) {
      fetchLocation();
    }
    if (!v) {
      setData(null);
      setError(null);
    }
    onOpenChange(v);
  };

  const openMap = () => {
    if (data) {
      window.open(`https://www.google.com/maps?q=${data.lat},${data.lon}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Lokasi IP Address
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm space-y-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">IP Address:</span>
            <span className="font-mono font-semibold">{ip || '-'}</span>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-6 text-destructive text-sm">{error}</div>
          )}

          {data && (
            <div className="space-y-2">
              <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-start">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Negara</span>
                </div>
                <span className="font-medium">{data.country}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Wilayah</span>
                </div>
                <span className="font-medium">{data.regionName}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Kota</span>
                </div>
                <span className="font-medium">{data.city}{data.zip ? ` (${data.zip})` : ''}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Navigation className="w-4 h-4" />
                  <span>Koordinat</span>
                </div>
                <span className="font-medium font-mono text-xs">{data.lat}, {data.lon}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Timezone</span>
                </div>
                <span className="font-medium">{data.timezone}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wifi className="w-4 h-4" />
                  <span>ISP</span>
                </div>
                <span className="font-medium">{data.isp}</span>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>Organisasi</span>
                </div>
                <span className="font-medium">{data.org || '-'}</span>
              </div>

              <Button onClick={openMap} variant="outline" className="w-full mt-3 gap-2">
                <MapPin className="w-4 h-4" />
                Buka di Google Maps
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
