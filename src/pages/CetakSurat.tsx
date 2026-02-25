import { useParams, useNavigate } from 'react-router-dom';
import { getBerkasById } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import garudaImg from '@/assets/garuda.jpeg';

export default function CetakSurat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const berkas = id ? getBerkasById(id) : undefined;

  if (!berkas) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <p className="text-foreground text-lg">Berkas tidak ditemukan</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>Kembali</Button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const jenisHakFull: Record<string, string> = {
    'SHM': 'HAK MILIK',
    'SHGB': 'HAK GUNA BANGUNAN',
    'HGB': 'HAK GUNA BANGUNAN',
    'HP': 'HAK PAKAI',
    'HGU': 'HAK GUNA USAHA',
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen gradient-bg p-8">
      <div className="max-w-3xl mx-auto print:hidden mb-6 flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" /> Cetak Surat
        </Button>
      </div>

      <div className="print-area max-w-3xl mx-auto bg-card p-12 shadow-xl rounded-xl print:rounded-none print:shadow-none">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={garudaImg} alt="Garuda" className="w-16 h-auto mx-auto mb-3" />
          <h2 className="text-sm font-bold tracking-wide text-foreground">LAMPIRAN PENDUKUNG</h2>
          <h2 className="text-sm font-bold tracking-wide text-foreground">VALIDASI ALIH MEDIA</h2>
          <h2 className="text-sm font-bold tracking-wide text-foreground">KANTOR PERTANAHAN KABUPATEN BOGOR II</h2>
        </div>

        {/* Validation info */}
        <div className="text-right text-sm text-foreground mb-6">
          <p>Validasi</p>
          <p>Tanggal Pengajuan <span className="text-primary underline">{berkas.tanggalPengajuan}</span></p>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">SERTIPIKAT HAK ATAS TANAH</h1>
          <p className="text-sm text-foreground">Nomor Berkas : {berkas.noBerkas}</p>
        </div>

        {/* Holder info */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-foreground">Pemegang Hak Sertipikat</p>
          <p className="text-lg font-bold text-foreground mt-1">{berkas.namaPemegangHak.toUpperCase()}</p>
          <p className="text-sm text-foreground">27/11/1995</p>
        </div>

        {/* Jenis dan Nomor Hak */}
        <div className="text-center mb-4">
          <p className="text-sm font-bold text-foreground">Jenis dan Nomor Hak</p>
        </div>

        <table className="w-full border-collapse mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-foreground/30">
              <th className="py-2 px-3 text-left text-foreground font-semibold">No. Urut</th>
              <th className="py-2 px-3 text-left text-foreground font-semibold">Jenis Hak</th>
              <th className="py-2 px-3 text-left text-foreground font-semibold">Nomor Hak</th>
              <th className="py-2 px-3 text-left text-foreground font-semibold">Wilayah</th>
              <th className="py-2 px-3 text-left text-foreground font-semibold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-foreground/20">
              <td className="py-2 px-3 text-foreground">1</td>
              <td className="py-2 px-3 text-foreground">{jenisHakFull[berkas.jenisHak] || berkas.jenisHak}</td>
              <td className="py-2 px-3 text-foreground">{berkas.noHak}</td>
              <td className="py-2 px-3 text-foreground">Desa. {berkas.desa}, Kec. {berkas.kecamatan}</td>
              <td className="py-2 px-3 text-foreground">Selesai</td>
            </tr>
          </tbody>
        </table>

        {/* Informasi Validasi */}
        <div className="text-center mb-8">
          <h3 className="text-sm font-bold text-foreground mb-3">INFORMASI VALIDASI</h3>
          <div className="text-sm text-foreground leading-relaxed max-w-lg mx-auto">
            <p>Pengajuan Validasi Alih Media Pada Buku Tanah, Surat Ukur Dan Bidang Telah Selesai.</p>
            <p className="mt-2">Untuk Mengajukan Suatu Permohonan Pada Layanan Pertanahan, Harap Melampirkan Bukti Validasi Alih Media Ini Kepada Kantor Pertanahan Kabupaten Bogor II.</p>
            <p className="mt-2 italic underline">Untuk Pengecekan Sertipikat Mohon Upload Lampiran Ini Pada Saat Pendaftaran.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-foreground">
          <p>Telah Diperiksa</p>
          <p>Sesuai Dengan Arsip Kantah Kab.Bogor II</p>
          <p className="mt-6 font-bold text-primary underline">NAMA PETUGAS VALIDASI</p>
          <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
            <p>Perhatian :</p>
            <p>- Apabila Lampiran ini hilang mohon untuk dikembalikan kepada kantor pertanahan kabupaten Bogor II</p>
            <p>- Dilarang melakukan Pemalsuan seperti mengedit atau merubah data</p>
            <p>- Lampiran ini bersifat Kode Uniq tidak bisa merubah atau memalsukan data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
