-- Migration: tabel kelas dinamis + relasi siswa
USE pengumuman_kelulusan_smp_pusri;

CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(50) NOT NULL UNIQUE,
  tingkat VARCHAR(20) NULL COMMENT 'Contoh: VII, VIII, IX',
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

-- Tambah class_id ke students (abaikan error jika kolom sudah ada)
ALTER TABLE students ADD COLUMN class_id INT NULL AFTER nama;

-- Hubungkan data lama berdasarkan nama kelas
UPDATE students s
INNER JOIN classes c ON c.nama = s.kelas
SET s.class_id = c.id
WHERE s.class_id IS NULL;

-- FK (jalankan sekali; abaikan jika sudah ada)
-- ALTER TABLE students ADD CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
