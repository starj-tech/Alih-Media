import { useParams, useNavigate } from 'react-router-dom';
import { getBerkasById } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import pancasilaImg from '@/assets/pancasila.png';
import watermarkImg from '@/assets/watermark-bpn.png';

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

      <div className="print-area max-w-[210mm] mx-auto bg-white text-black shadow-xl print:shadow-none relative overflow-hidden flex flex-col" style={{ fontFamily: 'Times New Roman, serif', minHeight: '297mm', padding: '15mm 20mm' }}>
        {/* Watermark BPN */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
          <img src={watermarkImg} alt="" className="w-[380px] h-auto" style={{ opacity: 0.12 }} />
        </div>
        <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>
        {/* Logo Garuda */}
        <div className="text-center" style={{ marginBottom: '14px' }}>
          <img src={pancasilaImg} alt="Garuda Pancasila" className="mx-auto" style={{ width: '70px', mixBlendMode: 'multiply', marginBottom: '10px' }} />
          <p className="font-bold italic" style={{ fontSize: '12pt', lineHeight: '1.4' }}>LAMPIRAN PENDUKUNG</p>
          <p className="font-bold italic" style={{ fontSize: '12pt', lineHeight: '1.4' }}>VALIDASI ALIH MEDIA</p>
          <p className="font-bold italic" style={{ fontSize: '12pt', lineHeight: '1.4' }}>KANTOR PERTANAHAN KABUPATEN BOGOR II</p>
        </div>

        <hr className="border-black" style={{ marginBottom: '6px' }} />

        {/* Validasi info - right aligned */}
        <div className="text-right" style={{ fontSize: '11pt', marginBottom: '16px' }}>
          <p>Validasi</p>
          <p>Tanggal Pengajuan <span className="font-bold underline">{berkas.tanggalPengajuan}</span></p>
        </div>

        {/* Title */}
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <h1 className="font-bold italic" style={{ fontSize: '22pt', lineHeight: '1.3' }}>SERTIPIKAT HAK ATAS TANAH</h1>
          <p style={{ fontSize: '11pt', marginTop: '4px' }}>Nomor Berkas :</p>
          <p style={{ fontSize: '11pt' }}>{berkas.noBerkas}</p>
        </div>

        {/* Pemegang Hak */}
        <div className="text-center" style={{ marginBottom: '16px', marginTop: '20px' }}>
          <p className="font-bold" style={{ fontSize: '11pt' }}>Pemegang Hak Sertipikat</p>
          <p className="font-bold" style={{ fontSize: '16pt', letterSpacing: '2px', marginTop: '10px' }}>{berkas.namaPemegangHak.toUpperCase()}</p>
          <p style={{ fontSize: '10pt', marginTop: '4px', color: '#666' }}>27/11/1995</p>
        </div>

        {/* Jenis dan Nomor Hak */}
        <div className="text-center" style={{ marginBottom: '20px' }}>
          <p className="font-bold" style={{ fontSize: '11pt' }}>Jenis dan Nomor Hak</p>
        </div>

        <hr className="border-black" style={{ marginBottom: '0' }} />

        <table className="w-full" style={{ fontSize: '10pt', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid black' }}>
              <th className="text-center font-semibold" style={{ width: '10%', padding: '6px 4px' }}>No. Urut</th>
              <th className="text-center font-semibold" style={{ width: '18%', padding: '6px 4px' }}>Jenis Hak</th>
              <th className="text-center font-semibold" style={{ width: '14%', padding: '6px 4px' }}>Nomor Hak</th>
              <th className="text-center font-semibold" style={{ width: '38%', padding: '6px 4px' }}>Wilayah</th>
              <th className="text-center font-semibold" style={{ width: '20%', padding: '6px 4px' }}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid black' }}>
              <td className="text-center" style={{ padding: '6px 4px' }}>1</td>
              <td className="text-center" style={{ padding: '6px 4px' }}>{jenisHakFull[berkas.jenisHak] || berkas.jenisHak}</td>
              <td className="text-center" style={{ padding: '6px 4px' }}>{berkas.noHak}</td>
              <td className="text-center" style={{ padding: '6px 4px' }}>Desa. {berkas.desa}, Kec. {berkas.kecamatan}</td>
              <td className="text-center" style={{ padding: '6px 4px' }}>Selesai</td>
            </tr>
          </tbody>
        </table>

        {/* Informasi Validasi */}
        <div className="text-center" style={{ marginTop: '36px', marginBottom: '24px' }}>
          <h3 className="font-bold" style={{ fontSize: '12pt', marginBottom: '12px' }}>INFORMASI VALIDASI</h3>
          <div className="mx-auto" style={{ fontSize: '11pt', lineHeight: '1.6', maxWidth: '480px' }}>
            <p>Pengajuan Validasi Alih Media Pada Buku Tanah, Surat Ukur Dan Bidang Telah Selesai.</p>
            <p>Untuk Mengajukan Suatu Permohonan Pada Layanan Pertanahan, Harap Melampirkan Bukti Validasi Alih Media Ini Kepada Kantor Pertanahan Kabupaten Bogor II.</p>
            <p className="italic underline">Untuk Pengecekan Sertipikat Mohon Upload Lampiran Ini Pada Saat Pendaftaran.</p>
          </div>
        </div>

        {/* Footer - pushed to bottom */}
        <div className="mt-auto" style={{ fontSize: '11pt' }}>
          <p>Telah Diperiksa</p>
          <p>Sesuai Dengan Arsip Kantah Kab.Bogor II</p>
          <p className="font-bold underline italic" style={{ fontSize: '11pt', marginTop: '20px' }}>NAMA PETUGAS VALIDASI </p>

          <hr className="border-black" style={{ marginTop: '12px', marginBottom: '6px' }} />

          <div style={{ fontSize: '9pt', lineHeight: '1.5' }}>
            <p className="font-bold">Perhatian :</p>
            <p>- Apabila Lampiran ini hilang mohon untuk dikembalikan kepada kantor pertanahan kabupaten Bogor II</p>
            <p>- Dilarang melakukan Pemalsuan seperti mengedit atau merubah data</p>
            <p>- Lampiran ini bersifat Kode Uniq tidak bisa merubah atau memalsukan data</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
