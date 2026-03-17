import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { addBerkas, uploadFile, getTodaySubmissionCount, JenisHak } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { sanitizeString, isSuperUser } from '@/lib/auth';
import { getKecamatanList, getDesaByKecamatan } from '@/lib/wilayah';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, FileUp, CalendarDays, ChevronsUpDown, Check, AlertTriangle } from 'lucide-react';
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

const DAILY_LIMIT = 5;

export default function PengajuanAlihmedia() {
  const { user } = useAuth();
  const today = new Date();
  const tanggal = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const isSU = user ? isSuperUser(user.role) : false;

  const [form, setForm] = useState({
    noSuTahun: '',
    jenisHak: '' as JenisHak | '',
    noHak: '',
    desa: '',
    kecamatan: '',
    linkShareloc: '',
    namaPemilikSertifikat: '',
    noWaPemohon: '',
  });

  const [fileSertifikat, setFileSertifikat] = useState<File | null>(null);
  const [fileKtp, setFileKtp] = useState<File | null>(null);
  const [fileFotoBangunan, setFileFotoBangunan] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const sertifikatRef = useRef<HTMLInputElement>(null);
  const ktpRef = useRef<HTMLInputElement>(null);
  const fotoBangunanRef = useRef<HTMLInputElement>(null);

  const [kecOpen, setKecOpen] = useState(false);
  const [desaOpen, setDesaOpen] = useState(false);

  const kecamatanList = getKecamatanList();
  const desaList = useMemo(() => form.kecamatan ? getDesaByKecamatan(form.kecamatan) : [], [form.kecamatan]);

  // Check daily limit
  useEffect(() => {
    if (user && !isSU) {
      getTodaySubmissionCount(user.id).then(count => {
        setTodayCount(count);
        if (count >= DAILY_LIMIT) setQuotaExceeded(true);
      });
    }
  }, [user, isSU]);

  const validateFilePdf = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      toast.error('File harus berformat PDF');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return false;
    }
    return true;
  };

  const validateFileImage = (file: File): boolean => {
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('File harus berformat JPG/JPEG');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check daily limit for non-super users
    if (!isSU && todayCount >= DAILY_LIMIT) {
      setQuotaExceeded(true);
      return;
    }

    const sanitized = {
      noSuTahun: sanitizeString(form.noSuTahun),
      jenisHak: form.jenisHak,
      noHak: sanitizeString(form.noHak),
      desa: sanitizeString(form.desa),
      kecamatan: sanitizeString(form.kecamatan),
      linkShareloc: sanitizeString(form.linkShareloc || ''),
    };

    if (!sanitized.noSuTahun || !sanitized.jenisHak || !sanitized.noHak || !sanitized.desa || !sanitized.kecamatan) {
      toast.error('Lengkapi semua field');
      return;
    }

    if (isSU && (!form.namaPemilikSertifikat.trim() || !form.noWaPemohon.trim())) {
      toast.error('Nama Pemilik Sertipikat dan Nomor WhatsApp wajib diisi');
      return;
    }

    const noSuNumber = sanitized.noSuTahun.split('/')[0]?.replace(/\D/g, '') || '';
    if (noSuNumber.length < 5) {
      toast.error('No SU harus minimal 5 digit');
      return;
    }

    if (sanitized.noHak.length < 5) {
      toast.error('No Hak harus minimal 5 digit');
      return;
    }

    // Super User doesn't need to upload files
    if (!isSU) {
      if (!fileSertifikat || !fileKtp) {
        toast.error('Upload file Sertifikat dan KTP wajib diisi');
        return;
      }
    }

    setSubmitting(true);
    try {
      let sertifikatUrl: string | undefined = undefined;
      let ktpUrl: string | undefined = undefined;
      let fotoBangunanUrl: string | undefined = undefined;

      const totalFiles = [fileSertifikat, fileKtp, fileFotoBangunan].filter(Boolean).length;
      let filesUploaded = 0;

      const makeProgress = (label: string) => (percent: number) => {
        setUploadLabel(label);
        const base = (filesUploaded / Math.max(totalFiles, 1)) * 100;
        const portion = (percent / Math.max(totalFiles, 1));
        setUploadProgress(Math.round(base + portion));
      };

      if (fileSertifikat) {
        sertifikatUrl = await uploadFile(fileSertifikat, user?.id || '', 'sertifikat', makeProgress('Sertifikat'));
        filesUploaded++;
      }
      if (fileKtp) {
        ktpUrl = await uploadFile(fileKtp, user?.id || '', 'ktp', makeProgress('KTP'));
        filesUploaded++;
      }
      if (fileFotoBangunan) {
        fotoBangunanUrl = await uploadFile(fileFotoBangunan, user?.id || '', 'foto-bangunan', makeProgress('Foto Bangunan'));
        filesUploaded++;
      }
      setUploadLabel('Menyimpan data...');
      setUploadProgress(100);

      const result = await addBerkas({
        tanggalPengajuan: tanggal,
        namaPemegangHak: user?.name || '',
        noTelepon: '',
        noSuTahun: sanitized.noSuTahun,
        jenisHak: sanitized.jenisHak as JenisHak,
        noHak: sanitized.noHak,
        desa: sanitized.desa,
        kecamatan: sanitized.kecamatan,
        linkShareloc: sanitized.linkShareloc,
        userId: user?.id || '',
        fileSertifikatUrl: sertifikatUrl,
        fileKtpUrl: ktpUrl,
        fileFotoBangunanUrl: fotoBangunanUrl,
        namaPemilikSertifikat: isSU ? sanitizeString(form.namaPemilikSertifikat) : undefined,
        noWaPemohon: isSU ? sanitizeString(form.noWaPemohon) : undefined,
      } as any);
      if (result) {
        toast.success('Pengajuan berhasil dikirim!');
        setForm({ noSuTahun: '', jenisHak: '', noHak: '', desa: '', kecamatan: '', linkShareloc: '', namaPemilikSertifikat: '', noWaPemohon: '' });
        setFileSertifikat(null);
        setFileKtp(null);
        setFileFotoBangunan(null);
        if (sertifikatRef.current) sertifikatRef.current.value = '';
        if (ktpRef.current) ktpRef.current.value = '';
        if (fotoBangunanRef.current) fotoBangunanRef.current.value = '';
        if (!isSU) {
          const newCount = todayCount + 1;
          setTodayCount(newCount);
          if (newCount >= DAILY_LIMIT) setQuotaExceeded(true);
        }
      } else {
        toast.error('Gagal mengirim pengajuan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengirim pengajuan');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
      setUploadLabel('');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-2xl px-1 sm:px-0">
      <div>
        <h1 className="text-base sm:text-lg font-bold text-foreground">Pengajuan Alihmedia</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Input pengajuan berkas alihmedia baru</p>
        {!isSU && (
          <p className="text-xs text-muted-foreground mt-1">
            Kuota hari ini: <span className="font-semibold">{todayCount}/{DAILY_LIMIT}</span>
          </p>
        )}
      </div>

      <div className="gentelella-panel">
        <div className="gentelella-panel-heading">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary" />
            Input Pengajuan Berkas Alihmedia
          </h3>
        </div>
        <div className="gentelella-panel-body">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-xs">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                Tanggal Pendaftaran
              </Label>
              <Input value={tanggal} disabled className="bg-muted/50 mt-1 h-8 text-sm" />
            </div>

            <div>
              <Label className="text-xs">Nama Pemohon</Label>
              <Input value={user?.name || ''} disabled className="bg-muted/50 mt-1 h-8 text-sm" />
            </div>

            {isSU && (
              <>
                <div>
                  <Label className="text-xs">Nama Pemilik Sertipikat <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.namaPemilikSertifikat}
                    onChange={e => setForm(f => ({ ...f, namaPemilikSertifikat: e.target.value }))}
                    placeholder="Masukkan nama pemilik sertipikat"
                    className="mt-1 h-8 text-sm"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label className="text-xs">Nomor WhatsApp Pemohon <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.noWaPemohon}
                    onChange={e => setForm(f => ({ ...f, noWaPemohon: e.target.value }))}
                    placeholder="Contoh: 08123456789"
                    className="mt-1 h-8 text-sm"
                    maxLength={20}
                  />
                </div>
              </>
            )}

            <div>
              <Label className="text-xs">No.SU/Tahun <span className="text-destructive">*</span></Label>
              <Input
                value={form.noSuTahun}
                onChange={e => setForm(f => ({ ...f, noSuTahun: e.target.value }))}
                placeholder="Contoh: 03360/2026"
                className="mt-1 h-8 text-sm"
                minLength={5}
                maxLength={50}
              />
              {(form.noSuTahun.split('/')[0]?.replace(/\D/g, '') || '').length > 0 && (form.noSuTahun.split('/')[0]?.replace(/\D/g, '') || '').length < 5 && (
                <p className="text-xs text-destructive mt-1">No SU harus minimal 5 digit</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs">No Hak <span className="text-destructive">*</span></Label>
                <Input
                  value={form.noHak}
                  onChange={e => setForm(f => ({ ...f, noHak: e.target.value }))}
                  placeholder="Contoh: 00455"
                  className="mt-1 h-8 text-sm"
                  minLength={5}
                  maxLength={50}
                />
                {form.noHak.length > 0 && form.noHak.length < 5 && (
                  <p className="text-xs text-destructive mt-1">No Hak harus minimal 5 digit</p>
                )}
              </div>
              <div>
                <Label className="text-xs">Pilih Jenis Hak <span className="text-destructive">*</span></Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs">Kecamatan <span className="text-destructive">*</span></Label>
                <Popover open={kecOpen} onOpenChange={setKecOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={kecOpen} className="mt-1 w-full h-8 text-sm justify-between font-normal">
                      <span className="truncate">{form.kecamatan || 'Pilih kecamatan...'}</span>
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
                <Label className="text-xs">Desa <span className="text-destructive">*</span></Label>
                <Popover open={desaOpen} onOpenChange={setDesaOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={desaOpen} disabled={!form.kecamatan} className="mt-1 w-full h-8 text-sm justify-between font-normal">
                      <span className="truncate">{form.desa || 'Pilih desa...'}</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-xs">Upload Sertifikat (PDF, maks 5MB){isSU ? ' - opsional' : ''} {!isSU && <span className="text-destructive">*</span>}</Label>
                <Input
                  ref={sertifikatRef}
                  type="file"
                  accept=".pdf"
                  className="mt-1 h-8 text-xs sm:text-sm"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (file && !validateFilePdf(file)) { e.target.value = ''; return; }
                    setFileSertifikat(file);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Upload KTP Pemegang Sertifikat (JPG, maks 5MB){isSU ? ' - opsional' : ''} {!isSU && <span className="text-destructive">*</span>}</Label>
                <Input
                  ref={ktpRef}
                  type="file"
                  accept=".jpg,.jpeg"
                  className="mt-1 h-8 text-xs sm:text-sm"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    if (file && !validateFileImage(file)) { e.target.value = ''; return; }
                    setFileKtp(file);
                  }}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Upload Photo Bangunan / Lokasi Tanah dengan Geotag (JPG, maks 5MB) - opsional</Label>
              <Input
                ref={fotoBangunanRef}
                type="file"
                accept=".jpg,.jpeg"
                className="mt-1 h-8 text-xs sm:text-sm"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  if (file && !validateFileImage(file)) { e.target.value = ''; return; }
                  setFileFotoBangunan(file);
                }}
              />
            </div>

            <div>
              <Label className="text-xs">Tautan Koordinat Shareloc (opsional)</Label>
              <Input
                value={form.linkShareloc || ''}
                onChange={e => setForm(f => ({ ...f, linkShareloc: e.target.value }))}
                placeholder="Masukkan link koordinat shareloc bidang tanah"
                className="mt-1 h-8 text-sm"
                maxLength={500}
              />
            </div>

            {submitting && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mengupload {uploadLabel}...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <Button type="submit" className="w-full gap-2 h-9 text-sm" disabled={submitting || (!isSU && quotaExceeded)}>
              <Send className="w-4 h-4" />
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </form>
        </div>
      </div>

      {/* Quota exceeded dialog */}
      <Dialog open={quotaExceeded && !isSU} onOpenChange={setQuotaExceeded}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Kuota Harian Tercapai
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Pengajuan Validasi Alihmedia sudah melebihi batas kuota yang ditentukan. Lakukan kembali di hari berikutnya.
          </p>
          <Button onClick={() => setQuotaExceeded(false)} className="w-full">Tutup</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
