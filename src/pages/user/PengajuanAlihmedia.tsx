import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addBerkas, JenisHak } from '@/lib/data';
import { sanitizeString } from '@/lib/auth';
import { getKecamatanList, getDesaByKecamatan } from '@/lib/wilayah';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, FileUp, CalendarDays, Phone, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const jenisHakOptions: { value: JenisHak; label: string }[] = [
  { value: 'HM', label: 'HM (Hak Milik)' },
  { value: 'HGB', label: 'HGB (Hak Guna Bangunan)' },
  { value: 'HP', label: 'HP (Hak Pakai)' },
  { value: 'HGU', label: 'HGU (Hak Guna Usaha)' },
  { value: 'HMSRS', label: 'Hak Milik Satuan Rumah Susun' },
  { value: 'HPL', label: 'Hak Pengelolaan' },
  { value: 'HW', label: 'Hak Wakaf' },
];

export default function PengajuanAlihmedia() {
  const { user } = useAuth();
  const today = new Date();
  const tanggal = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [form, setForm] = useState({
    namaPemegangHak: '',
    noTelepon: '',
    noSuTahun: '',
    jenisHak: '' as JenisHak | '',
    noHak: '',
    desa: '',
    kecamatan: '',
    linkShareloc: '',
  });

  const [kecOpen, setKecOpen] = useState(false);
  const [desaOpen, setDesaOpen] = useState(false);

  const kecamatanList = getKecamatanList();
  const desaList = useMemo(() => form.kecamatan ? getDesaByKecamatan(form.kecamatan) : [], [form.kecamatan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitized = {
      namaPemegangHak: sanitizeString(form.namaPemegangHak),
      noTelepon: form.noTelepon.replace(/[^\d+\-\s()]/g, ''),
      noSuTahun: sanitizeString(form.noSuTahun),
      jenisHak: form.jenisHak,
      noHak: sanitizeString(form.noHak),
      desa: sanitizeString(form.desa),
      kecamatan: sanitizeString(form.kecamatan),
      linkShareloc: sanitizeString(form.linkShareloc || ''),
    };

    if (!sanitized.namaPemegangHak || !sanitized.noTelepon || !sanitized.noSuTahun || !sanitized.jenisHak || !sanitized.noHak || !sanitized.desa || !sanitized.kecamatan) {
      toast.error('Lengkapi semua field');
      return;
    }

    if (sanitized.noTelepon.replace(/\D/g, '').length < 10) {
      toast.error('Nomor telepon tidak valid (minimal 10 digit)');
      return;
    }

    const result = await addBerkas({
      tanggalPengajuan: tanggal,
      namaPemegangHak: sanitized.namaPemegangHak,
      noTelepon: sanitized.noTelepon,
      noSuTahun: sanitized.noSuTahun,
      jenisHak: sanitized.jenisHak as JenisHak,
      noHak: sanitized.noHak,
      desa: sanitized.desa,
      kecamatan: sanitized.kecamatan,
      linkShareloc: sanitized.linkShareloc,
      userId: user?.id || '',
    });
    if (result) {
      toast.success('Pengajuan berhasil dikirim!');
      setForm({ namaPemegangHak: '', noTelepon: '', noSuTahun: '', jenisHak: '', noHak: '', desa: '', kecamatan: '', linkShareloc: '' });
    } else {
      toast.error('Gagal mengirim pengajuan');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-foreground">Pengajuan Alihmedia</h1>
        <p className="text-sm text-muted-foreground">Input pengajuan berkas alihmedia baru</p>
      </div>

      <div className="gentelella-panel">
        <div className="gentelella-panel-heading">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary" />
            Input Pengajuan Berkas Alihmedia
          </h3>
        </div>
        <div className="gentelella-panel-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                Tanggal Pendaftaran
              </Label>
              <Input value={tanggal} disabled className="bg-muted/50 mt-1 h-8 text-sm" />
            </div>

            <div>
              <Label className="text-xs">Nama Pemegang Hak</Label>
              <Input
                value={form.namaPemegangHak}
                onChange={e => setForm(f => ({ ...f, namaPemegangHak: e.target.value }))}
                placeholder="Masukkan nama pemegang hak"
                className="mt-1 h-8 text-sm"
                maxLength={100}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 text-xs">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                Nomor Telepon
              </Label>
              <Input
                value={form.noTelepon}
                onChange={e => setForm(f => ({ ...f, noTelepon: e.target.value }))}
                placeholder="Masukkan nomor telepon"
                type="tel"
                className="mt-1 h-8 text-sm"
                maxLength={20}
              />
            </div>

            <div>
              <Label className="text-xs">No.SU/Tahun</Label>
              <Input
                value={form.noSuTahun}
                onChange={e => setForm(f => ({ ...f, noSuTahun: e.target.value }))}
                placeholder="Contoh: 03360/2026"
                className="mt-1 h-8 text-sm"
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">No Hak</Label>
                <Input
                  value={form.noHak}
                  onChange={e => setForm(f => ({ ...f, noHak: e.target.value }))}
                  placeholder="Masukkan nomor hak"
                  className="mt-1 h-8 text-sm"
                  maxLength={50}
                />
              </div>
              <div>
                <Label className="text-xs">Pilih Jenis Hak</Label>
                <Select value={form.jenisHak} onValueChange={v => setForm(f => ({ ...f, jenisHak: v as JenisHak }))}>
                  <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Pilih jenis hak" /></SelectTrigger>
                  <SelectContent>
                    {jenisHakOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Kecamatan</Label>
                <Popover open={kecOpen} onOpenChange={setKecOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={kecOpen} className="mt-1 w-full h-8 text-sm justify-between font-normal">
                      {form.kecamatan || 'Pilih kecamatan...'}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari kecamatan..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {kecamatanList.map(kec => (
                            <CommandItem
                              key={kec}
                              value={kec}
                              onSelect={() => {
                                setForm(f => ({ ...f, kecamatan: kec, desa: '' }));
                                setKecOpen(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', form.kecamatan === kec ? 'opacity-100' : 'opacity-0')} />
                              {kec}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Desa</Label>
                <Popover open={desaOpen} onOpenChange={setDesaOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={desaOpen} disabled={!form.kecamatan} className="mt-1 w-full h-8 text-sm justify-between font-normal">
                      {form.desa || 'Pilih desa...'}
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari desa..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {desaList.map(desa => (
                            <CommandItem
                              key={desa}
                              value={desa}
                              onSelect={() => {
                                setForm(f => ({ ...f, desa }));
                                setDesaOpen(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', form.desa === desa ? 'opacity-100' : 'opacity-0')} />
                              {desa}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="text-xs">Upload Sertipikat & KTP (PDF, maks 50kb)</Label>
              <Input type="file" accept=".pdf" className="mt-1 h-8 text-sm" />
            </div>

            <div>
              <Label className="text-xs">Tautan Koordinat Shareloct</Label>
              <Input
                value={form.linkShareloc || ''}
                onChange={e => setForm(f => ({ ...f, linkShareloc: e.target.value }))}
                placeholder="Masukkan link koordinat shareloc bidang tanah"
                className="mt-1 h-8 text-sm"
                maxLength={500}
              />
            </div>

            <Button type="submit" className="w-full gap-2 h-9 text-sm">
              <Send className="w-4 h-4" />
              Kirim Pengajuan
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
