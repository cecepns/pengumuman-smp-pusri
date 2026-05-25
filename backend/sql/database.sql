-- Database: pengumuman_kelulusan_smp_pusri
CREATE DATABASE IF NOT EXISTS pengumuman_kelulusan_smp_pusri
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pengumuman_kelulusan_smp_pusri;

-- Admin users
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes (dinamis: VII, VIII, IX, dll.)
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(50) NOT NULL UNIQUE,
  tingkat VARCHAR(20) NULL,
  keterangan VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tingkat (tingkat),
  INDEX idx_active (is_active)
);

INSERT INTO classes (nama, tingkat) VALUES
  ('VII A', 'VII'),
  ('VII B', 'VII'),
  ('VIII A', 'VIII'),
  ('VIII B', 'VIII'),
  ('IX A', 'IX'),
  ('IX B', 'IX'),
  ('IX C', 'IX')
ON DUPLICATE KEY UPDATE tingkat = VALUES(tingkat);

-- Students / peserta pengumuman
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nis VARCHAR(20) NOT NULL UNIQUE,
  nisn VARCHAR(20) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  class_id INT NULL,
  kelas VARCHAR(50) NOT NULL DEFAULT '',
  tanggal_lahir DATE NULL,
  status ENUM('lulus', 'tidak_lulus') NOT NULL DEFAULT 'lulus',
  keterangan TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nis (nis),
  INDEX idx_nisn (nisn),
  INDEX idx_nama (nama),
  INDEX idx_status (status),
  INDEX idx_kelas (kelas),
  INDEX idx_class_id (class_id),
  CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- App settings
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default admin: username admin, password admin123 (bcrypt hash generated in server seed)
INSERT INTO settings (setting_key, setting_value) VALUES
  ('tahun_ajaran', '2025/2026'),
  ('judul_pengumuman', 'Pengumuman Kelulusan SMP PUSRI Palembang'),
  ('tanggal_pengumuman', '2026-05-24'),
  ('pesan_lulus', 'Selamat! Anda dinyatakan LULUS.'),
  ('pesan_tidak_lulus', 'Mohon maaf, Anda belum dinyatakan lulus. Hubungi wali kelas untuk informasi lebih lanjut.')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Sample students (password admin inserted by server on first run if empty)
INSERT INTO students (nis, nisn, nama, class_id, kelas, tanggal_lahir, status, keterangan) VALUES
  ('2024001', '0051234567', 'Ahmad Rizki Pratama', (SELECT id FROM classes WHERE nama = 'IX A' LIMIT 1), 'IX A', '2008-12-31', 'lulus', 'Lulus dengan predikat sangat memuaskan'),
  ('2024002', '0051234568', 'Siti Nurhaliza', (SELECT id FROM classes WHERE nama = 'IX A' LIMIT 1), 'IX A', '2009-01-15', 'lulus', 'Lulus dengan predikat memuaskan'),
  ('2024003', '0051234569', 'Budi Santoso', (SELECT id FROM classes WHERE nama = 'IX B' LIMIT 1), 'IX B', '2008-05-20', 'lulus', NULL),
  ('2024004', '0051234570', 'Dewi Lestari', (SELECT id FROM classes WHERE nama = 'IX B' LIMIT 1), 'IX B', '2008-10-10', 'tidak_lulus', 'Perlu remedial'),
  ('2024005', '0051234571', 'Rizky Ramadhan', (SELECT id FROM classes WHERE nama = 'IX C' LIMIT 1), 'IX C', '2008-08-17', 'lulus', NULL),
  ('2024006', '0051234572', 'Putri Ayu Wulandari', (SELECT id FROM classes WHERE nama = 'IX C' LIMIT 1), 'IX C', '2009-04-21', 'lulus', NULL),
  ('2024007', '0051234573', 'Fajar Nugroho', (SELECT id FROM classes WHERE nama = 'IX A' LIMIT 1), 'IX A', '2008-11-05', 'lulus', NULL),
  ('2024008', '0051234574', 'Maya Sari', (SELECT id FROM classes WHERE nama = 'IX B' LIMIT 1), 'IX B', '2008-07-25', 'lulus', NULL),
  ('2024009', '0051234575', 'Andi Wijaya', (SELECT id FROM classes WHERE nama = 'IX C' LIMIT 1), 'IX C', '2008-02-14', 'tidak_lulus', NULL),
  ('2024010', '0051234576', 'Nina Permata', (SELECT id FROM classes WHERE nama = 'IX A' LIMIT 1), 'IX A', '2008-09-09', 'lulus', NULL),
  ('2024011', '0051234577', 'Hendra Gunawan', (SELECT id FROM classes WHERE nama = 'IX B' LIMIT 1), 'IX B', '2008-03-30', 'lulus', NULL),
  ('2024012', '0051234578', 'Lisa Anggraini', (SELECT id FROM classes WHERE nama = 'IX C' LIMIT 1), 'IX C', '2009-06-18', 'lulus', NULL)
ON DUPLICATE KEY UPDATE nama = VALUES(nama);
