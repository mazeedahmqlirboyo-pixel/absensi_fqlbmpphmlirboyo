-- Skema Database: Absensi Jamiyyah Fariyyah PPHM

-- 1. Buat tabel absensi
CREATE TABLE public.absensi (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    jamiyyah text NOT NULL,
    tanggal_jadwal date NOT NULL,
    status_kehadiran text NOT NULL,
    detail_keterlambatan text,
    lokasi text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;

-- 3. Membuat policy: Izinkan siapa saja menyisipkan (insert) riwayat absen
CREATE POLICY "Izinkan insert anonim pada absensi" ON public.absensi
FOR INSERT WITH CHECK (true);

-- 4. Membuat policy: Izinkan siapa saja membaca (select) riwayat absen
CREATE POLICY "Izinkan baca anonim pada absensi" ON public.absensi
FOR SELECT USING (true);

-- 5. Membuat policy: Izinkan update/delete anonim pada absensi (Opsional, khusus untuk fitur hapus & edit)
CREATE POLICY "Izinkan update anonim pada absensi" ON public.absensi
FOR UPDATE USING (true);

CREATE POLICY "Izinkan delete anonim pada absensi" ON public.absensi
FOR DELETE USING (true);

-- Karena Anda minta akumulatif dari semua riwayat sebelumnya dan menggunakan aplikasi public, 
-- tabel kita set agar bisa di insert, di read, di update, dan di delete oleh anonim (anon_key).
