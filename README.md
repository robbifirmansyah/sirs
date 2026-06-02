# SIRS (Sistem Informasi Rumah Sakit)

Aplikasi portal pelaporan terpadu untuk rekapitulasi data kunjungan pasien (Laporan 3.5) dari seluruh Rumah Sakit ke Dinas Kesehatan tingkat daerah.

## Fitur Utama

- **Akses Rumah Sakit**: Form pelaporan dinamis per bulan untuk data pasien (Dalam Kota/Luar Kota, Laki-laki/Perempuan) di berbagai poli.
- **Akses Dinkes**: Dashboard rekapitulasi, Matriks Kepatuhan Laporan, dan kemampuan ekspor ke Excel secara real-time.
- **Role-based Authentication**: Pengamanan rute dan data menggunakan Supabase Auth & Row Level Security (RLS).
- **Modern UI**: Antarmuka modern dan responsif dibangun menggunakan Tailwind CSS & Next.js App Router.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Export Data**: [XLSX (SheetJS)](https://sheetjs.com/)

## Persiapan Pengembangan (Development)

1. Jalankan perintah `npm install` atau `yarn install`.
2. Salin `.env.example` ke `.env.local` (jika ada) lalu isi _credential_ `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Jalankan server lokal:

```bash
npm run dev
```

4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Struktur Database (Supabase)

Struktur tabel lengkap berada pada `supabase_setup.sql`. Gunakan file tersebut pada Query Editor Supabase Anda untuk melakukan inisialisasi awal tabel dan kebijakan keamanannya (RLS).
