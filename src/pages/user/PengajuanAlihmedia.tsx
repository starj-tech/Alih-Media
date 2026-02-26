import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addBerkas, JenisHak } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, FileUp, CalendarDays, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function PengajuanAlihmedia() {
  const { user } = useAuth();
  const today = new Date();
  const tanggal = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [form, setForm] = useState({
    namaPemegangHak: '',
    noTelepon: '',
    jenisHak: '' as JenisHak | '',
    noHak: '',
    desa: '',
    kecamatan: '',
    linkShareloc: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaPemegangHak || !form.noTelepon || !form.jenisHak || !form.noHak || !form.desa || !form.kecamatan) {
      toast.error('Lengkapi semua field');
      return;
    }
    addBerkas({
      tanggalPengajuan: tanggal,
      namaPemegangHak: form.namaPemegangHak,
      noTelepon: form.noTelepon,
      jenisHak: form.jenisHak as JenisHak,
      noHak: form.noHak,
      desa: form.desa,
      kecamatan: form.kecamatan,
      userId: user?.id || '',
    });
    toast.success('Pengajuan berhasil dikirim!');
    setForm({ namaPemegangHak: '', noTelepon: '', jenisHak: '', noHak: '', desa: '', kecamatan: '', linkShareloc: '' });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pengajuan Alihmedia</h1>
        <p className="text-gray-600">Input pengajuan berkas alihmedia baru</p>
      </div>

      <div className="glass-card rounded-xl p-8 shadow-lg animate-fade-in">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <FileUp className="w-5 h-5 text-primary" />
          Input Pengajuan Berkas Alihmedia
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Tanggal Pendaftaran
            </Label>
            <Input value={tanggal} disabled className="bg-muted/50 mt-1" />
          </div>

          <div>
            <Label>Nama Pemegang Hak</Label>
            <Input
              value={form.namaPemegangHak}
              onChange={e => setForm(f => ({ ...f, namaPemegangHak: e.target.value }))}
              placeholder="Masukkan nama pemegang hak"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Nomor Telepon
            </Label>
            <Input
              value={form.noTelepon}
              onChange={e => setForm(f => ({ ...f, noTelepon: e.target.value }))}
              placeholder="Masukkan nomor telepon"
              type="tel"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Pilih Jenis Hak</Label>
            <Select value={form.jenisHak} onValueChange={v => setForm(f => ({ ...f, jenisHak: v as JenisHak }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih jenis hak" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SHM">SHM (Sertifikat Hak Milik)</SelectItem>
                <SelectItem value="SHGB">SHGB</SelectItem>
                <SelectItem value="HGB">HGB (Hak Guna Bangunan)</SelectItem>
                <SelectItem value="HP">HP (Hak Pakai)</SelectItem>
                <SelectItem value="HGU">HGU (Hak Guna Usaha)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>No Hak</Label>
            <Input
              value={form.noHak}
              onChange={e => setForm(f => ({ ...f, noHak: e.target.value }))}
              placeholder="Masukkan nomor hak"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Desa</Label>
              <Input
                value={form.desa}
                onChange={e => setForm(f => ({ ...f, desa: e.target.value }))}
                placeholder="Nama desa"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Kecamatan</Label>
              <Input
                value={form.kecamatan}
                onChange={e => setForm(f => ({ ...f, kecamatan: e.target.value }))}
                placeholder="Nama kecamatan"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Upload KTP & Sertifikat (PDF, maks 50kb)</Label>
            <Input type="file" accept=".pdf" className="mt-1" />
          </div>

          <div>
            <Label>Link Shareloct Bidang Tanah</Label>
            <Input
              value={form.linkShareloc || ''}
              onChange={e => setForm(f => ({ ...f, linkShareloc: e.target.value }))}
              placeholder="Masukkan link shareloc bidang tanah"
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full gap-2">
            <Send className="w-4 h-4" />
            Kirim Pengajuan
          </Button>
        </form>
      </div>
    </div>
  );
}
