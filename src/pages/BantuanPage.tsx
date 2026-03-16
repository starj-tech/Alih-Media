import { HelpCircle, UserPlus, KeyRound, Mail, Shield, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function BantuanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Bantuan & Panduan
        </h1>
        <p className="text-muted-foreground mt-1">Panduan penggunaan aplikasi Alih Media BPN Kab. Bogor II</p>
      </div>

      {/* Registration Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-primary" />
            Cara Registrasi Akun Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Registrasi akun baru menggunakan verifikasi OTP (One-Time Password) yang dikirim ke email Anda untuk memastikan keamanan akun.
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Buka Halaman Login', desc: 'Klik tombol "Registrasi" pada halaman login aplikasi.' },
              { step: 2, title: 'Isi Formulir Pendaftaran', desc: 'Lengkapi nama pemohon, nomor HP, email, jenis pengguna, dan password. Pastikan email yang digunakan aktif dan dapat menerima pesan.' },
              { step: 3, title: 'Kirim Permintaan OTP', desc: 'Setelah formulir lengkap, klik "Kirim OTP". Kode OTP 6 digit akan dikirim ke email Anda.' },
              { step: 4, title: 'Masukkan Kode OTP', desc: 'Periksa inbox email Anda (termasuk folder spam). Masukkan 6 digit kode OTP yang diterima. Kode berlaku selama 5 menit.' },
              { step: 5, title: 'Registrasi Selesai', desc: 'Setelah OTP terverifikasi, akun Anda otomatis terdaftar. Silakan login dengan email dan password yang sudah didaftarkan.' },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="w-5 h-5 text-primary" />
            Cara Reset Password (Lupa Password)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Jika Anda lupa password, gunakan fitur "Lupa Password" pada halaman login. Link reset akan dikirim ke email terdaftar.
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: 'Klik "Lupa Password"', desc: 'Pada halaman login, klik tautan "Lupa Password?" di bawah kolom password.' },
              { step: 2, title: 'Masukkan Email', desc: 'Masukkan email yang terdaftar pada akun Anda, lalu klik "Kirim Link Reset".' },
              { step: 3, title: 'Cek Email Anda', desc: 'Periksa inbox email Anda (termasuk folder spam). Anda akan menerima email berisi link untuk reset password. Link berlaku selama 60 menit.' },
              { step: 4, title: 'Klik Link Reset', desc: 'Klik link dalam email tersebut. Anda akan diarahkan ke halaman reset password.' },
              { step: 5, title: 'Buat Password Baru', desc: 'Masukkan password baru (minimal 6 karakter) dan konfirmasi password. Klik "Ubah Password" untuk menyimpan.' },
              { step: 6, title: 'Login Kembali', desc: 'Setelah password berhasil diubah, Anda akan diarahkan ke halaman login. Gunakan password baru untuk masuk.' },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="w-5 h-5 text-primary" />
            Pertanyaan Umum (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-sm">Saya tidak menerima kode OTP di email, bagaimana?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Periksa folder <strong>Spam/Junk</strong> di email Anda.</li>
                  <li>Pastikan email yang dimasukkan benar dan aktif.</li>
                  <li>Tunggu beberapa menit, terkadang email membutuhkan waktu untuk sampai.</li>
                  <li>Gunakan tombol <strong>"Kirim Ulang OTP"</strong> jika sudah melewati 1 menit.</li>
                  <li>Jika masih bermasalah, hubungi admin kantor.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-sm">Kode OTP sudah kedaluwarsa, apa yang harus dilakukan?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Kode OTP berlaku selama <strong>5 menit</strong>. Jika sudah kedaluwarsa, klik tombol "Kirim Ulang OTP" untuk mendapatkan kode baru. Anda perlu menunggu minimal 1 menit sebelum bisa mengirim ulang.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-sm">Link reset password tidak berfungsi?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-4 space-y-1">
                  <li>Link reset berlaku selama <strong>60 menit</strong> sejak dikirim.</li>
                  <li>Pastikan Anda menggunakan link terbaru jika meminta reset lebih dari sekali.</li>
                  <li>Coba salin link secara manual dari email dan tempel di browser.</li>
                  <li>Jika tetap tidak berfungsi, ulangi permintaan reset password dari halaman login.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="text-sm">Email saya sudah terdaftar tapi tidak bisa registrasi?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Setiap email hanya bisa didaftarkan satu kali. Jika email sudah terdaftar, gunakan fitur <strong>"Lupa Password"</strong> untuk mendapatkan akses kembali ke akun Anda. Atau hubungi admin jika perlu bantuan lebih lanjut.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="text-sm">Berapa ukuran maksimal file yang bisa diupload?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Sertifikat</strong>: Format PDF, maksimal 5MB</li>
                  <li><strong>KTP Pemegang Sertifikat</strong>: Format JPG/JPEG, maksimal 5MB</li>
                  <li><strong>Foto Bangunan/Lokasi</strong>: Format JPG/JPEG dengan Geotag, maksimal 5MB</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6">
              <AccordionTrigger className="text-sm">Apa itu status berkas dan artinya?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Proses</strong>: Berkas baru diajukan dan sedang menunggu validasi.</li>
                  <li><strong>Validasi SU & Bidang</strong>: Berkas sedang divalidasi oleh admin SU.</li>
                  <li><strong>Validasi BT</strong>: Berkas sedang divalidasi oleh admin Buku Tanah.</li>
                  <li><strong>Selesai</strong>: Berkas telah selesai diproses dan divalidasi.</li>
                  <li><strong>Ditolak</strong>: Berkas ditolak karena alasan tertentu (lihat catatan penolakan). Anda bisa mengedit dan mengajukan kembali.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="w-5 h-5 text-primary" />
            Hubungi Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Jika Anda mengalami kendala yang tidak bisa diselesaikan melalui panduan di atas, 
            silakan hubungi admin Kantor Pertanahan Kabupaten Bogor II untuk bantuan lebih lanjut.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
