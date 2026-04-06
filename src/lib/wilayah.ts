// Data Kecamatan & Desa wilayah Kabupaten Bogor Timur (7 Kecamatan)
// Sumber: Wikipedia - Daftar kecamatan dan kelurahan di Kabupaten Bogor

export interface KecamatanData {
  kecamatan: string;
  desa: string[];
}

export const wilayahBogorTimur: KecamatanData[] = [
  {
    kecamatan: 'Cariu',
    desa: ['Babakan Raden', 'Bantar Kuning', 'Cariu', 'Cibatu Tiga', 'Cikutamahi', 'Karya Mekar', 'Kuta Mekar', 'Mekarwangi', 'Sukajadi', 'Tegal Panjang'],
  },
  {
    kecamatan: 'Cileungsi',
    desa: ['Cileungsi', 'Cileungsi Kidul', 'Cipenjo', 'Cipeucang', 'Dayeuh', 'Gandoang', 'Jatisari', 'Limus Nunggal', 'Mampir', 'Mekarsari', 'Pasir Angin', 'Situsari'],
  },
  {
    kecamatan: 'Gunung Putri',
    desa: ['Bojong Kulur', 'Bojong Nangka', 'Ciangsana', 'Cicadas', 'Cikeas Udik', 'Gunung Putri', 'Karanggan', 'Nagrak', 'Tlajung Udik', 'Wanaherang'],
  },
  {
    kecamatan: 'Jonggol',
    desa: ['Balekambang', 'Bendungan', 'Cibodas', 'Jonggol', 'Singajaya', 'Singasari', 'Sirnagalih', 'Sukagalih', 'Sukajaya', 'Sukamaju', 'Sukamanah', 'Sukanegara', 'Sukasirna', 'Weninggalih'],
  },
  {
    kecamatan: 'Klapanunggal',
    desa: ['Bantar Jati', 'Bojong', 'Cikahuripan', 'Kembang Kuning', 'Klapanunggal', 'Leuwikaret', 'Ligarmukti', 'Lulut', 'Nambo'],
  },
  {
    kecamatan: 'Sukamakmur',
    desa: ['Cibadak', 'Pabuaran', 'Sirnajaya', 'Sukadamai', 'Sukaharja', 'Sukamakmur', 'Sukamulya', 'Sukaresmi', 'Sukawangi', 'Wargajaya'],
  },
  {
    kecamatan: 'Tanjungsari',
    desa: ['Antajaya', 'Buanajaya', 'Cibadak', 'Pasir Tanjung', 'Selawangi', 'Sirnarasa', 'Sirnasari', 'Sukarasa', 'Tanjungrasa', 'Tanjungsari'],
  },
];

export function getKecamatanList(): string[] {
  return wilayahBogorTimur.map(w => w.kecamatan);
}

export function getDesaByKecamatan(kecamatan: string): string[] {
  const found = wilayahBogorTimur.find(w => w.kecamatan === kecamatan);
  return found ? found.desa : [];
}
