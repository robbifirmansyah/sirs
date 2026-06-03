-- SIRS Online Database Setup Script
-- Paste this into the Supabase SQL Editor

-- 1. Create Tables
CREATE TABLE public.rumah_sakit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_rs VARCHAR(10) UNIQUE NOT NULL,
    nama_rs VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.master_poli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_poli VARCHAR(10) UNIQUE NOT NULL,
    nama_poli VARCHAR(200) NOT NULL
);

CREATE TABLE public.laporan_induk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rs_id UUID NOT NULL REFERENCES public.rumah_sakit(id) ON DELETE CASCADE,
    bulan SMALLINT NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
    tahun SMALLINT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(rs_id, bulan, tahun)
);

CREATE TABLE public.laporan_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laporan_id UUID NOT NULL REFERENCES public.laporan_induk(id) ON DELETE CASCADE,
    poli_id UUID NOT NULL REFERENCES public.master_poli(id),
    dalam_kota_laki INTEGER NOT NULL CHECK (dalam_kota_laki >= 0),
    dalam_kota_perempuan INTEGER NOT NULL CHECK (dalam_kota_perempuan >= 0),
    luar_kota_laki INTEGER NOT NULL CHECK (luar_kota_laki >= 0),
    luar_kota_perempuan INTEGER NOT NULL CHECK (luar_kota_perempuan >= 0),
    hari_buka INTEGER NOT NULL CHECK (hari_buka >= 0),
    rata_kunjungan NUMERIC(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN hari_buka = 0 THEN 0.00
            ELSE (dalam_kota_laki + dalam_kota_perempuan + luar_kota_laki + luar_kota_perempuan)::numeric / hari_buka
        END
    ) STORED,
    UNIQUE(laporan_id, poli_id)
);

-- 2. Insert Seed Data
INSERT INTO public.rumah_sakit (kode_rs, nama_rs) VALUES
('3401015', 'RS Umum Daerah Wates'),
('3401026', 'RSU Santo Yusup Boro'),
('3401037', 'RS Umum Rizki Amalia Medika'),
('3401048', 'RS Umum Kharisma Paramedika'),
('3401050', 'RS Umum PKU Muhammadiyah Nanggulan'),
('3401051', 'RS Umum Rizki Amalia'),
('3401052', 'RS Umum Daerah Nyi Ageng Serang'),
('3401053', 'RS Umum Pura Raharja Medika'),
('3401058', 'RS Umum Queen Latifa');

INSERT INTO public.master_poli (kode_poli, nama_poli) VALUES
('SP01', 'Poli Umum'), ('SP02', 'Poli Penyakit Dalam'), ('SP03', 'Poli Anak'),
('SP04', 'Poli Bedah'), ('SP05', 'Poli Bedah Orthopedi'), ('SP06', 'Poli Kebidanan dan Kandungan (Obgyn)'),
('SP07', 'Poli Saraf'), ('SP08', 'Poli Jantung'), ('SP09', 'Poli Mata'),
('SP10', 'Poli THT'), ('SP11', 'Poli Gigi dan Mulut'), ('SP12', 'Poli Kulit dan Kelamin'),
('SP13', 'Poli Paru'), ('SP14', 'Poli Urologi'), ('SP15', 'Poli Rehabilitasi Medik / Fisioterapi'),
('SP16', 'Poli Gizi'), ('SP17', 'Poli Psikiatri / Jiwa'), ('SP18', 'Poli Onkologi / Kanker'),
('SP19', 'Poli Ginjal / Hemodialisa'), ('SP20', 'Poli Endokrin / Diabetes'), ('SP21', 'Poli Lansia / Geriatri'),
('SP22', 'Poli VCT / HIV'), ('SP23', 'Poli TB DOTS'), ('SP24', 'Poli MCU (Medical Check Up)'),
('SP25', 'Poli Nyeri'), ('SP26', 'Poli Akupunktur'), ('SP27', 'Poli Bedah Mulut'),
('SP28', 'Poli Forensik'), ('SP29', 'Poli Anastesi'), ('SP30', 'Poli Rawat Luka'),
('SP31', 'Poli Laktasi'), ('SP32', 'Poli Tumbuh Kembang Anak'), ('SP33', 'Poli KIA (Kesehatan Ibu dan Anak)'),
('SP34', 'Poli Infeksi'), ('SP35', 'Poli Alergi Imunologi');

-- 3. Enable RLS (Row Level Security) - Basic Setup for now
-- Since we will handle most logic in the Next.js API Routes (server-side using Supabase Admin Client or service role),
-- we can disable direct client-side modifications if desired, but let's just make it so authenticated users can read/write.
ALTER TABLE public.rumah_sakit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_poli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_induk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_detail ENABLE ROW LEVEL SECURITY;

-- Allow public read access to rumah_sakit and master_poli (needed for forms)
CREATE POLICY "Enable read access for all users" ON public.rumah_sakit FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.master_poli FOR SELECT USING (true);

-- Allow authenticated users to read/write reports
CREATE POLICY "Enable full access for authenticated users" ON public.laporan_induk FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for authenticated users" ON public.laporan_detail FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Turn on Realtime for laporan_induk
alter publication supabase_realtime add table public.laporan_induk;
