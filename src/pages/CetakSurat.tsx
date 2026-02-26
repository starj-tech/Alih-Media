import { useParams, useNavigate } from 'react-router-dom';
import { getBerkasById } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import pancasilaImg from '@/assets/pancasila.png';

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

  const jenisHakFull: Record<string, string> = {
    'SHM': 'HAK MILIK',
    'SHGB': 'HAK GUNA BANGUNAN',
    'HGB': 'HAK GUNA BANGUNAN',
    'HP': 'HAK PAKAI',
    'HGU': 'HAK GUNA USAHA',
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-[210mm] mx-auto print:hidden mb-6 flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" /> Cetak Surat
        </Button>
      </div>

      <div className="print-area max-w-[210mm] mx-auto bg-white text-black px-16 py-12 shadow-xl print:shadow-none print:p-16" style={{ fontFamily: 'Times New Roman, serif', minHeight: '297mm' }}>
        {/* Logo Garuda */}
        <div className="text-center mb-6">
          <img src={pancasilaImg} alt="Garuda Pancasila" className="w-20 h-auto mx-auto mb-4" style={{ mixBlendMode: 'multiply' }} />
          <p className="text-sm font-bold italic tracking-wide" style={{ fontSize: '13px' }}>LAMPIRAN PENDUKUNG</p>
          <p className="text-sm font-bold italic tracking-wide" style={{ fontSize: '13px' }}>VALIDASI ALIH MEDIA</p>
          <p className="text-sm font-bold italic tracking-wide" style={{ fontSize: '13px' }}>KANTOR PERTANAHAN KABUPATEN BOGOR II</p>
        </div>

        <hr className="border-black mb-4" />

        {/* Validasi info - right aligned */}
        <div className="text-right text-sm mb-6">
          <p>Validasi</p>
          <p>Tanggal Pengajuan <span className="font-bold underline">{berkas.tanggalPengajuan}</span></p>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold italic" style={{ fontFamily: 'Times New Roman, serif', fontSize: '24px' }}>SERTIPIKAT HAK ATAS TANAH</h1>
          <p className="text-sm mt-1" style={{ fontSize: '13px' }}>Nomor Berkas :</p>
          <p className="text-sm" style={{ fontSize: '13px' }}>{berkas.noBerkas}</p>
        </div>

        {/* Pemegang Hak */}
        <div className="text-center mb-8 mt-10">
          <p className="text-sm font-bold" style={{ fontSize: '13px' }}>Pemegang Hak Sertipikat</p>
          <p className="text-xl font-bold mt-3" style={{ fontSize: '20px', letterSpacing: '1px' }}>{berkas.namaPemegangHak.toUpperCase()}</p>
          <p className="text-sm mt-1 text-gray-500" style={{ fontSize: '12px' }}>27/11/1995</p>
        </div>

        {/* Jenis dan Nomor Hak */}
        <div className="text-center mb-6">
          <p className="text-sm font-bold" style={{ fontSize: '13px' }}>Jenis dan Nomor Hak</p>
        </div>

        <hr className="border-black mb-1" />

        <table className="w-full text-sm mb-1" style={{ fontSize: '12px' }}>
          <thead>
            <tr className="border-b border-black">
              <th className="py-2 text-left font-semibold" style={{ width: '12%' }}>No. Urut</th>
              <th className="py-2 text-left font-semibold" style={{ width: '18%' }}>Jenis Hak</th>
              <th className="py-2 text-left font-semibold" style={{ width: '15%' }}>Nomor Hak</th>
              <th className="py-2 text-left font-semibold" style={{ width: '35%' }}>Wilayah</th>
              <th className="py-2 text-left font-semibold" style={{ width: '20%' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="py-2">1</td>
              <td className="py-2">{jenisHakFull[berkas.jenisHak] || berkas.jenisHak}</td>
              <td className="py-2">{berkas.noHak}</td>
              <td className="py-2">Desa. {berkas.desa}, Kec. {berkas.kecamatan}</td>
              <td className="py-2">Selesai</td>
            </tr>
          </tbody>
        </table>

        <hr className="border-black mb-10" />

        {/* Informasi Validasi */}
        <div className="text-center mb-16 mt-10">
          <h3 className="text-sm font-bold mb-4" style={{ fontSize: '14px' }}>INFORMASI VALIDASI</h3>
          <div className="text-sm leading-relaxed max-w-lg mx-auto" style={{ fontSize: '12px' }}>
            <p>Pengajuan Validasi Alih Media Pada Buku Tanah, Surat Ukur Dan Bidang Telah Selesai.</p>
            <p className="mt-2">Untuk Mengajukan Suatu Permohonan Pada Layanan Pertanahan, Harap Melampirkan Bukti Validasi Alih Media Ini Kepada Kantor Pertanahan Kabupaten Bogor II.</p>
            <p className="mt-2 italic underline">Untuk Pengecekan Sertipikat Mohon Upload Lampiran Ini Pada Saat Pendaftaran.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto text-sm" style={{ fontSize: '12px' }}>
          <p>Telah Diperiksa</p>
          <p>Sesuai Dengan Arsip Kantah Kab.Bogor II</p>
          <p className="mt-6 font-bold underline italic" style={{ fontSize: '13px' }}>NAMA PETUGAS VALIDASI</p>

          <hr className="border-black mt-4 mb-2" />

          <div className="text-xs leading-relaxed" style={{ fontSize: '10px' }}>
            <p className="font-bold">Perhatian :</p>
            <p>- Apabila Lampiran ini hilang mohon untuk dikembalikan kepada kantor pertanahan kabupaten Bogor II</p>
            <p>- Dilarang melakukan Pemalsuan seperti mengedit atau merubah data</p>
            <p>- Lampiran ini bersifat Kode Uniq tidak bisa merubah atau memalsukan data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
