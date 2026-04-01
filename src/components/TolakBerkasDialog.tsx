import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { Berkas } from '@/lib/data';

const KETERANGAN_PENOLAKAN = [
  'Pendaftaran Pelayanan',
  'Penataan Batas',
  'Pengukuran Ulang',
  'Perubahan Nama KTP',
  'Pemekaran Desa',
  'Pemekaran Kecamatan',
  'Revisi Double Nomor Hak',
];

interface TolakBerkasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  berkas: Berkas | null;
  onSubmit: (params: {
    jenisPenolakan: 'aplikasi' | 'whatsapp';
    keteranganPenolakan: string;
    catatan: string;
  }) => void;
}

export default function TolakBerkasDialog({ open, onOpenChange, berkas, onSubmit }: TolakBerkasDialogProps) {
  const [jenisPenolakan, setJenisPenolakan] = useState<'aplikasi' | 'whatsapp'>('aplikasi');
  const [keteranganPenolakan, setKeteranganPenolakan] = useState('');
  const [catatan, setCatatan] = useState('');

  const reset = () => {
    setJenisPenolakan('aplikasi');
    setKeteranganPenolakan('');
    setCatatan('');
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleSubmit = () => {
    onSubmit({ jenisPenolakan, keteranganPenolakan, catatan });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Penolakan Berkas</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {berkas?.catatanPenolakan && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1">Catatan sebelumnya:</p>
              <p className="text-sm text-destructive">{berkas.catatanPenolakan}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-semibold">1. Pilih Jenis Penolakan</Label>
            <RadioGroup value={jenisPenolakan} onValueChange={(v) => setJenisPenolakan(v as 'aplikasi' | 'whatsapp')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aplikasi" id="tolak-app" />
                <Label htmlFor="tolak-app" className="cursor-pointer">Tolak Melalui Aplikasi</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="tolak-wa" />
                <Label htmlFor="tolak-wa" className="cursor-pointer">Tolak Melalui WhatsApp</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">2. Pilih Keterangan Penolakan</Label>
            <Select value={keteranganPenolakan} onValueChange={setKeteranganPenolakan}>
              <SelectTrigger>
                <SelectValue placeholder="-- Pilih Keterangan --" />
              </SelectTrigger>
              <SelectContent>
                {KETERANGAN_PENOLAKAN.map(k => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">3. Catatan Penolakan</Label>
            <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Masukkan catatan penolakan berkas..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleSubmit}>
            <Send className="w-3 h-3 mr-1" /> Kirim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
