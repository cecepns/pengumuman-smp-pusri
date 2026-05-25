-- Migration: Tambah kolom tanggal_lahir ke tabel students
USE pengumuman_kelulusan_smp_pusri;

-- Tambah kolom tanggal_lahir ke tabel students (jalankan kueri ini di database Anda)
ALTER TABLE students ADD COLUMN tanggal_lahir DATE NULL AFTER kelas;

-- Opsional: Mengisi tanggal lahir sampel untuk siswa bawaan/default (jika ada)
UPDATE students SET tanggal_lahir = '2008-12-31' WHERE nis = '2024001';
UPDATE students SET tanggal_lahir = '2009-01-15' WHERE nis = '2024002';
UPDATE students SET tanggal_lahir = '2008-05-20' WHERE nis = '2024003';
UPDATE students SET tanggal_lahir = '2008-10-10' WHERE nis = '2024004';
UPDATE students SET tanggal_lahir = '2008-08-17' WHERE nis = '2024005';
UPDATE students SET tanggal_lahir = '2009-04-21' WHERE nis = '2024006';
UPDATE students SET tanggal_lahir = '2008-11-05' WHERE nis = '2024007';
UPDATE students SET tanggal_lahir = '2008-07-25' WHERE nis = '2024008';
UPDATE students SET tanggal_lahir = '2008-02-14' WHERE nis = '2024009';
UPDATE students SET tanggal_lahir = '2008-09-09' WHERE nis = '2024010';
UPDATE students SET tanggal_lahir = '2008-03-30' WHERE nis = '2024011';
UPDATE students SET tanggal_lahir = '2009-06-18' WHERE nis = '2024012';
